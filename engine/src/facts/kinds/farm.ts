/*
 * One fact per farm (Schedule F). The farmer states these answers from the
 * farm's books; the amounts of Forms 1099-PATR, 1099-G, CCC-1099-G, 1099-A and
 * 1099-MISC (crop insurance) are in the totals, as the instructions say: "Include
 * the Form 1099 or CCC-1099-G amounts in the total amount reported on that line"
 * (irs-1040sf-inst-2025::sec::part-i::b02). readFarmFacts checks the amounts,
 * because a fact can also be written by hand.
 *
 * The income amounts are the year's, whatever the accounting method: Schedule F
 * prints them in Part I (cash) or Part III (accrual).
 */

import { isAtRiskAmounts, type AtRiskAmounts } from "./atRisk.js";

type FactRow = { key: string; value: unknown; category: string };

/* Schedule F Part II lines that take an amount as stated (lines 10, 12, 22 and 32 are figured). */
export interface FarmExpenses {
  /* Line 10, actual expenses other than parking fees and tolls (vehicles give those). */
  carAndTruck?: number;
  chemicals?: number; // 11
  customHire?: number; // 13
  /*
   * Line 14: depreciation and section 179 expense from the farm's depreciation
   * records. The engine does not fill Form 4562 for a farm, so property placed
   * in service in 2025 makes line 14 a gap (newDepreciableProperty).
   */
  depreciation?: number;
  /* Line 15, before the Form 8941 credit (smallEmployerHealthCredit). */
  employeeBenefitPrograms?: number;
  feed?: number; // 16
  fertilizersAndLime?: number; // 17
  freightAndTrucking?: number; // 18
  gasolineFuelAndOil?: number; // 19
  insurance?: number; // 20
  mortgageInterest?: number; // 21a: paid to banks, with a Form 1098
  otherInterest?: number; // 21b
  /* Line 22, before the employment credits (employmentCredits). */
  laborHired?: number;
  pensionAndProfitSharing?: number; // 23
  rentVehiclesMachinery?: number; // 24a
  rentOther?: number; // 24b: land, animals, etc.
  repairs?: number; // 25
  seedsAndPlants?: number; // 26
  storageAndWarehousing?: number; // 27
  supplies?: number; // 28
  taxes?: number; // 29
  utilities?: number; // 30
  veterinaryBreedingMedicine?: number; // 31
}

/* A car or truck the farm used; line 10 takes its parking and tolls and its standard mileage amount. */
export interface FarmVehicle {
  businessMiles: number;
  /* True when line 10 uses the standard mileage rate for this vehicle; false for actual expenses. */
  standardMileageRate: boolean;
  parkingAndTolls?: number;
}

/* Line 12: soil and water conservation expenses, at most 25% of gross income from farming. */
export interface FarmConservation {
  /* This year's deductible conservation expenses (the farmland share, consistent with an approved plan). */
  expenses: number;
  /* The excess over the 25% limit carried from earlier years (irs-pub-225-2025::sec::assessment-for-depreciable::b08). */
  carryover?: number;
  /* Gains from sales of draft, breeding or dairy livestock on Form 4797: gross income from farming too (::b07). */
  livestockGains?: number;
}

/* Part III lines 45 to 48: the inventory of an accrual-method farm. */
export interface FarmInventory {
  beginning: number; // 45
  purchases?: number; // 46
  ending: number; // 48
  /* The valuation method; the line 49 footnote applies to the farm-price and unit-livestock-price methods. */
  method?: "cost" | "lower_of_cost_or_market" | "farm_price" | "unit_livestock_price";
}

/* Lines 32a to 32f: one other expense, with the farmer's description. */
export interface FarmOtherExpense {
  description: string;
  amount: number;
}

