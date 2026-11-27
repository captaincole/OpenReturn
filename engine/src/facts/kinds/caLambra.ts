/*
 * FTB 3807, the Local Agency Military Base Recovery Area (LAMBRA) deduction
 * and credit summary. All LAMBRAs were repealed on January 1, 2014: no new
 * credit or NOL arises, but "taxpayers can claim the sales or use tax credit
 * carryover or NOL carryover deduction from previous years"
 * (ca-3807-booklet-2025::sec::lambra-incentives-repealed::b01), and the hiring
 * credit carryover (::expired-lambra-hiring-credit::b01). No document prints
 * these amounts: the taxpayer states them from last year's FTB 3807 and from
 * the booklet's worksheets, which stay with the taxpayer's records
 * (::form-109-filers::b01, "Keep all completed worksheets").
 *
 * Five inputs, one business ("Attach a separate form FTB 3807 for each LAMBRA
 * business", ::how-to-claim-deductions-and-credit-carryovers::b01; the engine
 * fills one form, QUESTIONS.md):
 * - the business (items B to H and Worksheet I, Section A);
 * - the income rows of Worksheet I, Section B (the LAMBRA business income);
 * - last year's hiring credit carryover and sales or use tax credit carryover;
 * - the LAMBRA NOL carryovers by year of loss (Worksheet II, lines 8a to 8m).
 */

type FactRow = { key: string; value: unknown; category: string };

/* One factor of Worksheet I, Section A: the average value or the total, in California and in the former LAMBRA. */
export interface CaLambraFactor {
  /* Column (a): "Total within California". */
  california: number;
  /* Column (b): "Total within a former LAMBRA". */
  lambra: number;
}

/* Items B to H and Worksheet I, Section A. */
export interface CaLambraBusinessFactValue {
  /* Item B: the name of the LAMBRA business. */
  businessName: string;
  /* Item C: the address (actual location) where the business is conducted. */
  businessAddress: string;
  /* Item D: the name of the former LAMBRA (::former-lambra-designation::b01 lists the eight). */
  lambraName: string;
  /*
   * True: the taxpayer operates the business (a sole proprietor), and items E
   * to H are completed. False: an investor of a pass-through entity, who
   * completes "items A through D" only (::form-ftb-3807-instructions-for-items-a-through-h::b01).
   */
  operatesBusiness: boolean;
  /* Item E: the six-digit principal business activity code (federal Schedule C line B). */
  principalBusinessActivityCode?: string;
  /* Item F: the total number of employees in the former LAMBRA. */
  employees?: number;
  /* Item G: the gross annual receipts of the business. */
  grossReceipts?: number;
  /* Item H: the total asset value of the business. */
  totalAssets?: number;
  /*
   * Worksheet I: the business operates solely within one former LAMBRA, with
   * all its property and payroll there; Section A line 4 is then 1.00
   * (::instructions-for-worksheet-i-income-or-loss-apportionment::b01).
   */
  whollyWithinLambra?: boolean;
  /* Worksheet I, Section A, "Total property values" (average yearly value, at original cost). */
  property?: CaLambraFactor;
  /* Worksheet I, Section A, line 2, "Total payroll". */
  payroll?: CaLambraFactor;
}

/*
 * The line of Worksheet I, Section B that a row fills
 * (::located-within-and-outside-the-former-lambra-and-california::b04 to ::b08):
 * line 1 wages, line 2 employee business expenses, line 4 a pass-through
 * entity, lines 6 to 9 the taxpayer's trade or business (Schedule C, Schedule
 * E rentals, Schedule F, other), lines 11 and 12 business gains and losses
 * (Schedule D, Schedule D-1).
 */
export type CaLambraIncomeLine =
  | "wages"
  | "employee_business_expenses"
  | "pass_through"
  | "schedule_c"
  | "schedule_e"
  | "schedule_f"
  | "other_business"
  | "schedule_d"
  | "schedule_d1";

