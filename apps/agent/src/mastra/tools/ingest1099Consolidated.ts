import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  makeDividendFactKey,
  makeInterestFactKey,
  makeTradeFactKey,
  type DividendFactValue,
  type InterestFactValue,
  type TradeFactValue,
} from "../../engine/facts";
import { recordDecision } from "../db/aiDecisions";
import type { Scope } from "../db/appDb";
import { recordFact } from "../db/taxFacts";
import { requireUserContext } from "./userContext";

/*
 * Ingest a consolidated 1099 (an E*TRADE-style multi-section statement) as
 * structured tax_facts plus a few broker-reported AI decisions.
 *
 * Luca (vision-capable) reads the 1099 PDF and maps the broker-specific
 * labels to IRS-canonical box numbers. The schema below is what the LLM
 * produces; the tool writes it to the DB.
 *
 * What gets written per call:
 *   - 1 InterestFactValue if `int` is present
 *   - 1 DividendFactValue if `div` is present
 *   - 1 TradeFactValue per trade in `b.trades`
 *   - 1 ai_decision per trade (`decisions.trade.{tradeId}.form_8949_box`),
 *     derived mechanically from the broker-reported (term, basisReported)
 *     pair — no grounding review, because the broker classified it
 *   - 1 ai_decision (`decisions.scope.has_reportable_sales` = true) if
 *     trades are present
 *
 * (1099-MISC / 1099-OID sections land when a scenario needs them. INT,
 * DIV, and B are accepted.)
 */

const TradeInputSchema = z.object({
  description: z.string().describe("Security description, e.g. 'APPLE INC'"),
  cusip: z.string().optional(),
  symbol: z.string().optional().describe("Ticker symbol"),
  quantity: z.number(),
  dateAcquired: z.string().describe("MM/DD/YY as printed on the 1099-B"),
  dateSold: z.string().describe("MM/DD/YY as printed"),
  proceeds: z.number(),
  costBasis: z
    .number()
    .optional()
    .describe("Omit for noncovered securities where basis isn't reported"),
  adjustmentCode: z.string().optional().describe("Form 8949 column (f) code, if present"),
  adjustmentAmount: z.number().optional(),
  washSaleLossDisallowed: z.number().optional(),
  federalIncomeTaxWithheld: z.number().optional(),
  term: z
    .enum(["short_term", "long_term", "unknown"])
    .describe(
      "Holding period. Read this from the 1099-B section header on the PDF: 'Long Term' / 'Short Term' / 'Unknown Term'. Don't compute it from dates — trust what the broker reported.",
    ),
  basisReported: z
    .boolean()
    .describe(
      "True for 'Covered Securities' (basis reported to IRS), false for 'Noncovered Securities'. Read from the section header.",
    ),
});
type TradeInput = z.infer<typeof TradeInputSchema>;

/** Shared write context for the per-section ingest helpers. */
interface IngestCtx {
  scope: Scope;
  userId: string;
  filingId: string;
  year: number;
  sourceNote: string | undefined;
}

/** One investment_income fact row — the INT / DIV / trade write shape. */
async function recordInvestmentFact(ctx: IngestCtx, key: string, value: unknown): Promise<void> {
  await recordFact(ctx.scope, {
    id: crypto.randomUUID(),
    userId: ctx.userId,
    filingId: ctx.filingId,
    taxYear: ctx.year,
    category: "investment_income",
    key,
    value,
    sourceNote: ctx.sourceNote,
  });
}

const AddressSchema = z.object({
  line1: z.string(),
  line2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
});

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const tradeIdFor = (t: {
  symbol?: string;
  cusip?: string;
  description: string;
  dateAcquired: string;
  dateSold: string;
  quantity: number;
}): string => {
  const ticker = t.symbol ?? t.cusip ?? slugify(t.description);
  // MM/DD/YY → YYYY-MM-DD slug for stable, sortable IDs
  const slugDate = (d: string) => {
    const m = d.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
    if (!m) return slugify(d);
    const [, mm, dd, yy] = m;
    return `20${yy}-${mm}-${dd}`;
  };
  return `${slugify(ticker)}-${slugDate(t.dateSold)}-q${t.quantity}`;
};

// Map the broker-reported (term, basisReported) pair to a Form 8949 box.
const boxFor = (term: "short_term" | "long_term" | "unknown", basisReported: boolean): string => {
  if (term === "short_term") return basisReported ? "partI.boxA" : "partI.boxB";
  if (term === "long_term") return basisReported ? "partII.boxD" : "partII.boxE";
  // Unknown term → fall back to the short-term boxes (A/B).
  return basisReported ? "partI.boxA" : "partI.boxB";
};

