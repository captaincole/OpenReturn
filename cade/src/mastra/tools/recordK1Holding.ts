import { createTool } from "@mastra/core/tools";
import {
  K1_CATEGORY,
  makeK1HoldingFactKey,
  type K1CarriedBasisLosses,
  type K1CarriedLosses,
  type K1HoldingFactValue,
} from "@openreturn/engine/facts";
import { z } from "zod";
import { listFactsByKeys } from "../db/taxFacts";
import { cadeRequestContextSchema } from "../server/requestContext";
import { recordIngestFact } from "./ingestShared";
import { requireUserContext } from "./userContext";

const amount = z.number().nonnegative();

/* A missing, extra or mistyped item (against the engine's type) fails to compile. */
const basisLosses: { [K in keyof K1CarriedBasisLosses]-?: z.ZodType<K1CarriedBasisLosses[K]> } = {
  ordinaryBusinessLoss: amount.optional().describe("Line 35"),
  netRentalRealEstateLoss: amount.optional().describe("Line 36"),
  otherNetRentalLoss: amount.optional().describe("Line 37"),
  netShortTermCapitalLoss: amount.optional().describe("Line 38, the short-term part"),
  netLongTermCapitalLoss: amount.optional().describe("Line 38, the long-term part"),
  netSection1231Loss: amount.optional().describe("Line 39"),
  otherLoss: amount.optional().describe("Line 40"),
  section179Deduction: amount.optional().describe("Line 41"),
  cashCharitableContributions: amount
    .optional()
    .describe("Line 42: cash gifts to 60% organizations (box 12 code A)"),
  otherCharitableContributions: amount.optional().describe("Line 42: every other gift"),
  investmentInterestExpense: amount.optional().describe("Line 43"),
  section59eExpenditures: amount.optional().describe("Line 44"),
  otherDeductions: amount.optional().describe("Line 45"),
  foreignTaxes: amount.optional().describe("Line 46"),
};

const carriedLosses: { [K in keyof K1CarriedLosses]-?: z.ZodType<K1CarriedLosses[K]> } = {
  basis: z
    .object(basisLosses)
    .optional()
    .describe(
      "S corporation: losses the basis limit held back, by item, positive amounts: last year's Form 7203 Part III column (e)",
    ),
  atRisk: amount.optional().describe("Loss held back by the at-risk limit (last year's Form 6198)"),
  passive: amount.optional().describe("Prior-year unallowed passive loss (last year's Form 8582)"),
};

const answers: { [K in keyof K1HoldingFactValue]-?: z.ZodType<K1HoldingFactValue[K]> } = {
  owner: z
    .enum(["taxpayer", "spouse"])
    .optional()
    .describe("On a joint return, whose K-1 it is: the person Part II names"),
  materiallyParticipated: z
    .boolean()
    .optional()
    .describe("The owner materially participated in the entity's business (the seven tests)"),
  activelyParticipated: z
    .boolean()
    .optional()
    .describe("The owner actively participated in the entity's rental real estate"),
  realEstateProfessional: z
    .boolean()
    .optional()
    .describe("A real estate professional who materially participated in the entity's rentals"),
  stockBasisAtStart: amount
    .optional()
    .describe(
      "S corporation: stock basis at the start of the year (last year's Form 7203 line 15)",
    ),
  capitalContributions: amount
    .optional()
    .describe("S corporation: capital contributed or stock bought this year (Form 7203 line 2)"),
  loanBalanceAtStart: amount
    .optional()
    .describe("S corporation: the owner's loans to it at the start of the year; 0 if none"),
  newLoans: amount.optional().describe("S corporation: new loans to it this year; 0 if none"),
  debtBasisAtStart: amount
    .optional()
    .describe(
      "S corporation: debt basis of the loans at the start of the year (Form 7203 line 21)",
    ),
  stockAcquiredAs: z
    .enum(["original_shareholder", "purchased", "inherited", "gift", "other"])
    .optional()
    .describe("S corporation: how the stock was acquired (Form 7203 item D)"),
  partnershipBasisAtStart: amount
    .optional()
    .describe("Partnership: adjusted basis of the interest at the start of the year"),
  allInvestmentAtRisk: z
    .boolean()
    .optional()
    .describe("All of the owner's investment in the activity is at risk"),
  carriedLosses: z
    .object(carriedLosses)
    .optional()
    .describe("Losses held back in earlier years, by limit; pass every carried amount each time"),
  carriedQualifiedBusinessLoss: amount
    .optional()
    .describe(
      "The qualified (QBI) part of the carried ordinary loss: the QBI Loss Tracking Worksheet; losses from before 2018 are not qualified",
    ),
  disposedOfEntirely: z
    .boolean()
    .optional()
    .describe("The owner sold or gave up the entire interest this year, or the trust ended"),
  gainOnDisposition: z
    .number()
    .optional()
    .describe(
      "The gain on the sale of the entire interest, signed: a loss is negative. Only when the owner sold the whole interest in a partnership this year",
    ),
};

const definedOnly = <T extends object>(value: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(value).filter(([, field]) => field !== undefined),
  ) as Partial<T>;

/* The answers recorded so far with this call's on top; a field this call leaves out keeps its answer. */
export function mergeHolding(
  previous: K1HoldingFactValue | undefined,
  given: K1HoldingFactValue,
): K1HoldingFactValue {
  return { ...previous, ...definedOnly(given) };
}

const isRecord = (value: unknown): value is K1HoldingFactValue =>
  typeof value === "object" && value !== null;

export const recordK1Holding = createTool({
  id: "record-k1-holding",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Record the owner's answers about one Schedule K-1 entity that no K-1 prints: whose it is, participation, at-risk, S corporation basis and loans, and losses carried from earlier years. Pass the entityId that ingest-schedule-k1 returned. Pass only the answers the user gave: a field you leave out keeps its earlier answer. Writes the fact k1.holding.<entityId> under category 'k1'.",
  inputSchema: z.object({
    year: z.number().int(),
    entityId: z.string().describe("The entityId ingest-schedule-k1 returned for this K-1"),
    ...answers,
    sourceNote: z.string().default("K-1 holding answers stated by the user"),
  }),
  outputSchema: z.object({ factKey: z.string(), holding: z.record(z.string(), z.unknown()) }),
  execute: async (input, context) => {
    const { scope, userId, filingId } = await requireUserContext(context);
    const { year, sourceNote, entityId, ...given } = input;
    const factKey = makeK1HoldingFactKey(entityId);
    const [previous] = await listFactsByKeys(scope, year, [factKey]);
    const holding = mergeHolding(isRecord(previous?.value) ? previous.value : undefined, given);
    await recordIngestFact(
      { scope, userId, filingId, year, sourceNote },
      K1_CATEGORY,
      factKey,
      holding,
    );
    return { factKey, holding: { ...holding } };
  },
});
