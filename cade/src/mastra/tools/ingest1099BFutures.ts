import { createTool } from "@mastra/core/tools";
import {
  makeSection1256StatementFactKey,
  type Section1256StatementFactValue,
} from "@openreturn/engine/facts";
import { z } from "zod";
import { cadeRequestContextSchema } from "../server/requestContext";
import {
  accountSlugFor,
  recordIngestFact,
  statementContext,
  statementFields,
} from "./ingestShared";

/*
 * A 1099-B for regulated futures, foreign currency and section 1256 option
 * contracts fills boxes 8 to 11 with the year's totals and has no sales, so it
 * is its own tool: one fact per account, which Form 6781 line 1 reads.
 */

const SECTION_1256_CATEGORY = "capital_gains";

const profitOrLoss = (label: string) =>
  z
    .number()
    .optional()
    .describe(
      `${label}. A loss is negative: (1,250.00) or -1,250.00 is -1250. Leave it out when the box is blank.`,
    );

const futuresInputSchema = z.object({
  ...statementFields,
  box8: profitOrLoss("Box 8, Profit or (loss) realized in the year on closed contracts"),
  box9: profitOrLoss(
    "Box 9, Unrealized profit or (loss) on open contracts at the end of the prior year",
  ),
  box10: profitOrLoss(
    "Box 10, Unrealized profit or (loss) on open contracts at the end of the year",
  ),
  box11: profitOrLoss("Box 11, Aggregate profit or (loss) on contracts"),
});

export type Ingest1099BFuturesInput = z.infer<typeof futuresInputSchema>;

/* The fact the tool records, with no database: the boxes as printed, nothing worked out. */
export function section1256StatementFact(input: Ingest1099BFuturesInput): {
  category: string;
  key: string;
  value: Section1256StatementFactValue;
} {
  const boxes = { box8: input.box8, box9: input.box9, box10: input.box10, box11: input.box11 };
  const printed = Object.entries(boxes).filter(([, amount]) => amount !== undefined);
  const value: Section1256StatementFactValue = {
    brokerName: input.payer.name,
    ...(input.accountNumber === undefined ? {} : { accountNumber: input.accountNumber }),
    ...Object.fromEntries(printed),
  };
  return {
    category: SECTION_1256_CATEGORY,
    key: makeSection1256StatementFactKey(accountSlugFor(input)),
    value,
  };
}

export const ingest1099BFutures = createTool({
  id: "ingest-1099-b-futures",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Ingest one Form 1099-B that reports regulated futures, foreign currency or section 1256 option contracts in boxes 8 to 11 (the year's totals, no sales). Call ONCE per account. Copy boxes 8, 9, 10 and 11 as printed; do not work out box 11 from the others. Writes one fact under category 'capital_gains'.",
  inputSchema: futuresInputSchema,
  outputSchema: z.object({ factKey: z.string() }),
  execute: async (input, context) => {
    const { ctx } = await statementContext(input, context, "1099-B");
    const fact = section1256StatementFact(input);
    await recordIngestFact(ctx, fact.category, fact.key, fact.value);
    return { factKey: fact.key };
  },
});