export interface FarmFactValue {
  owner?: "taxpayer" | "spouse";
  /* Line A: principal crop or activity. */
  activity: string;
  /* Line B: the six-digit code from Part IV. */
  code?: string;
  /* Line D: the EIN issued to the farmer, not an LLC's. */
  ein?: string;
  /* Line C. */
  accountingMethod?: "cash" | "accrual";
  /* Line E. */
  materiallyParticipated?: boolean;
  /* Line F. */
  paymentsRequire1099?: boolean;
  /* Line G, asked after a Yes on line F. */
  filedRequired1099?: boolean;
  /* Line 1a (cash method only): sales of livestock and other items bought for resale. */
  purchasedItemSales?: number;
  /* Line 1b: their cost or other basis. */
  purchasedItemBasis?: number;
  /* Line 2 (cash): sales of products raised; line 37 (accrual): sales of all products. */
  productSales?: number;
  /* Line 3a / 38a: cooperative distributions (Forms 1099-PATR). */
  cooperativeDistributions?: number;
  /* The part of line 3a from buying personal or family items, capital assets or depreciable assets: not on line 3b. */
  cooperativeDistributionsNotTaxable?: number;
  /* Line 4a / 39a: agricultural program payments, market gain included. */
  agriculturalProgramPayments?: number;
  /* The market gain in line 4a (Form 1099-G box 9, CCC-1099-G): not taxable under the CCC loan election. */
  marketGain?: number;
  /* The cost-sharing payments in line 4a excluded under section 126 (irs-pub-225-2025::sec::cost-sharing-exclusion). */
  costShareExclusion?: number;
  /* The taxable CRP payments in line 4b received while receiving social security benefits (Schedule SE line 1b). */
  crpPaymentsWhileReceivingSocialSecurity?: number;
  /* The election (this year or earlier) to report CCC loans as income. */
  cccLoanElection?: boolean;
  /* Line 5a / 40a: CCC loans received in 2025 and reported under the election. */
  cccLoansReported?: number;
  /* Line 5b / 40b: CCC loans forfeited (Form 1099-A). */
  cccLoansForfeited?: number;
  /* Under the election: the basis in the commodity forfeited; line 5c takes the difference. */
  cccForfeitedCommodityBasis?: number;
  /* Line 6a / 41: crop insurance proceeds and federal crop disaster payments received in 2025. */
  cropInsurance?: number;
  /* The part of line 6a the farmer elects to include in 2026 (line 6c; cash method only). */
  cropInsuranceDeferred?: number;
  /* Line 6d: proceeds received in 2024 and elected into 2025. */
  cropInsuranceFrom2024?: number;
  /* Line 7 / 42: custom hire (machine work) income. */
  customHireIncome?: number;
  /* Line 8 / 43: other income; below 0 for a hedging loss (irs-1040sf-inst-2025::sec::line-8::b02). */
  otherIncome?: number;
  inventory?: FarmInventory;
  expenses?: FarmExpenses;
  vehicles?: FarmVehicle[];
  conservation?: FarmConservation;
  /* Line 22: the credits of Forms 5884, 8844, 8932 and 8994 for the farm's labor. */
  employmentCredits?: number;
  /* Line 15: the Form 8941 credit for the farm's employee health insurance. */
  smallEmployerHealthCredit?: number;
  /* The farm placed property in service in 2025, elected section 179 or began amortization: Form 4562. */
  newDepreciableProperty?: boolean;
  otherExpenses?: FarmOtherExpense[];
  /* Line 32f: the preproductive period and other costs capitalized under section 263A, a positive amount. */
  section263ACapitalized?: number;
  /* Line 36a (true) or 36b (false), asked for a loss. */
  allInvestmentAtRisk?: boolean;
  /* Form 6198's amounts at risk, asked for a loss with box 36b. */
  atRisk?: AtRiskAmounts;
  /* Form 8995-A line 4: W-2 wages the farm paid its employees. */
  w2WagesPaid?: number;
  /* Form 8995-A line 7: UBIA of qualified property. */
  qualifiedPropertyUbia?: number;
}

const FARM_CATEGORY = "self_employment";
const FARM_PREFIX = "farm.";

/* The key holds an id Cade chooses once for the farm, so a correction updates the same fact. */
export function makeFarmFactKey(farmId: string): string {
  return `${FARM_PREFIX}${farmId}`;
}

