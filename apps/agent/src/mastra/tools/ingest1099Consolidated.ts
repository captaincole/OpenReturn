import { createTool } from "@mastra/core/tools";
import {
  makeDividendFactKey,
  makeInterestFactKey,
  makeMiscIncomeFactKey,
  type DividendFactValue,
  type InterestFactValue,
  type MiscIncomeFactValue,
} from "@summa/engine/facts";
import { z } from "zod";
import { PayerSchema, recordIngestFact, slugify, type IngestCtx } from "./ingestShared";
import { ingestTrades, TradeInputSchema } from "./ingestTrades";
import { requireUserContext } from "./userContext";

/*
 * Ingest a consolidated 1099 (an E*TRADE-style multi-section statement) as
 * structured tax_facts plus a few broker-reported AI decisions. A
 * standalone 1099-INT, 1099-MISC, 1099-B or 1099-DA is a statement with
 * one section.
 *
 * Luca (vision-capable) reads the 1099 PDF and maps the broker-specific
 * labels to IRS-canonical box numbers. The schema below is what the LLM
 * produces; the tool writes it to the DB.
 *
 * What gets written per call:
 *   - 1 InterestFactValue if `int` is present
 *   - 1 DividendFactValue if `div` is present
 *   - 1 MiscIncomeFactValue if `misc` is present (category "other")
 *   - 1 TradeFactValue per sale in `b.trades` and `da.trades`
 *   - 1 ai_decision per sale (`decisions.trade.{tradeId}.form_8949_box`),
 *     derived mechanically from the broker-reported (term, basisReported)
 *     pair — no grounding review, because the broker classified it
 *   - `decisions.scope.has_reportable_sales` = true if sales are present
 *   - `decisions.scope.has_digital_assets` = true if `da` is present
 *
 * (1099-OID sections land when a scenario needs them.)
 */

const MiscSchema = z.object({
  box1: z.number().optional().describe("Rents"),
  box2: z.number().optional().describe("Royalties"),
  box3: z.number().optional().describe("Other income"),
  box4: z.number().optional().describe("Federal income tax withheld"),
  box5: z.number().optional().describe("Fishing boat proceeds"),
  box6: z.number().optional().describe("Medical and health care payments"),
  box7: z.boolean().optional().describe("Direct sales of $5,000 or more (checkbox)"),
  box8: z.number().optional().describe("Substitute payments in lieu of dividends or interest"),
  box9: z.number().optional().describe("Crop insurance proceeds"),
  box10: z.number().optional().describe("Gross proceeds paid to an attorney"),
  box11: z.number().optional().describe("Fish purchased for resale"),
  box12: z.number().optional().describe("Section 409A deferrals"),
  box13: z.boolean().optional().describe("FATCA filing requirement"),
  box14: z.number().optional().describe("Excess golden parachute payments"),
  box15: z.number().optional().describe("Nonqualified deferred compensation"),
  box16: z.number().optional().describe("State tax withheld"),
  box17: z.string().optional().describe("State / payer's state number"),
  box18: z.number().optional().describe("State income"),
});

const inputSchema = z.object({
  year: z.number().int(),
  accountSlug: z
    .string()
    .optional()
    .describe(
      "Stable slug for this account in fact keys. Defaults to slugified payer name. Use a single short token like 'apex-individual' or 'fidelity-brokerage'.",
    ),
  payer: PayerSchema,
  accountNumber: z.string(),
  int: z
    .object({
      box1: z.number().optional().describe("Interest income"),
      box2: z.number().optional().describe("Early withdrawal penalty"),
      box3: z.number().optional().describe("Interest on US savings bonds and Treasury obligations"),
      box4: z.number().optional().describe("Federal income tax withheld"),
      box5: z.number().optional().describe("Investment expenses"),
      box6: z.number().optional().describe("Foreign tax paid"),
      box7: z.string().optional().describe("Foreign country or US territory"),
      box8: z.number().optional().describe("Tax-exempt interest"),
      box9: z.number().optional().describe("Specified private activity bond interest"),
      box10: z.number().optional().describe("Market discount"),
      box11: z.number().optional().describe("Bond premium"),
      box12: z.number().optional().describe("Bond premium on Treasury obligations"),
      box13: z.number().optional().describe("Bond premium on tax-exempt bonds"),
      box15: z.string().optional().describe("State"),
      box16: z.string().optional().describe("State identification number"),
      box17: z.number().optional().describe("State income tax withheld"),
    })
    .optional()
    .describe(
      "1099-INT section. Pass only the boxes that have non-zero values; omit the entire object if the section is absent or all-zero.",
    ),
  div: z
    .object({
      box1a: z.number().optional().describe("Total ordinary dividends"),
      box1b: z.number().optional().describe("Qualified dividends"),
      box2a: z.number().optional().describe("Total capital gain distributions"),
      box2b: z.number().optional().describe("Unrecap. Sec. 1250 gain"),
      box2d: z.number().optional().describe("Collectibles (28%) gain"),
      box3: z.number().optional().describe("Non-dividend distributions"),
      box4: z.number().optional().describe("Federal income tax withheld"),
      box5: z.number().optional().describe("Section 199A dividends"),
      box6: z.number().optional().describe("Investment expenses"),
      box7: z.number().optional().describe("Foreign tax paid"),
      box9: z.number().optional(),
      box10: z.number().optional(),
      box12: z.number().optional().describe("Exempt-interest dividends"),
      box13: z.number().optional(),
    })
    .optional()
    .describe(
      "1099-DIV section. Pass only the boxes that have non-zero values; omit the entire object if the section is absent or all-zero.",
    ),
  misc: MiscSchema.optional().describe(
    "1099-MISC section (or a standalone 1099-MISC). Pass only non-zero boxes; omit if absent.",
  ),
  b: z
    .object({ trades: z.array(TradeInputSchema) })
    .optional()
    .describe(
      "1099-B section with per-trade detail. Omit the entire object if there are no reportable sales.",
    ),
  da: z
    .object({ trades: z.array(TradeInputSchema) })
    .optional()
    .describe(
      "1099-DA section (digital asset sales) with per-sale detail. Omit if there is no 1099-DA.",
    ),
  sourceNote: z.string().default("Consolidated 1099 ingested via structured payload"),
});
type Input = z.input<typeof inputSchema>;

