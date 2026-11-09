import { createTool } from "@mastra/core/tools";
import { ASSUMABLE_KEYS } from "@openreturn/engine";
import { z } from "zod";
import { recordAssumptions as storeAssumptions } from "../db/assumptions";
import { cadeRequestContextSchema } from "../server/requestContext";
import { CATEGORIES, MAX_FACTS_PER_CALL } from "./taxFacts";
import { requireUserContext } from "./userContext";

const assumptionInput = z.object({
  category: z.enum(CATEGORIES).describe("Fact category bucket, as for the fact it stands in for"),
  key: z
    .enum(ASSUMABLE_KEYS as [string, ...string[]])
    .describe("The fact key it stands in for: a deduction amount, such as 'charitable.cash'"),
  value: z.number().describe("The taxpayer's rough amount, in dollars"),
  sourceNote: z
    .string()
    .describe("The taxpayer's words and the date, e.g. 'about $12,000, verbal, 2026-11-08'"),
});

export const recordAssumptions = createTool({
  id: "record-assumptions",
  requestContextSchema: cadeRequestContextSchema,
  description: `Store 1 to ${MAX_FACTS_PER_CALL} assumptions: rough amounts the taxpayer gave because they do not know the exact number yet ("about $12,000 of mortgage interest"). An assumption is for calculations only, such as itemized against standard. It fills a fact key that has no fact, and a fact for that key always wins. While any assumption is in use, the return is not ready to file: get-case-state lists them in pendingAssumptions, and each needs its fact (the document, or the exact amount). Never make up an amount: record only a number the taxpayer said. Use record-tax-facts when the taxpayer knows the amount. For mortgage interest, also record a rough loan balance ('mortgage.outstanding_principal_form_1098'): the interest line needs both. If the taxpayer takes an amount back, record the fact instead (0 if none); the assumption then drops out.`,
  inputSchema: z.object({
    year: z.number().int().describe("Tax year (e.g. 2025)"),
    // No .max(): the cap is enforced in execute, with an error that says how to split.
    assumptions: z.array(assumptionInput).describe(`1 to ${MAX_FACTS_PER_CALL} assumptions`),
  }),
  outputSchema: z.object({
    recorded: z.array(z.object({ key: z.string(), id: z.string() })),
  }),
  execute: async (input, context) => {
    const { assumptions, year } = input;
    if (assumptions.length === 0 || assumptions.length > MAX_FACTS_PER_CALL) {
      throw new Error(
        `record-assumptions takes 1 to ${MAX_FACTS_PER_CALL} assumptions; got ${assumptions.length}. Nothing was recorded. Split them into calls of ${MAX_FACTS_PER_CALL} or fewer.`,
      );
    }
    const { scope, userId, filingId } = await requireUserContext(context);
    const rows = assumptions.map((assumption) => ({
      id: crypto.randomUUID(),
      userId,
      filingId,
      taxYear: year,
      ...assumption,
    }));
    await storeAssumptions(scope, rows);
    return { recorded: rows.map(({ key, id }) => ({ key, id })) };
  },
});