export function isFarmFactKey(key: string): boolean {
  return key.startsWith(FARM_PREFIX) && key.split(".").length === 2;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const isAmount = (value: unknown) => value === undefined || (isNumber(value) && value >= 0);
const isSigned = (value: unknown) => value === undefined || isNumber(value);
const isOptionalBoolean = (value: unknown) => value === undefined || typeof value === "boolean";
const isListOf = (value: unknown, check: (entry: Record<string, unknown>) => boolean) =>
  value === undefined ||
  (Array.isArray(value) && value.every((entry) => isRecord(entry) && check(entry)));

const AMOUNT_FIELDS = [
  "purchasedItemSales",
  "purchasedItemBasis",
  "productSales",
  "cooperativeDistributions",
  "cooperativeDistributionsNotTaxable",
  "agriculturalProgramPayments",
  "marketGain",
  "costShareExclusion",
  "crpPaymentsWhileReceivingSocialSecurity",
  "cccLoansReported",
  "cccLoansForfeited",
  "cccForfeitedCommodityBasis",
  "cropInsurance",
  "cropInsuranceDeferred",
  "cropInsuranceFrom2024",
  "customHireIncome",
  "employmentCredits",
  "smallEmployerHealthCredit",
  "section263ACapitalized",
  "w2WagesPaid",
  "qualifiedPropertyUbia",
] as const;

const BOOLEAN_FIELDS = [
  "materiallyParticipated",
  "paymentsRequire1099",
  "filedRequired1099",
  "cccLoanElection",
  "newDepreciableProperty",
  "allInvestmentAtRisk",
] as const;

const INVENTORY_METHODS = ["cost", "lower_of_cost_or_market", "farm_price", "unit_livestock_price"];

const isInventory = (value: unknown) =>
  value === undefined ||
  (isRecord(value) &&
    isNumber(value.beginning) &&
    isAmount(value.beginning) &&
    isAmount(value.purchases) &&
    isNumber(value.ending) &&
    isAmount(value.ending) &&
    (value.method === undefined || INVENTORY_METHODS.includes(value.method as string)));

const isConservation = (value: unknown) =>
  value === undefined ||
  (isRecord(value) &&
    isNumber(value.expenses) &&
    isAmount(value.expenses) &&
    isAmount(value.carryover) &&
    isAmount(value.livestockGains));

const isVehicle = (entry: Record<string, unknown>) =>
  isNumber(entry.businessMiles) &&
  isAmount(entry.businessMiles) &&
  typeof entry.standardMileageRate === "boolean" &&
  isAmount(entry.parkingAndTolls);

const isOtherExpense = (entry: Record<string, unknown>) =>
  typeof entry.description === "string" && isNumber(entry.amount) && isAmount(entry.amount);

const isMethod = (value: unknown) => value === undefined || value === "cash" || value === "accrual";

function isFarm(value: unknown): value is FarmFactValue {
  if (!isRecord(value)) return false;
  const expenses = value.expenses ?? {};
  return (
    typeof value.activity === "string" &&
    (value.owner === undefined || value.owner === "taxpayer" || value.owner === "spouse") &&
    isMethod(value.accountingMethod) &&
    AMOUNT_FIELDS.every((field) => isAmount(value[field])) &&
    BOOLEAN_FIELDS.every((field) => isOptionalBoolean(value[field])) &&
    isSigned(value.otherIncome) &&
    isRecord(expenses) &&
    Object.values(expenses).every(isAmount) &&
    isInventory(value.inventory) &&
    isConservation(value.conservation) &&
    isListOf(value.vehicles, isVehicle) &&
    isListOf(value.otherExpenses, isOtherExpense) &&
    isAtRiskAmounts(value.atRisk)
  );
}

export type FarmOwner = "taxpayer" | "spouse";

export function farmOwnerOf(farm: FarmFactValue): FarmOwner {
  return farm.owner ?? "taxpayer";
}

/*
 * The farms on this return. Filing jointly, every farm. On any other status,
 * only the taxpayer's: a spouse's farm is on the spouse's return, and its key
 * is in spouseKeys so a form can wait on it. A malformed fact is listed.
 */
export function farmsOnReturn(
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
): {
  farms: Array<{ key: string; value: FarmFactValue }>;
  spouseKeys: string[];
  malformedKeys: string[];
} {
  const rows = facts.filter((fact) => fact.category === FARM_CATEGORY && isFarmFactKey(fact.key));
  const farms = rows
    .filter((row) => isFarm(row.value))
    .map((row) => ({ key: row.key, value: row.value as FarmFactValue }));
  const offReturn = (farm: { value: FarmFactValue }) =>
    !joint && farmOwnerOf(farm.value) === "spouse";
  return {
    farms: farms.filter((farm) => !offReturn(farm)),
    spouseKeys: farms.filter(offReturn).map((farm) => farm.key),
    malformedKeys: rows.filter((row) => !isFarm(row.value)).map((row) => row.key),
  };
}