export interface CaLambraIncomeRow {
  line: CaLambraIncomeLine;
  /* What the row is: the employer, the entity, the business. */
  description: string;
  /*
   * Column (a): the California amount, with cents; a loss or an expense is
   * negative. Disaster losses are left out ("Do not include disaster losses in
   * any amounts used in the table", ::section-b-income-or-loss-apportionment::b01).
   */
  amount: number;
  /*
   * Column (b) for wages and employee business expenses (the share of time
   * worked in the former LAMBRA, ::part-i-individual-income-and-expense-items::b01)
   * and for a pass-through entity (the entity's LAMBRA apportionment
   * percentage, ::part-ii-pass-through-income-or-loss::b02), as a decimal from
   * 0 to 1. The trade or business lines take Section A line 4 instead
   * (::located-entirely-within-california::b01), so they leave it out.
   */
  percentage?: number;
}

/* One row of Worksheet II, lines 8a to 8m. */
export interface CaLambraNolCarryover {
  /* The taxable year the loss was incurred: 2001 to 2013 (lines 8a to 8m). */
  yearOfLoss: number;
  /* Column (b), "Carryover from prior year": last year's column (e), a positive amount. */
  carryover: number;
}

export const CA_LAMBRA_KEYS = {
  /* A CaLambraBusinessFactValue. */
  business: "ca_lambra.business",
  /* A list of CaLambraIncomeRow; an empty list is an answer (no LAMBRA business income). */
  businessIncome: "ca_lambra.business_income",
  /*
   * Schedule Z line 8B column (b): the hiring credit carryover from last year's
   * Schedule Z, Part II, line 8B, column (g) (the DECISION in
   * state/ca/3807/bindings.ts). A number; 0 when none.
   */
  hiringCreditCarryover: "prior_year.ca_lambra_hiring_credit_carryover",
  /*
   * Schedule Z line 9B column (b): "the total prior year credit carryover from
   * prior year's Schedule Z, Part II, line 9B, column (g)"
   * (::part-ii-limitation-of-credits-for-corporations-individuals-estates-and-trusts::b03).
   * A number; 0 when none.
   */
  salesUseTaxCreditCarryover: "prior_year.ca_lambra_sales_use_tax_credit_carryover",
  /* A list of CaLambraNolCarryover; an empty list is an answer (no LAMBRA NOL carryover). */
  nolCarryovers: "prior_year.ca_lambra_nol_carryovers",
} as const;

export const CA_LAMBRA_CATEGORY = "other";

/* Worksheet II's first and last year of loss (lines 8a and 8m). */
export const FIRST_LAMBRA_NOL_YEAR = 2001;
export const LAST_LAMBRA_NOL_YEAR = 2013;

const INCOME_LINES: ReadonlySet<string> = new Set<CaLambraIncomeLine>([
  "wages",
  "employee_business_expenses",
  "pass_through",
  "schedule_c",
  "schedule_e",
  "schedule_f",
  "other_business",
  "schedule_d",
  "schedule_d1",
]);

const finiteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

function isIncomeRow(value: unknown): value is CaLambraIncomeRow {
  const row = value as Partial<CaLambraIncomeRow> | null;
  return (
    typeof row === "object" &&
    row !== null &&
    typeof row.line === "string" &&
    INCOME_LINES.has(row.line) &&
    finiteNumber(row.amount) &&
    (row.percentage === undefined || finiteNumber(row.percentage))
  );
}

function isNolCarryover(value: unknown): value is CaLambraNolCarryover {
  const row = value as Partial<CaLambraNolCarryover> | null;
  return (
    typeof row === "object" &&
    row !== null &&
    finiteNumber(row.yearOfLoss) &&
    finiteNumber(row.carryover)
  );
}

const listOf = <T>(
  facts: ReadonlyArray<FactRow>,
  key: string,
  isRow: (value: unknown) => value is T,
) => {
  const fact = facts.find((row) => row.key === key);
  if (fact === undefined || !Array.isArray(fact.value)) return undefined;
  return fact.value.filter(isRow);
};

/* The stated income rows in the order recorded; undefined when the answer is not recorded. */
export function getCaLambraIncomeRows(
  facts: ReadonlyArray<FactRow>,
): CaLambraIncomeRow[] | undefined {
  return listOf(facts, CA_LAMBRA_KEYS.businessIncome, isIncomeRow);
}

/* The stated NOL carryovers in the order recorded; undefined when the answer is not recorded. */
export function getCaLambraNolCarryovers(
  facts: ReadonlyArray<FactRow>,
): CaLambraNolCarryover[] | undefined {
  return listOf(facts, CA_LAMBRA_KEYS.nolCarryovers, isNolCarryover);
}
