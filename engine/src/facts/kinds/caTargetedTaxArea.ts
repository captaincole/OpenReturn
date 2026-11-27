/*
 * FTB 3809, the former Targeted Tax Area (TTA). The TTA "has expired as of
 * December 31, 2012" and "no further TTA incentives can be generated"; a
 * taxpayer "can claim the hiring credit carryover", "the sales or use tax
 * credit carryover" and "an NOL carryover deduction from prior years"
 * (ca-3809-booklet-2025::sec::expired-tta::b01). So every amount here is
 * either a carryover from last year's form or a figure of this year's
 * business: no document comes with it. The taxpayer states each one from
 * last year's FTB 3809 and the business's books.
 *
 * One TTA business per return: "Attach a separate form FTB 3809 for each
 * business you operate or invest in" (ca-3809-booklet-2025::sec::how-to-claim-deductions-and-credit-carryovers::b01);
 * a second business is not modeled (state/ca/3809/QUESTIONS.md).
 */

/*
 * "operator": the taxpayer runs the business as a sole proprietor and
 * completes items A to H and Worksheet I, Section A. "investor": the
 * taxpayer receives the TTA amounts from a pass-through entity and completes
 * items A to D only (ca-3809-booklet-2025::sec::form-ftb-3809-instructions-for-items-a-through-h::b01).
 */
export type CaTtaRole = "operator" | "investor";

/* Side 1, the items above Part I. */
export interface CaTtaBusinessFactValue {
  role: CaTtaRole;
  /* The four-digit SIC code of the qualifying establishment (::standard-industrial-classification-sic-and-principal-business-activity-pba-codes::b01). */
  sicCode?: string;
  /* Item B. */
  businessName: string;
  /* Item C: the actual location where the business is conducted. */
  businessAddress: string;
  /* Item D: the specific area of the TTA (for example "Tulare County TTA, Porterville"). */
  areaName: string;
  /* Item E, operator only: the six-digit PBA code, as on federal Schedule C line B. */
  principalBusinessActivityCode?: string;
  /* Item F, operator only. */
  employeesInTta?: number;
  /* Item G, operator only. */
  grossAnnualReceipts?: number;
  /* Item H, operator only. */
  totalAssetValue?: number;
  /*
   * The business is a disregarded entity the taxpayer owns. The credit is then
   * limited to the tax with that entity's income less the tax without it
   * (ca-3809-booklet-2025::sec::other-limitations::b01), which the engine does
   * not figure. Absent: the taxpayer holds the business directly.
   */
  throughDisregardedEntity?: boolean;
}

/*
 * Worksheet I, Section A: the business's California and TTA property and
 * payroll (ca-3809-booklet-2025::sec::section-a-income-apportionment-2::b02, ::b03).
 * Property is the average yearly value at original cost, with rented property
 * at eight times the net annual rent (::property-factor::b01). Payroll is the
 * compensation paid to employees (::payroll-factor::b01).
 */
export interface CaTtaApportionmentFactValue {
  /* "If the business operates solely within the former TTA ... enter 100% (1.00)" (::instructions-for-worksheet-i-income-or-loss-apportionment-targeted-tax-area::b01). */
  whollyWithinTta: boolean;
  /* Column (a), total within California. */
  propertyCalifornia?: number;
  /* Column (b), total within the former TTA. */
  propertyTta?: number;
  payrollCalifornia?: number;
  payrollTta?: number;
}

/* The lines of Worksheet I, Section B (ca-3809-booklet-2025::sec::section-b-income-or-loss-apportionment-2::b02). */
export type CaTtaIncomeLine =
  | "wages" // line 1
  | "employee_business_expenses" // line 2
  | "pass_through" // line 4, one entity a row
  | "schedule_c" // line 6
  | "schedule_e" // line 7, rentals
  | "schedule_f" // line 8
  | "other_business" // line 9
  | "schedule_d" // line 11
  | "schedule_d1"; // line 12

/* The lines of the taxpayer's own business, whose percentage is Worksheet I, Section A, line 4. */
export const CA_TTA_OWN_BUSINESS_LINES: ReadonlyArray<CaTtaIncomeLine> = [
  "schedule_c",
  "schedule_e",
  "schedule_f",
  "other_business",
  "schedule_d",
  "schedule_d1",
];

/* One row of Worksheet I, Section B. */
export interface CaTtaIncomeItem {
  line: CaTtaIncomeLine;
  description: string;
  /*
   * Column (a): the California amount, signed as it adds into line 14: a loss
   * or an expense is negative ("John's unreimbursed employee business expenses
   * (2,000 × 50%): (1,000)", ca-3809-booklet-2025::sec::corporations-and-s-corporations::b02).
   * A pass-through row is the trade or business income from the Schedule K-1.
   * No disaster loss (::section-b-income-or-loss-apportionment::b01).
   */
  amount: number;
  /*
   * Column (b), a decimal from 0 to 1: the share of time worked in the former
   * TTA for wages (::part-i-individual-income-and-expense-items::b01), the
   * entity's TTA apportionment percentage for a pass-through row
   * (::part-ii-pass-through-income-or-loss::b02). Absent on a row of the
   * taxpayer's own business: the engine takes Worksheet I, Section A, line 4
   * (::located-entirely-within-california::b01).
   */
  ttaPercentage?: number;
}

/* Worksheet I, Section B: every item of TTA business income or loss. An empty list is no TTA business income. */
export interface CaTtaBusinessIncomeFactValue {
  items: CaTtaIncomeItem[];
}

/*
 * Worksheet II, lines 8a to 8l: the TTA NOL carried from each year of loss,
 * 2001 to 2012, last year's Worksheet II column (e). An empty list is no TTA
 * NOL carryover.
 */
export interface CaTtaNolCarryoverRow {
  lossYear: number;
  carryover: number;
}

export interface CaTtaNolCarryoversFactValue {
  rows: CaTtaNolCarryoverRow[];
}

/* The first and last years a TTA NOL could be incurred (Worksheet II lines 8a and 8l). */
export const CA_TTA_FIRST_LOSS_YEAR = 2001;
export const CA_TTA_LAST_LOSS_YEAR = 2012;

export const CA_TTA_KEYS = {
  /* A CaTtaBusinessFactValue. */
  business: "ca_tta.business",
  /* A CaTtaApportionmentFactValue: Worksheet I, Section A. */
  apportionment: "ca_tta.apportionment",
  /* A CaTtaBusinessIncomeFactValue: Worksheet I, Section B. */
  businessIncome: "ca_tta.business_income",
  /*
   * Schedule Z line 8B column (b): "the total prior year credit carryover from
   * prior year's Schedule Z, Part II, line 8B, column (g)"
   * (ca-3809-booklet-2025::sec::part-ii-limitation-of-credits-for-corporations-individuals-estates-and-trusts::b01).
   * A number; 0 when none.
   */
  hiringCreditCarryover: "prior_year.ca_tta_hiring_credit_carryover",
  /* Schedule Z line 9B column (b): last year's line 9B column (g) (::b03). A number; 0 when none. */
  salesUseTaxCreditCarryover: "prior_year.ca_tta_sales_use_tax_credit_carryover",
  /* A CaTtaNolCarryoversFactValue: Worksheet II column (b). */
  nolCarryovers: "prior_year.ca_tta_nol_carryovers",
} as const;
