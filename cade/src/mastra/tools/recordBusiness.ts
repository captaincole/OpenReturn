import { createTool } from "@mastra/core/tools";
import {
  makeBusinessFactKey,
  type BusinessExpenses,
  type BusinessFactValue,
  type BusinessVehicle,
  type HomeExpenses,
  type HomeOfficeActual,
  type HomeOfficeSimplified,
} from "@openreturn/engine/facts";
import { z } from "zod";
import type { Scope } from "../db/appDb";
import { listFactsByKeys } from "../db/taxFacts";
import { cadeRequestContextSchema } from "../server/requestContext";
import { depreciationSchema } from "./depreciationSchema";
import { recordIngestFact, slugify } from "./ingestShared";
import { requireUserContext } from "./userContext";

const amount = z.number().nonnegative();

/* A missing, extra or mistyped expense (against the engine's type) fails to compile. */
const expenses: { [K in keyof BusinessExpenses]-?: z.ZodType<BusinessExpenses[K]> } = {
  advertising: amount.optional().describe("Line 8"),
  carAndTruck: amount
    .optional()
    .describe(
      "Line 9: actual car and truck expenses, without parking fees and tolls (those go in each vehicle's parkingAndTolls); a vehicle at the standard mileage rate goes in vehicles",
    ),
  commissionsAndFees: amount.optional().describe("Line 10"),
  contractLabor: amount.optional().describe("Line 11"),
  depletion: amount.optional().describe("Line 12"),
  depreciation: amount.optional().describe("Line 13"),
  employeeBenefitPrograms: amount.optional().describe("Line 14"),
  insurance: amount.optional().describe("Line 15, other than health"),
  mortgageInterest: amount.optional().describe("Line 16a"),
  otherInterest: amount.optional().describe("Line 16b"),
  legalAndProfessional: amount.optional().describe("Line 17"),
  office: amount.optional().describe("Line 18"),
  pensionAndProfitSharing: amount.optional().describe("Line 19"),
  rentVehiclesMachinery: amount.optional().describe("Line 20a"),
  rentOtherProperty: amount.optional().describe("Line 20b"),
  repairs: amount.optional().describe("Line 21"),
  supplies: amount.optional().describe("Line 22"),
  taxesAndLicenses: amount.optional().describe("Line 23"),
  travel: amount.optional().describe("Line 24a"),
  deductibleMeals: amount.optional().describe("Line 24b, the deductible part"),
  utilities: amount.optional().describe("Line 25"),
  wages: amount.optional().describe("Line 26"),
  energyEfficientBuildings: amount.optional().describe("Line 27a"),
};

/* A missing, extra or mistyped field (against the engine's type) fails to compile. */
const vehicle: { [K in keyof BusinessVehicle]-?: z.ZodType<BusinessVehicle[K]> } = {
  placedInService: z.iso
    .date()
    .optional()
    .describe("Line 43: the date first used for the business, YYYY-MM-DD"),
  businessMiles: amount.describe("Line 44a: business miles in 2025"),
  commutingMiles: amount.optional().describe("Line 44b"),
  otherMiles: amount.optional().describe("Line 44c: personal miles"),
  standardMileageRate: z
    .boolean()
    .describe("True when they use the standard mileage rate; false for actual expenses"),
  parkingAndTolls: amount
    .optional()
    .describe("Business parking fees and tolls, on either method; leave them out of carAndTruck"),
  availableForPersonalUse: z.boolean().optional().describe("Line 45"),
  anotherVehicleAvailable: z.boolean().optional().describe("Line 46"),
  hasEvidence: z.boolean().optional().describe("Line 47a"),
  evidenceIsWritten: z.boolean().optional().describe("Line 47b"),
};

const homeOffice: { [K in keyof HomeOfficeSimplified]-?: z.ZodType<HomeOfficeSimplified[K]> } = {
  homeSquareFeet: amount.describe("Line 30 (a): total square feet of the home"),
  businessSquareFeet: amount.describe(
    "Line 30 (b): square feet used regularly and only for the business",
  ),
  sameAreaAllYear: z
    .boolean()
    .optional()
    .describe("True when the same area was used for the business all year"),
  averageMonthlySquareFeet: amount
    .optional()
    .describe(
      "When the area was not the same all year: each month's business square feet (at most 300; 0 for a month used under 15 days) added up, divided by 12",
    ),
  allGrossIncomeFromHome: z
    .boolean()
    .optional()
    .describe(
      "True when all of the business's gross income is from its use of this home (no other place of business). When it is false, or two or more businesses of one owner have home offices that total more than 300 square feet, tell the user we do not handle that yet.",
    ),
};

const homeExpenses: { [K in keyof HomeExpenses]-?: z.ZodType<HomeExpenses[K]> } = {
  insurance: amount.optional().describe("Form 8829 line 18"),
  rent: amount.optional().describe("Line 19"),
  repairsAndMaintenance: amount.optional().describe("Line 20"),
  utilities: amount.optional().describe("Line 21"),
  other: amount.optional().describe("Line 22"),
};

