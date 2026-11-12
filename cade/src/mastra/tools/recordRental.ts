import { createTool } from "@mastra/core/tools";
import {
  makeRentalFactKey,
  type RentalExpenses,
  type RentalFactValue,
} from "@openreturn/engine/facts";
import { z } from "zod";
import type { Scope } from "../db/appDb";
import { listFactsByKeys } from "../db/taxFacts";
import { cadeRequestContextSchema } from "../server/requestContext";
import { recordIngestFact, slugify } from "./ingestShared";
import { requireUserContext } from "./userContext";

const amount = z.number().nonnegative();
const days = z.number().int().min(0).max(366);

/* A missing, extra or mistyped expense (against the engine's type) fails to compile. */
const expenses: { [K in keyof RentalExpenses]-?: z.ZodType<RentalExpenses[K]> } = {
  advertising: amount.optional().describe("Line 5"),
  autoAndTravel: amount.optional().describe("Line 6"),
  cleaningAndMaintenance: amount.optional().describe("Line 7"),
  commissions: amount.optional().describe("Line 8"),
  insurance: amount.optional().describe("Line 9"),
  legalAndProfessional: amount.optional().describe("Line 10"),
  managementFees: amount.optional().describe("Line 11"),
  mortgageInterest: amount.optional().describe("Line 12, paid to banks, etc. (Form 1098)"),
  otherInterest: amount.optional().describe("Line 13"),
  repairs: amount.optional().describe("Line 14"),
  supplies: amount.optional().describe("Line 15"),
  taxes: amount.optional().describe("Line 16"),
  utilities: amount.optional().describe("Line 17"),
  depreciationOrDepletion: amount.optional().describe("Line 18"),
  other: amount.optional().describe("Line 19, the total of other expenses"),
  otherDescription: z.string().optional().describe("Line 19: what the other expenses are"),
};

export const recordRental = createTool({
  id: "record-rental",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Record one rental real estate or royalty property (Schedule E Part I) from the user's answers. Call once per property; to correct it, call again with every field and the propertyId the first call returned. Pass only the expenses the user has.",
  inputSchema: z.object({
    year: z.number().int(),
    propertyId: z
      .string()
      .optional()
      .describe(
        "The propertyId an earlier call returned for this property. Pass it to correct the property; leave it out for a new property.",
      ),
    owner: z
      .enum(["taxpayer", "spouse", "joint"])
      .optional()
      .describe("On a joint return, whose property it is"),
    propertyType: z
      .enum([
        "single_family",
        "multi_family",
        "vacation_short_term",
        "commercial",
        "land",
        "royalties",
        "self_rental",
        "other",
      ])
      .describe("Line 1b: the type of property"),
    otherTypeDescription: z.string().optional().describe("Line 1b, type other: what it is"),
    address: z
      .object({ street: z.string(), city: z.string(), state: z.string(), zip: z.string() })
      .optional()
      .describe("Line 1a: the property's address (a royalty may have none)"),
    fairRentalDays: days.optional().describe("Line 2: days rented at fair rental value"),
    personalUseDays: days.optional().describe("Line 2: days of personal use"),
    qualifiedJointVenture: z
      .boolean()
      .optional()
      .describe("Line 2: the spouses elected to treat the rental business as a QJV"),
    rentsReceived: amount.optional().describe("Line 3: rents received"),
    royaltiesReceived: amount.optional().describe("Line 4: royalties received (1099-MISC box 2)"),
    expenses: z.object(expenses).optional(),
    activeParticipation: z
      .boolean()
      .optional()
      .describe("Actively participated (approved tenants, set rents, approved repairs)"),
    materiallyParticipated: z
      .boolean()
      .optional()
      .describe("Materially participated (Form 8582 instructions, the seven tests)"),
    allInvestmentAtRisk: z.boolean().optional().describe("All of the investment is at risk"),
    priorYearUnallowedLoss: amount
      .optional()
      .describe("Losses not allowed in earlier years (last year's Form 8582); 0 if none"),
    disposedOfEntirely: z
      .boolean()
      .optional()
      .describe("Sold or disposed of the entire interest in 2025"),
    royaltyActivity: z
      .enum(["portfolio", "passive", "nonpassive"])
      .optional()
      .describe(
        "Royalties only: portfolio (most royalties), or from a trade or business: passive, or nonpassive when the owner materially participated",
      ),
    qualifiedBusiness: z
      .boolean()
      .optional()
      .describe("The property is a trade or business for the QBI deduction (Form 8995-A)"),
    specifiedService: z.boolean().optional().describe("A specified service trade or business"),
    w2WagesPaid: amount.optional().describe("Form 8995-A line 4: W-2 wages paid; 0 if none"),
    qualifiedPropertyUbia: amount
      .optional()
      .describe("Form 8995-A line 7: UBIA of qualified property; 0 if none"),
    sourceNote: z.string().default("Rental answers stated by the user"),
  }),
  outputSchema: z.object({ factKey: z.string(), propertyId: z.string() }),
  execute: async (input, context) => {
    const { scope, userId, filingId } = await requireUserContext(context);
    const { year, sourceNote, propertyId: givenId, ...value } = input;
    const base = slugify(input.address?.street ?? input.propertyType) || "property";
    const propertyId = givenId ?? (await unusedPropertyId(scope, year, base));
    const factKey = makeRentalFactKey(propertyId);
    await recordIngestFact(
      { scope, userId, filingId, year, sourceNote },
      "rental",
      factKey,
      value satisfies RentalFactValue,
    );
    return { factKey, propertyId };
  },
});

const MAX_SAME_BASE = 20;

/* The ids a new property can take, in order: the slug, then the slug plus a number. */
export function propertyIdCandidates(base: string): string[] {
  return Array.from({ length: MAX_SAME_BASE }, (_, index) =>
    index === 0 ? base : `${base}-${index + 1}`,
  );
}

async function unusedPropertyId(scope: Scope, year: number, base: string): Promise<string> {
  const candidates = propertyIdCandidates(base);
  const taken = new Set(
    (await listFactsByKeys(scope, year, candidates.map(makeRentalFactKey))).map((row) => row.key),
  );
  return candidates.find((id) => !taken.has(makeRentalFactKey(id))) ?? crypto.randomUUID();
}