interface Counts {
  factsWritten: number;
  decisionsWritten: number;
  tradeIds: string[];
}

/* INT, DIV and MISC: one box-totals fact each. */
async function ingestBoxSections(ctx: IngestCtx, slug: string, input: Input): Promise<number> {
  const payer = { payerName: input.payer.name, payerTin: input.payer.tin };
  let written = 0;
  if (input.int) {
    const value: InterestFactValue = { ...payer, ...input.int };
    await recordIngestFact(ctx, "investment_income", makeInterestFactKey(slug), value);
    written++;
  }
  if (input.div) {
    const value: DividendFactValue = { ...payer, ...input.div };
    await recordIngestFact(ctx, "investment_income", makeDividendFactKey(slug), value);
    written++;
  }
  if (input.misc) {
    const value: MiscIncomeFactValue = { ...payer, ...input.misc };
    await recordIngestFact(ctx, "other", makeMiscIncomeFactKey(slug), value);
    written++;
  }
  return written;
}

/* 1099-B and 1099-DA: one fact + one box decision per sale. */
async function ingestSaleSections(ctx: IngestCtx, slug: string, input: Input): Promise<Counts> {
  const out: Counts = { factsWritten: 0, decisionsWritten: 0, tradeIds: [] };
  const sections = [
    { trades: input.b?.trades ?? [], digitalAsset: false },
    { trades: input.da?.trades ?? [], digitalAsset: true },
  ];
  for (const { trades, digitalAsset } of sections) {
    if (trades.length === 0) continue;
    const r = await ingestTrades(ctx, slug, trades, input.payer.name, { digitalAsset });
    out.tradeIds.push(...r.tradeIds);
    out.factsWritten += r.tradeIds.length;
    out.decisionsWritten += r.decisionsWritten;
  }
  return out;
}

export const ingest1099Consolidated = createTool({
  id: "ingest-1099-consolidated",
  description:
    "Ingest a consolidated 1099 (a multi-section broker statement), or a standalone 1099-INT / 1099-DIV / 1099-MISC / 1099-B / 1099-DA as a one-section statement. Luca reads the PDF and maps each broker's labels to IRS-canonical box numbers, then calls this tool with the structured data. Writes one tax fact per INT / DIV / MISC section, one per sale in the B and DA sections, and broker-reported classification decisions. Call ONCE per statement. OID sections are not yet supported — tell the user to call out what you see in those sections so we can add support when we hit a scenario that needs it.",
  inputSchema,
  outputSchema: z.object({
    accountSlug: z.string(),
    factsWritten: z.number(),
    decisionsWritten: z.number(),
    tradeIds: z.array(z.string()),
  }),
  execute: async (input, context) => {
    const { scope, userId, filingId } = await requireUserContext(context);
    const slug =
      input.accountSlug || slugify(input.payer.name) || `tin-${input.payer.tin.replace(/-/g, "")}`;
    const ctx: IngestCtx = {
      scope,
      userId,
      filingId,
      year: input.year,
      sourceNote: input.sourceNote,
    };
    const boxFacts = await ingestBoxSections(ctx, slug, input);
    const sales = await ingestSaleSections(ctx, slug, input);
    return {
      accountSlug: slug,
      factsWritten: boxFacts + sales.factsWritten,
      decisionsWritten: sales.decisionsWritten,
      tradeIds: sales.tradeIds,
    };
  },
});