const homeOfficeActual: { [K in keyof HomeOfficeActual]-?: z.ZodType<HomeOfficeActual[K]> } = {
  businessSquareFeet: amount.describe(
    "Form 8829 line 1: square feet used regularly and only for the business",
  ),
  homeSquareFeet: amount.describe("Line 2: total square feet of the home"),
  allGrossIncomeFromHome: z
    .boolean()
    .optional()
    .describe("True when all of the business's gross income is from its use of this home"),
  ownsHome: z
    .boolean()
    .optional()
    .describe(
      "True when they own the home. Mortgage interest, real estate taxes and home depreciation are not supported yet: say so.",
    ),
  direct: z
    .object(homeExpenses)
    .optional()
    .describe("Expenses for the business part of the home only (column a)"),
  indirect: z.object(homeExpenses).optional().describe("Expenses for the whole home (column b)"),
  operatingExpenseCarryover: amount
    .optional()
    .describe("Operating expenses carried over from 2024 (2024 Form 8829 line 43)"),
  casualtyAndDepreciationCarryover: amount
    .optional()
    .describe("Excess casualty losses and depreciation carried over (2024 Form 8829 line 44)"),
};

export const recordBusiness = createTool({
  id: "record-business",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Record one sole-proprietor business (Schedule C) from the user's answers. Call once per business; to correct it, call again with every field and the businessId the first call returned. Pass only the expenses the user has.",
  inputSchema: z.object({
    year: z.number().int(),
    businessId: z
      .string()
      .optional()
      .describe(
        "The businessId an earlier call returned for this business. Pass it to correct the business; leave it out for a new business.",
      ),
    owner: z.enum(["taxpayer", "spouse"]).optional().describe("On a joint return, who runs it"),
    activity: z.string().describe("Line A: what the business does, e.g. 'Rideshare driver'"),
    code: z.string().optional().describe("Line B: six-digit code from the Schedule C instructions"),
    name: z.string().optional().describe("Line C: business name, if any"),
    ein: z.string().optional().describe("Line D: employer ID number, if any"),
    address: z
      .object({ street: z.string(), city: z.string(), state: z.string(), zip: z.string() })
      .optional()
      .describe("Line E: business address, if not the home address"),
    accountingMethod: z.enum(["cash", "accrual", "other"]).optional().describe("Line F"),
    materiallyParticipated: z.boolean().optional().describe("Line G"),
    startedThisYear: z.boolean().optional().describe("Line H"),
    paymentsRequire1099: z.boolean().optional().describe("Line I"),
    sellsGoods: z
      .boolean()
      .optional()
      .describe("Does the business sell goods or keep inventory? (cost of goods sold, Part III)"),
    grossReceipts: amount.describe("Line 1: gross receipts or sales"),
    returnsAndAllowances: amount.optional().describe("Line 2"),
    otherIncome: amount.optional().describe("Line 6"),
    expenses: z.object(expenses).optional(),
    otherExpenses: z
      .array(z.object({ description: z.string(), amount }))
      .optional()
      .describe("Part V: each other expense with its description (line 27b)"),
    vehicles: z.array(z.object(vehicle)).optional().describe("Part IV and line 9"),
    homeOffice: z
      .object(homeOffice)
      .optional()
      .describe("Line 30 by the simplified method; leave it out when they use Form 8829"),
    homeOfficeActual: z
      .object(homeOfficeActual)
      .optional()
      .describe("Line 30 by actual expenses (Form 8829), for a home office by that method"),
    depreciation: depreciationSchema,
    allInvestmentAtRisk: z
      .boolean()
      .optional()
      .describe(
        "For a loss: true when all of their investment in the business is at risk (line 32a)",
      ),
    specifiedService: z
      .boolean()
      .optional()
      .describe("A specified service business (health, law, consulting, etc.), for Form 8995-A"),
    w2WagesPaid: amount
      .optional()
      .describe("Form 8995-A line 4: W-2 wages the business paid its employees; 0 if none"),
    qualifiedPropertyUbia: amount
      .optional()
      .describe(
        "Form 8995-A line 7: original cost basis of business property still in its depreciable period (10 years, or the recovery period if longer); 0 if none",
      ),
    sourceNote: z.string().default("Business answers stated by the user"),
  }),
  outputSchema: z.object({ factKey: z.string(), businessId: z.string() }),
  execute: async (input, context) => {
    const { scope, userId, filingId } = await requireUserContext(context);
    const { year, sourceNote, businessId: givenId, ...value } = input;
    const businessId =
      givenId ?? (await unusedBusinessId(scope, year, slugify(input.activity) || "business"));
    const factKey = makeBusinessFactKey(businessId);
    await recordIngestFact(
      { scope, userId, filingId, year, sourceNote },
      "self_employment",
      factKey,
      value satisfies BusinessFactValue,
    );
    return { factKey, businessId };
  },
});

const MAX_SAME_ACTIVITY = 20;

/* The ids a new business can take, in order: the activity's slug, then the slug plus a number. */
export function businessIdCandidates(base: string): string[] {
  return Array.from({ length: MAX_SAME_ACTIVITY }, (_, index) =>
    index === 0 ? base : `${base}-${index + 1}`,
  );
}

async function unusedBusinessId(scope: Scope, year: number, base: string): Promise<string> {
  const candidates = businessIdCandidates(base);
  const taken = new Set(
    (await listFactsByKeys(scope, year, candidates.map(makeBusinessFactKey))).map((row) => row.key),
  );
  return candidates.find((id) => !taken.has(makeBusinessFactKey(id))) ?? crypto.randomUUID();
}
