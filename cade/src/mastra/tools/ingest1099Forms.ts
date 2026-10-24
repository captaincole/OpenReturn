import { createTool } from "@mastra/core/tools";
import {
  makeDividendFactKey,
  makeInterestFactKey,
  makeMiscIncomeFactKey,
  type DividendFactValue,
  type InterestFactValue,
  type MiscIncomeFactValue,
} from "@openreturn/engine/facts";
import { z } from "zod";
import { recordIngestFact, statementContext, statementFields } from "./ingestShared";

/*
 * Ingest one 1099-INT, 1099-DIV or 1099-MISC as one box-totals fact. A
 * consolidated broker statement is several of these forms (plus a 1099-B,
 * see ingest1099B.ts) in one PDF: Cade makes one call per form on it.
 *
 * Short calls are the point. One call for a whole statement put the box
 * totals after a long list of trades, and local models (Gemma 4 31b)
 * broke the nesting there about half the time, which lost the whole call.
 *
 * Fact value: { payerName, payerTin, ...the non-zero boxes }.
 */

const ONLY_NON_ZERO = "Pass only the boxes that have non-zero values.";

type Payer = "payerName" | "payerTin";

/*
 * One schema per box of the engine's fact value: a missing box, an extra
 * box, or a box whose type differs from the engine's fails to compile.
 */
type BoxSchemas<V> = { [K in keyof Omit<V, Payer>]-?: z.ZodType<V[K]> };

interface FormSpec<V> {
  id: string;
  form: string;
  category: string;
  factKey: (slug: string) => string;
  boxes: BoxSchemas<V>;
  description: string;
}

function formTool<V extends { payerName: string; payerTin?: string }>(spec: FormSpec<V>) {
  return createTool({
    id: spec.id,
    description: `${spec.description} ${ONLY_NON_ZERO}`,
    inputSchema: z.object({ ...statementFields, ...(spec.boxes as z.ZodRawShape) }),
    outputSchema: z.object({ accountSlug: z.string(), factKey: z.string() }),
    execute: async (input, context) => {
      const { ctx, slug } = await statementContext(input, context, spec.form);
      const boxes = Object.entries(input).filter(([k]) => k in spec.boxes);
      const factKey = spec.factKey(slug);
      /* The boxes passed the schemas above, which BoxSchemas ties to V. */
      const value = {
        payerName: input.payer.name,
        payerTin: input.payer.tin,
        ...Object.fromEntries(boxes),
      } as V;
      await recordIngestFact(ctx, spec.category, factKey, value);
      return { accountSlug: slug, factKey };
    },
  });
}

export const ingest1099Int = formTool<InterestFactValue>({
  id: "ingest-1099-int",
  form: "1099-INT",
  category: "investment_income",
  factKey: makeInterestFactKey,
  description:
    "Ingest one 1099-INT: a standalone form, or the 1099-INT section of a consolidated statement.",
  boxes: {
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
  },
});

export const ingest1099Div = formTool<DividendFactValue>({
  id: "ingest-1099-div",
  form: "1099-DIV",
  category: "investment_income",
  factKey: makeDividendFactKey,
  description:
    "Ingest one 1099-DIV: a standalone form, or the 1099-DIV section of a consolidated statement.",
  boxes: {
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
  },
});

export const ingest1099Misc = formTool<MiscIncomeFactValue>({
  id: "ingest-1099-misc",
  form: "1099-MISC",
  category: "other",
  factKey: makeMiscIncomeFactKey,
  description:
    "Ingest one 1099-MISC: a standalone form, or the 1099-MISC section of a consolidated statement.",
  boxes: {
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
  },
});