export const ingest1099Consolidated = createTool({
  id: "ingest-1099-consolidated",
  description:
    "Ingest a consolidated 1099 (a multi-section broker statement). Luca reads the PDF and maps each broker's labels to IRS-canonical box numbers, then calls this tool with the structured data. Writes one tax fact for the INT section, one for the dividend section, one per trade in the B section, and broker-reported classification decisions. Call ONCE per consolidated 1099. MISC/OID sections are not yet supported — tell the user to call out what you see in those sections so we can add support when we hit a scenario that needs it.",
  inputSchema: z.object({
    year: z.number().int(),
    accountSlug: z
      .string()
      .optional()
      .describe(
        "Stable slug for this account in fact keys. Defaults to slugified payer name. Use a single short token like 'apex-individual' or 'fidelity-brokerage'.",
      ),
    payer: z.object({
      name: z.string(),
      tin: z.string().describe("Federal Identification Number printed on the 1099"),
      phone: z.string().optional(),
      address: AddressSchema.optional(),
    }),
    accountNumber: z.string(),
    int: z
      .object({
        box1: z.number().optional().describe("Interest income"),
        box2: z.number().optional().describe("Early withdrawal penalty"),
        box3: z
          .number()
          .optional()
          .describe("Interest on US savings bonds and Treasury obligations"),
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
    b: z
      .object({
        trades: z.array(TradeInputSchema),
      })
      .optional()
      .describe(
        "1099-B section with per-trade detail. Omit the entire object if there are no reportable sales.",
      ),
    sourceNote: z.string().default("Consolidated 1099 ingested via structured payload"),
  }),
  outputSchema: z.object({
    accountSlug: z.string(),
    factsWritten: z.number(),
    decisionsWritten: z.number(),
    tradeIds: z.array(z.string()),
  }),
  execute: async (input, context) => {
    const { scope, userId, filingId } = await requireUserContext(context);
    const { year, sourceNote } = input;
    const slug =
      input.accountSlug || slugify(input.payer.name) || `tin-${input.payer.tin.replace(/-/g, "")}`;

    const ctx: IngestCtx = { scope, userId, filingId, year, sourceNote };
    const payer = { payerName: input.payer.name, payerTin: input.payer.tin };
    let factsWritten = 0;
    let decisionsWritten = 0;
    const tradeIds: string[] = [];

    // ─── Interest section ───
    if (input.int) {
      const value: InterestFactValue = { ...payer, ...input.int };
      await recordInvestmentFact(ctx, makeInterestFactKey(slug), value);
      factsWritten++;
    }

    // ─── Dividend section ───
    if (input.div) {
      const value: DividendFactValue = { ...payer, ...input.div };
      await recordInvestmentFact(ctx, makeDividendFactKey(slug), value);
      factsWritten++;
    }

    // ─── 1099-B trades ───
    if (input.b && input.b.trades.length > 0) {
      const trades = await ingestTrades(ctx, slug, input.b.trades, input.payer.name);
      tradeIds.push(...trades.tradeIds);
      factsWritten += trades.tradeIds.length;
      decisionsWritten += trades.decisionsWritten;
    }

    return { accountSlug: slug, factsWritten, decisionsWritten, tradeIds };
  },
});

/*
 * Write one trade's fact row plus its form_8949_box decision. The
 * decision is auto-recorded — the broker already classified the sale.
 * The write goes directly through recordDecision and skips the grounding
 * review; the input is broker-reported, not a judgment call.
 */
async function ingestOneTrade(ctx: IngestCtx, slug: string, t: TradeInput): Promise<string> {
  const { scope, userId, filingId, year, sourceNote } = ctx;
  const tradeId = tradeIdFor(t);
  const trade: TradeFactValue = {
    tradeId,
    description: t.description,
    cusip: t.cusip,
    symbol: t.symbol,
    quantity: t.quantity,
    dateAcquired: t.dateAcquired,
    dateSold: t.dateSold,
    proceeds: t.proceeds,
    costBasis: t.costBasis ?? 0,
    adjustmentCode: t.adjustmentCode,
    adjustmentAmount: t.adjustmentAmount,
  };
  await recordFact(scope, {
    id: crypto.randomUUID(),
    userId,
    filingId,
    taxYear: year,
    category: "investment_income",
    key: makeTradeFactKey(slug, tradeId),
    value: trade,
    sourceNote,
  });

  const box = boxFor(t.term, t.basisReported);
  await recordDecision(scope, {
    id: crypto.randomUUID(),
    userId,
    filingId,
    taxYear: year,
    decisionKey: `decisions.trade.${tradeId}.form_8949_box`,
    decision: box,
    rationale:
      `Broker reported ${t.term === "long_term" ? "long-term" : t.term === "short_term" ? "short-term" : "unknown-term"} ` +
      `${t.basisReported ? "covered" : "noncovered"} sale → Form 8949 ${box}.`,
    supportingFactKeys: [makeTradeFactKey(slug, tradeId)],
    confidence: "high",
    sourceNote: "Auto-classified during 1099 ingest (broker-reported section)",
  });
  return tradeId;
}

/*
 * Ingest every 1099-B trade (one fact + one box decision each), then
 * record the has_reportable_sales scope decision that gates Form 8949 /
 * Schedule D.
 */
async function ingestTrades(
  ctx: IngestCtx,
  slug: string,
  trades: TradeInput[],
  payerName: string,
): Promise<{ tradeIds: string[]; decisionsWritten: number }> {
  const tradeIds: string[] = [];
  for (const t of trades) {
    tradeIds.push(await ingestOneTrade(ctx, slug, t));
  }

  await recordDecision(ctx.scope, {
    id: crypto.randomUUID(),
    userId: ctx.userId,
    filingId: ctx.filingId,
    taxYear: ctx.year,
    decisionKey: "decisions.scope.has_reportable_sales",
    decision: true,
    rationale: `Consolidated 1099 from ${payerName} contains a populated 1099-B section with ${trades.length} reportable sale(s).`,
    supportingFactKeys: tradeIds.map((id) => makeTradeFactKey(slug, id)),
    confidence: "high",
    sourceNote: "Auto-recorded during 1099 ingest",
  });
  /* decisions: one per trade + the scope decision */
  return { tradeIds, decisionsWritten: tradeIds.length + 1 };
}
