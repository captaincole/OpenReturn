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
  carAndTruck?: number; // 9: actual expenses other than parking fees and tolls (vehicles give those)
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

/* Part IV: one car or truck the business used. Line 9 takes its parking and tolls, and its standard mileage amount. */
export interface BusinessVehicle {
  /* Line 43: the date the vehicle was placed in service for the business, YYYY-MM-DD. */
  placedInService?: string;
  /* Line 44a. */
  businessMiles: number;
  /* Line 44b. */
  commutingMiles?: number;
  /* Line 44c. */
  otherMiles?: number;
  /* True when line 9 uses the standard mileage rate for this vehicle; false for actual expenses (expenses.carAndTruck). */
  standardMileageRate: boolean;
  /* Business parking fees and tolls. Line 9 takes them on either method; expenses.carAndTruck leaves them out. */
  parkingAndTolls?: number;
  /* Line 45: the vehicle was available for personal use during off-duty hours. */
  availableForPersonalUse?: boolean;
  /* Line 46: another vehicle was available for personal use. */
  anotherVehicleAvailable?: boolean;
  /* Line 47a. */
  hasEvidence?: boolean;
  /* Line 47b. */
  evidenceIsWritten?: boolean;
}

/* Line 30 by the simplified method (the Simplified Method Worksheet). Form 8829 is not modeled. */
export interface HomeOfficeSimplified {
  /* Line 30 (a): the total area of the home, in square feet. */
  homeSquareFeet: number;
  /* Line 30 (b): the area used regularly and exclusively for the business, in square feet. */
  businessSquareFeet: number;
  /* True when the same area was used for the business all year (worksheet line 2). */
  sameAreaAllYear?: boolean;
  /* Worksheet line 2 when the area was not the same all year: each month's allowable square feet (at most 300) summed, divided by 12. */
  averageMonthlySquareFeet?: number;
  /* True when all of the business's gross income is from this business use of the home (worksheet line 1). */
  allGrossIncomeFromHome?: boolean;
}

/* Part V: one other expense, with the taxpayer's description. */
export interface BusinessOtherExpense {
  description: string;
  amount: number;
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
  /* Part V (line 48), totaled on line 27b. */
  otherExpenses?: BusinessOtherExpense[];
  /* Part IV and line 9. */
  vehicles?: BusinessVehicle[];
  /* Line 30, simplified method. */
  homeOffice?: HomeOfficeSimplified;
  /* Form 8995-A: a specified service trade or business. */
  specifiedService?: boolean;
  /* Form 8995-A line 4: W-2 wages the business paid its employees (their Forms W-2). */
  w2WagesPaid?: number;
  /* Form 8995-A line 7: UBIA (unadjusted basis immediately after acquisition) of qualified property. */
  qualifiedPropertyUbia?: number;
}

const BUSINESS_CATEGORY = "self_employment";

/*
 * The key holds an id that Cade chooses once for the business (record-business),
 * not its name or owner, so a correction to any field updates the same fact.
 */
export function makeBusinessFactKey(businessId: string): string {
  return `business.${businessId}`;
}

export function isBusinessFactKey(key: string): boolean {
  return key.startsWith("business.") && key.split(".").length === 2;
}

const isAmount = (value: unknown): boolean =>
  value === undefined || (typeof value === "number" && Number.isFinite(value) && value >= 0);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/* Undefined, or a list whose every entry passes the check. */
const isListOf = (value: unknown, check: (entry: Record<string, unknown>) => boolean): boolean =>
  value === undefined ||
  (Array.isArray(value) && value.every((entry) => isRecord(entry) && check(entry)));

const isOtherExpense = (entry: Record<string, unknown>) =>
  typeof entry.description === "string" &&
  typeof entry.amount === "number" &&
  isAmount(entry.amount);

const isDigits = (part: string, length: number): boolean =>
  part.length === length && [...part].every((char) => char >= "0" && char <= "9");

/* Undefined, or a YYYY-MM-DD date (Part IV line 43 splits it into its boxes). */
const isOptionalIsoDate = (value: unknown): boolean => {
  if (value === undefined) return true;
  if (typeof value !== "string") return false;
  const [year, month, day, ...rest] = value.split("-");
  return (
    rest.length === 0 &&
    isDigits(year ?? "", 4) &&
    isDigits(month ?? "", 2) &&
    isDigits(day ?? "", 2) &&
    Number(month) >= 1 &&
    Number(month) <= 12 &&
    Number(day) >= 1 &&
    Number(day) <= 31
  );
};

const isVehicle = (entry: Record<string, unknown>) =>
  isOptionalIsoDate(entry.placedInService) &&
  typeof entry.businessMiles === "number" &&
  isAmount(entry.businessMiles) &&
  isAmount(entry.commutingMiles) &&
  isAmount(entry.otherMiles) &&
  isAmount(entry.parkingAndTolls) &&
  typeof entry.standardMileageRate === "boolean";

const isOptionalBoolean = (value: unknown): boolean =>
  value === undefined || typeof value === "boolean";

const isHomeOffice = (value: unknown) =>
  value === undefined ||
  (isRecord(value) &&
    typeof value.homeSquareFeet === "number" &&
    isAmount(value.homeSquareFeet) &&
    typeof value.businessSquareFeet === "number" &&
    isAmount(value.businessSquareFeet) &&
    isAmount(value.averageMonthlySquareFeet) &&
    isOptionalBoolean(value.sameAreaAllYear) &&
    isOptionalBoolean(value.allGrossIncomeFromHome));

function isBusiness(value: unknown): value is BusinessFactValue {
  if (!isRecord(value)) return false;
  const fields = value;
  const expenses = (fields.expenses ?? {}) as Record<string, unknown>;
  return (
    typeof fields.activity === "string" &&
    typeof fields.grossReceipts === "number" &&
    isAmount(fields.grossReceipts) &&
    isAmount(fields.returnsAndAllowances) &&
    isAmount(fields.otherIncome) &&
    isAmount(fields.w2WagesPaid) &&
    isAmount(fields.qualifiedPropertyUbia) &&
    typeof expenses === "object" &&
    Object.values(expenses).every(isAmount) &&
    isListOf(fields.otherExpenses, isOtherExpense) &&
    isListOf(fields.vehicles, isVehicle) &&
    isHomeOffice(fields.homeOffice)
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

export type BusinessOwner = "taxpayer" | "spouse";

export function ownerOf(business: BusinessFactValue): BusinessOwner {
  return business.owner ?? "taxpayer";
}

/*
 * The businesses on this return. Filing jointly, every business. On any other
 * status, only the taxpayer's: a spouse's business belongs on the spouse's
 * return, and its key is in spouseKeys so a form can wait on it.
 */
export function businessesOnReturn(
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
): {
  businesses: Array<{ key: string; value: BusinessFactValue }>;
  spouseKeys: string[];
  malformedKeys: string[];
} {
  const { businesses, malformedKeys } = readBusinessFacts(facts);
  const offReturn = (business: { value: BusinessFactValue }) =>
    !joint && ownerOf(business.value) === "spouse";
  return {
    businesses: businesses.filter((business) => !offReturn(business)),
    spouseKeys: businesses.filter(offReturn).map((business) => business.key),
    malformedKeys,
  };
}
