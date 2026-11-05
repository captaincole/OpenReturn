/*
 * One fact per sole-proprietor business (Schedule C). The taxpayer states these
 * answers; Cade records them with the record-business tool, whose schema checks
 * the amounts. readBusinessFacts checks them again, because a fact can also be
 * written by hand.
 */

type FactRow = { key: string; value: unknown; category: string };

/* Schedule C lines 8–27a, one amount each. */
export interface BusinessExpenses {
  advertising?: number; // 8
  carAndTruck?: number; // 9
  commissionsAndFees?: number; // 10
  contractLabor?: number; // 11
  depletion?: number; // 12
  depreciation?: number; // 13 (Form 4562)
  employeeBenefitPrograms?: number; // 14
  insurance?: number; // 15
  mortgageInterest?: number; // 16a
  otherInterest?: number; // 16b
  legalAndProfessional?: number; // 17
  office?: number; // 18
  pensionAndProfitSharing?: number; // 19
  rentVehiclesMachinery?: number; // 20a
  rentOtherProperty?: number; // 20b
  repairs?: number; // 21
  supplies?: number; // 22
  taxesAndLicenses?: number; // 23
  travel?: number; // 24a
  deductibleMeals?: number; // 24b
  utilities?: number; // 25
  wages?: number; // 26
  energyEfficientBuildings?: number; // 27a
}

export interface BusinessFactValue {
  owner?: "taxpayer" | "spouse";
  /* Line A: principal business or profession. */
  activity: string;
  /* Line B: the six-digit code from the instructions. */
  code?: string;
  /* Line C. */
  name?: string;
  /* Line D. */
  ein?: string;
  /* Line E. */
  address?: { street: string; city: string; state: string; zip: string };
  /* Line F. */
  accountingMethod?: "cash" | "accrual" | "other";
  /* Line G. */
  materiallyParticipated?: boolean;
  /* Line H. */
  startedThisYear?: boolean;
  /* Line I: made payments that would require Form 1099. */
  paymentsRequire1099?: boolean;
  /* Part III: the business sells goods or keeps inventory (cost of goods sold, line 4). */
  sellsGoods?: boolean;
  /* Line 1. */
  grossReceipts: number;
  /* Line 2. */
  returnsAndAllowances?: number;
  /* Line 6: other income, such as a fuel tax credit or refund. */
  otherIncome?: number;
  expenses?: BusinessExpenses;
  /* Form 8995-A: a specified service trade or business. */
  specifiedService?: boolean;
}

const BUSINESS_CATEGORY = "self_employment";

export function makeBusinessFactKey(slug: string): string {
  return `business.${slug}`;
}

export function isBusinessFactKey(key: string): boolean {
  return key.startsWith("business.") && key.split(".").length === 2;
}

const isAmount = (value: unknown): boolean =>
  value === undefined || (typeof value === "number" && Number.isFinite(value) && value >= 0);

function isBusiness(value: unknown): value is BusinessFactValue {
  if (typeof value !== "object" || value === null) return false;
  const fields = value as Record<string, unknown>;
  const expenses = (fields.expenses ?? {}) as Record<string, unknown>;
  return (
    typeof fields.activity === "string" &&
    typeof fields.grossReceipts === "number" &&
    isAmount(fields.grossReceipts) &&
    isAmount(fields.returnsAndAllowances) &&
    isAmount(fields.otherIncome) &&
    typeof expenses === "object" &&
    Object.values(expenses).every(isAmount)
  );
}

/* Each business fact whose amounts are numbers; a malformed one is left out and listed. */
export function readBusinessFacts(facts: ReadonlyArray<FactRow>): {
  businesses: Array<{ key: string; value: BusinessFactValue }>;
  malformedKeys: string[];
} {
  const rows = facts.filter(
    (fact) => fact.category === BUSINESS_CATEGORY && isBusinessFactKey(fact.key),
  );
  return {
    businesses: rows
      .filter((row) => isBusiness(row.value))
      .map((row) => ({ key: row.key, value: row.value as BusinessFactValue })),
    malformedKeys: rows.filter((row) => !isBusiness(row.value)).map((row) => row.key),
  };
}
