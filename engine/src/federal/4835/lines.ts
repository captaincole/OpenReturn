/*
 * Form 4835 Parts I and II: pure arithmetic on one farm rental fact. Each
 * printed line is rounded to whole dollars; a total adds the rounded lines
 * (CLAUDE.md, whole-dollar rounding). Lines 32 and 34 are in result.ts.
 */

import type {
  FarmRentalExpenses,
  FarmRentalFactValue,
  FarmRentalOtherExpense,
} from "../../facts/index.js";
import { atLeast, roundDollars, sum, sumOrBlank } from "../../money.js";

/*
 * Line 10: "Your deduction, however, cannot exceed 25% of your gross income from
 * farming" (irs-4835-inst-2025::sec::line-10::b01; irs-pub-225-2025::sec::assessment-for-depreciable::b07).
 */
export const CONSERVATION_LIMIT_RATE = 0.25;

/* Line 30g's label for capitalized costs: "enter “263A.”" (irs-4835-inst-2025::sec::part-ii::b01). */
export const CAPITALIZED_COSTS_LABEL = "263A";

/* Lines 30a to 30g. */
export const OTHER_EXPENSE_ROWS = ["a", "b", "c", "d", "e", "f", "g"] as const;
export type OtherExpenseRow = (typeof OTHER_EXPENSE_ROWS)[number];

/* A line the engine does not fill for this farm, with the reason. */
export interface Gap {
  gap: string;
}
export type Line<T> = T | Gap | undefined;

export const isGap = (value: unknown): value is Gap =>
  typeof value === "object" && value !== null && typeof (value as Gap).gap === "string";

const dollars = (amount: number | undefined) =>
  amount === undefined ? undefined : roundDollars(amount);

const FORFEITURE_LOSS =
  "Line 4c: under the CCC loan election, the forfeited loan is less than the basis in the commodity; the instructions do not say where that loss goes (irs-1040sf-inst-2025::sec::lines-4a-and-4b::b03).";

export interface Form4835PartI {
  line1?: number;
  line2a?: number;
  line2b?: number;
  line3a?: number;
  line3b?: number;
  line4a?: number;
  line4b?: number;
  line4c?: number;
  line5a?: number;
  line5b?: number;
  line5c?: boolean;
  line5d?: number;
  line6?: number;
  /* Undefined while a line waits on the CCC loan election, or with no income at all. */
  line7?: number;
  /* Line 3b or 4c needs the CCC loan election, which the fact does not state. */
  waitsOnElection: boolean;
}

/* The election: stated, or shown by a loan reported under it on line 4a. */
export function cccLoanElection(farm: FarmRentalFactValue): boolean | undefined {
  if (farm.cccLoanElection !== undefined) return farm.cccLoanElection;
  return (farm.cccLoansReportedUnderElection ?? 0) > 0 ? true : undefined;
}

/*
 * Lines 2a and 2b (irs-1040sf-inst-2025::sec::lines-3a-and-3b::b01): 2a is every
 * distribution on Form 1099-PATR; 2b leaves out the patronage dividends from
 * personal, capital or depreciable purchases.
 */
export function cooperativeLines(farm: FarmRentalFactValue) {
  const total = farm.cooperativeDistributions;
  if (total === undefined) return {};
  return {
    line2a: roundDollars(total),
    line2b: roundDollars(atLeast(0, total - sum(farm.cooperativeDistributionsNotTaxable))),
  };
}

/*
 * Lines 3a and 3b (irs-1040sf-inst-2025::sec::lines-4a-and-4b::b01, b02): 3b
 * leaves out the market gain when the CCC loan was reported as income under the
 * election (irs-pub-225-2025::sec::market-gain::b03: "doesn't include it as a
 * taxable amount"), and cost-sharing payments the owner excludes.
 */
export function programPaymentLines(farm: FarmRentalFactValue, election: boolean | undefined) {
  const total = farm.agriculturalProgramPayments;
  if (total === undefined) return {};
  const marketGain = sum(farm.marketGain);
  if (marketGain > 0 && election === undefined) return { line3a: roundDollars(total) };
  const notTaxable = (election ? marketGain : 0) + sum(farm.excludedCostSharing);
  return { line3a: roundDollars(total), line3b: roundDollars(atLeast(0, total - notTaxable)) };
}

/*
 * Lines 4a to 4c (irs-1040sf-inst-2025::sec::lines-4a-and-4b::b02, b03): 4b is the
 * full amount forfeited; without the election 4c is the same amount; with it, 4c
 * is blank unless the forfeited amount differs from the basis in the commodity.
 * The forfeiture is a sale of the crops (irs-pub-225-2025::sec::use-form-w-4v-see-how-to-get-tax::b02).
 */
export function cccLoanLines(farm: FarmRentalFactValue, election: boolean | undefined) {
  const line4a = election ? dollars(farm.cccLoansReportedUnderElection) : undefined;
  const forfeited = farm.cccLoansForfeited;
  if (forfeited === undefined) return { line4a };
  const line4b = roundDollars(forfeited);
  if (election === undefined) return { line4a, line4b, waits: true };
  if (!election) return { line4a, line4b, line4c: line4b };
  const gain = forfeited - (farm.forfeitedCommodityBasis ?? forfeited);
  if (gain < 0) return { line4a, line4b, gap: FORFEITURE_LOSS };
  return { line4a, line4b, line4c: gain > 0 ? roundDollars(gain) : undefined };
}

/*
 * Lines 5a to 5d (irs-1040sf-inst-2025::sec::lines-4a-and-4b::b03, b04): 5a is all
 * proceeds received in 2025; 5b leaves out the part deferred to 2026; 5c is
 * checked with the election; 5d is the 2024 proceeds deferred to 2025.
 */
export function cropInsuranceLines(farm: FarmRentalFactValue) {
  const received = farm.cropInsuranceReceived;
  const deferred = sum(farm.cropInsuranceDeferredTo2026);
  return {
    line5a: dollars(received),
    line5b: received === undefined ? undefined : roundDollars(atLeast(0, received - deferred)),
    line5c: received !== undefined && deferred > 0 ? true : undefined,
    line5d: dollars(farm.cropInsuranceDeferredFrom2024),
  };
}

/* Part I, or the gap of line 4c. Line 7 adds the right column: 1, 2b, 3b, 4a, 4c, 5b, 5d, 6. */
export function partI(farm: FarmRentalFactValue): Form4835PartI | Gap {
  const election = cccLoanElection(farm);
  const ccc = cccLoanLines(farm, election);
  if (ccc.gap) return { gap: ccc.gap };
  const lines = {
    line1: dollars(farm.productionIncome),
    ...cooperativeLines(farm),
    ...programPaymentLines(farm, election),
    line4a: ccc.line4a,
    line4b: ccc.line4b,
    line4c: ccc.line4c,
    ...cropInsuranceLines(farm),
    line6: dollars(farm.otherIncome),
  };
  const waitsOnElection =
    ccc.waits === true || (lines.line3a !== undefined && lines.line3b === undefined);
  const rightColumn = [lines.line1, lines.line2b, lines.line3b, lines.line4a, lines.line4c];
  const line7 = waitsOnElection
    ? undefined
    : sumOrBlank(...rightColumn, lines.line5b, lines.line5d, lines.line6);
  return { ...lines, line7, waitsOnElection };
}

/*
 * Gross income from farming for line 10's limit: line 7 and the gains from draft,
 * breeding or dairy livestock (irs-pub-225-2025::sec::assessment-for-depreciable::b07,
 * b08: $85,000 + $15,000 = $100,000). Gains from machinery or land are not in it.
 *
 * DECISION (2026-11-25, by the author): the limit's base is all of line 7.
 * - Form 4835: "Your deduction, however, cannot exceed 25% of your gross income
 *   from farming" (irs-4835-inst-2025::sec::line-10::b01); Schedule F adds only
 *   "excluding certain gains from selling assets such as farm machinery and land"
 *   (irs-1040sf-inst-2025::sec::line-12::b02).
 * - Pub. 225: "the income you derive in the business of farming from the
 *   production of crops, fish, fruits, other agricultural products, or livestock"
 *   (irs-pub-225-2025::sec::assessment-for-depreciable::b07), which may leave out
 *   some line 6 income, such as a fuel tax refund.
 * The engine takes line 7 whole: crop-share rent puts the owner in the business
 * of farming (irs-pub-225-2025::sec::business-of-farming::b01), line 7 is the
 * form's own total of that farm rental income, and no text sorts line 6 item by item.
 */
export function grossIncomeFromFarming(line7: number, breedingLivestockGains?: number): number {
  return line7 + sum(breedingLivestockGains);
}

/*
 * Line 10: this year's expenses and the carryover, up to 25% of gross income from
 * farming (irs-pub-225-2025::sec::assessment-for-depreciable::b08, b09: $10,000 of
 * expenses against $32,000 of income gives $8,000). Blank with no expense.
 */
export function conservationDeduction(
  expenses: number | undefined,
  carryover: number | undefined,
  grossIncome: number,
): number | undefined {
  const claimed = sumOrBlank(expenses, carryover);
  if (claimed === undefined) return undefined;
  const limit = atLeast(0, grossIncome) * CONSERVATION_LIMIT_RATE;
  return roundDollars(Math.min(claimed, limit));
}

/* The conservation expenses carried to 2026: what line 10's limit left out. */
export function conservationCarryforward(
  expenses: number | undefined,
  carryover: number | undefined,
  line10: number | undefined,
): number {
  return atLeast(0, sum(expenses, carryover) - sum(line10));
}

/* One printed row of lines 30a to 30g; the 263A amount is negative (in parentheses). */
export interface OtherExpenseLine {
  description: string;
  amount: number;
}

const TOO_MANY_OTHER_EXPENSES =
  "More other expenses than lines 30a to 30g hold (line 30g takes the 263A costs when there are any); the engine does not print a statement.";

/*
 * Lines 30a to 30g (irs-4835-inst-2025::sec::lines-30a-through-30g::b01, part-ii::b01):
 * the other expenses in order; with capitalized costs, line 30g is "263A" and
 * the amount in parentheses, so six rows are left for the other expenses.
 */
export function otherExpenseLines(
  others: ReadonlyArray<FarmRentalOtherExpense> | undefined,
  capitalized: number | undefined,
): Array<OtherExpenseLine | undefined> | Gap {
  const rows: Array<OtherExpenseLine | undefined> = (others ?? []).map((row) => ({
    description: row.description,
    amount: roundDollars(row.amount),
  }));
  const capitalizedRow = (capitalized ?? 0) > 0 ? roundDollars(capitalized ?? 0) : undefined;
  const room = OTHER_EXPENSE_ROWS.length - (capitalizedRow === undefined ? 0 : 1);
  if (rows.length > room) return { gap: TOO_MANY_OTHER_EXPENSES };
  if (capitalizedRow === undefined) return rows;
  while (rows.length < room) rows.push(undefined);
  return [...rows, { description: CAPITALIZED_COSTS_LABEL, amount: -capitalizedRow }];
}

/*
 * Line 31: lines 8 through 30g, with the 263A costs of line 30g taken off
 * (irs-4835-inst-2025::sec::line-31::b01). Blank with no expense.
 */
export function totalExpenses(
  lineAmounts: ReadonlyArray<number | undefined>,
  otherRows: ReadonlyArray<OtherExpenseLine | undefined>,
): number | undefined {
  return sumOrBlank(...lineAmounts, ...otherRows.map((row) => row?.amount));
}

/* Lines 8 to 29 but line 10, each to its expense field (the form's labels). */
export const EXPENSE_FIELDS = {
  "8": "carAndTruck",
  "9": "chemicals",
  "11": "customHire",
  "12": "depreciation",
  "13": "employeeBenefits",
  "14": "feed",
  "15": "fertilizersAndLime",
  "16": "freightAndTrucking",
  "17": "gasolineFuelAndOil",
  "18": "insurance",
  "19a": "mortgageInterest",
  "19b": "otherInterest",
  "20": "laborHired",
  "21": "pensionAndProfitSharing",
  "22a": "rentVehiclesMachineryEquipment",
  "22b": "rentOther",
  "23": "repairsAndMaintenance",
  "24": "seedsAndPlants",
  "25": "storageAndWarehousing",
  "26": "supplies",
  "27": "taxes",
  "28": "utilities",
  "29": "veterinaryBreedingMedicine",
} as const satisfies Record<string, keyof FarmRentalExpenses>;
export type ExpenseLine = keyof typeof EXPENSE_FIELDS;

export interface Form4835PartII {
  expenses: Record<ExpenseLine, number | undefined>;
  line10: Line<number>;
  otherRows: Array<OtherExpenseLine | undefined>;
  line31: Line<number>;
}

/*
 * Part II. grossIncome is line 10's base (grossIncomeFromFarming), undefined while
 * line 7 waits; conservationGap is set when other farming shares the 25% limit.
 */
export function partII(
  farm: FarmRentalFactValue,
  grossIncome: number | undefined,
  conservationGap: string | undefined,
): Form4835PartII | Gap {
  const otherRows = otherExpenseLines(farm.otherExpenses, farm.capitalizedCosts263A);
  if (isGap(otherRows)) return otherRows;
  const stated = farm.expenses ?? {};
  const expenses = Object.fromEntries(
    Object.entries(EXPENSE_FIELDS).map(([line, field]) => [line, dollars(stated[field])]),
  ) as Record<ExpenseLine, number | undefined>;
  const claimed = sumOrBlank(stated.conservation, farm.conservationCarryover);
  const line10 = line10Of(farm, claimed, grossIncome, conservationGap);
  // Line 31 carries line 10's gap, and waits while line 10 waits.
  const line31: Line<number> = isGap(line10)
    ? line10
    : claimed !== undefined && line10 === undefined
      ? undefined
      : totalExpenses([...Object.values(expenses), line10], otherRows);
  return { expenses, line10, otherRows, line31 };
}

/* Line 10: blank with no claim, the shared-limit gap, undefined while line 7 waits. */
function line10Of(
  farm: FarmRentalFactValue,
  claimed: number | undefined,
  grossIncome: number | undefined,
  conservationGap: string | undefined,
): Line<number> {
  if (claimed === undefined) return undefined;
  if (conservationGap) return { gap: conservationGap };
  if (grossIncome === undefined) return undefined;
  return conservationDeduction(
    farm.expenses?.conservation,
    farm.conservationCarryover,
    grossIncome,
  );
}
