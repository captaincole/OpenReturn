/*
 * FTB 3809, Targeted Tax Area Deduction and Credit Summary: the arithmetic,
 * pure. Worksheet I (the TTA share of business income), Worksheet II (the
 * TTA NOL carryover deduction) and Schedule Z (the credit carryover limit),
 * from ca-3809-booklet-2025. The booklet's examples with numbers are unit
 * tests (QUESTIONS.md, the confidence table).
 */

import { atLeast, roundDollars, sum, wholePart } from "../../../money.js";

/*
 * Worksheet I, Section A prints its percentages to two places of a percent:
 * the booklet's example gives "66.66%" for $800,000 of $1,200,000 and "73.33%"
 * for the average, and $250,000 × 73.33% = $183,325
 * (ca-3809-booklet-2025::sec::corporations-filing-a-combined-report::b03).
 * So a factor and the average keep four decimal places and drop the rest.
 */
export const RATIO_PLACES = 4;
const RATIO_SCALE = 10 ** RATIO_PLACES;
const FLOAT_TOLERANCE = 1e-9;
/* "If your operation is wholly within the former TTA, the average apportionment percentage is 100% (1.00)" (the form, Side 1 line 2). */
export const WHOLLY_WITHIN_TTA = 1;

/* A ratio kept to four places, the rest dropped, never above 1. */
export function truncatedRatio(part: number, whole: number): number {
  if (whole <= 0 || part <= 0) return 0;
  const ratio = Math.min(1, part / whole);
  return wholePart(ratio * RATIO_SCALE + FLOAT_TOLERANCE) / RATIO_SCALE;
}

export interface ApportionmentInputs {
  whollyWithinTta: boolean;
  propertyCalifornia: number;
  propertyTta: number;
  payrollCalifornia: number;
  payrollTta: number;
}

/*
 * Worksheet I, Section A, line 4: half of line 3, the sum of the property and
 * payroll percentages of column (c) (column (b) ÷ column (a)). "Factors with
 * zero balances in the totals of column (a) will not be included ... the
 * average apportionment percentage would be computed by dividing line 3 by one
 * instead of by two" (ca-3809-booklet-2025::sec::section-a-income-apportionment-2::b04).
 * With no California property or payroll there is no factor, and the
 * percentage is 0.
 */
export function averageApportionment(inputs: ApportionmentInputs): number {
  if (inputs.whollyWithinTta) return WHOLLY_WITHIN_TTA;
  const factors = [
    [inputs.propertyTta, inputs.propertyCalifornia],
    [inputs.payrollTta, inputs.payrollCalifornia],
  ].filter(([, california]) => california > 0);
  if (factors.length === 0) return 0;
  const line3 = sum(...factors.map(([tta, california]) => truncatedRatio(tta, california)));
  return truncatedRatio(line3, factors.length);
}

/*
 * Worksheet I, Section B, column (c) of one row: column (a) times column (b),
 * in whole dollars ("John's TTA salary ($100,000 × 50%): $50,000",
 * ca-3809-booklet-2025::sec::corporations-and-s-corporations::b02).
 */
export const ttaShare = (amount: number, percentage: number): number =>
  roundDollars(amount * percentage);

/*
 * Worksheet I, Section B, line 14: "Add line 3, line 10, and line 13, column
 * (c), and line 5, column (b)", the TTA share of every row
 * (ca-3809-booklet-2025::sec::part-iii-taxpayer-s-trade-or-business-see-instructions::b01).
 */
export const line14 = (shares: readonly number[]): number => sum(...shares);

export interface NolRow {
  lossYear: number;
  /* Column (b): the carryover from the prior year. */
  carryover: number;
}

export interface NolRowLines extends NolRow {
  /* Column (c): the amount deducted this year. */
  deducted: number;
  /* Column (d): the balance available to offset losses. */
  balance: number;
  /* Column (e): the TTA NOL carryover to future years. */
  carriedForward: number;
}

export interface WorksheetII {
  /* Line 7, column (d): the modified taxable income. */
  line7: number;
  rows: NolRowLines[];
  /* Line 9, the totals of columns (b), (c) and (e): FTB 3809 lines 3a, 3b and 3c. */
  totalCarryover: number;
  totalDeducted: number;
  totalCarriedForward: number;
}

/*
 * Worksheet II for a Form 540 filer. Line 1 and line 6 are Worksheet I,
 * Section B, line 14 ("skip line 2 through line 5"), and a negative line 14
 * leaves no TTA business income ("you cannot utilize any TTA NOL carryover",
 * ca-3809-booklet-2025::sec::located-within-and-outside-the-former-tta-and-california::b02),
 * so line 7 is never below 0. Lines 8a to 8l, oldest first: "In column (c),
 * enter the smaller of the amount in column (b) or the amount in column (d)
 * from the previous line. In column (d), enter the result of subtracting
 * column (c) from the balance on the previous line ... In column (e), ...
 * column (b) minus column (c)"; while the NOL is suspended, "do not put any
 * amounts in column (c)"
 * (ca-3809-booklet-2025::sec::instructions-for-worksheet-ii-computation-of-nol-carryover-and-carryover-limitations-targeted-tax-area::b02).
 * "The TTA NOL carryover deduction may not be larger than your MTI" (::b02).
 */
export function worksheetII(
  businessIncome: number,
  carryovers: readonly NolRow[],
  suspended: boolean,
): WorksheetII {
  const line7 = atLeast(0, businessIncome);
  let balance = line7;
  const rows = [...carryovers]
    .sort((left, right) => left.lossYear - right.lossYear)
    .map((row) => {
      const deducted = suspended ? 0 : Math.min(row.carryover, balance);
      balance -= deducted;
      return { ...row, deducted, balance, carriedForward: row.carryover - deducted };
    });
  return {
    line7,
    rows,
    totalCarryover: sum(...rows.map((row) => row.carryover)),
    totalDeducted: sum(...rows.map((row) => row.deducted)),
    totalCarriedForward: sum(...rows.map((row) => row.carriedForward)),
  };
}

export interface ScheduleZPartI {
  line1: number;
  line3: number;
  line4: number;
  line5: number;
  line6a: number;
  line6b: number;
  line7: number;
}

/*
 * Schedule Z, Part I, for an individual. Line 1 and line 3 are Worksheet I,
 * Section B, line 14 ("Individuals: Enter the amount ... on this line and on
 * line 3 (skip line 2)", the form). Line 14 goes there only when it "is a
 * positive amount"; "If the amount is negative, you do not have any business
 * income attributable to the former TTA"
 * (ca-3809-booklet-2025::sec::located-within-and-outside-the-former-tta-and-california::b02),
 * so lines 1 and 3 are never below 0, as Worksheet II line 7 is not. Line 4 is the TTA NOL deduction; line 5,
 * line 3 less line 4. Line 6a: "Compute the tax as if the former TTA taxable
 * income represented all of your taxable income"
 * (ca-3809-booklet-2025::sec::part-i-computation-of-credit-limitations::b02), with
 * "the tax table or tax rate schedule ... for your filing status"
 * (::individuals::b01): `taxOn` is that lookup, 0 for no income. Line 6b is
 * Form 540 line 35; line 7, the smaller of 6a and 6b (the form).
 */
export function scheduleZPartI(
  businessIncome: number,
  nolDeduction: number,
  form540Line35: number,
  taxOn: (taxableIncome: number) => number,
): ScheduleZPartI {
  const line3 = atLeast(0, businessIncome);
  const line5 = line3 - nolDeduction;
  const line6a = line5 > 0 ? taxOn(line5) : 0;
  const line6b = atLeast(0, form540Line35);
  return {
    line1: line3,
    line3,
    line4: nolDeduction,
    line5,
    line6a,
    line6b,
    line7: Math.min(line6a, line6b),
  };
}

/*
 * The credit the return can take before the tax left decides: Schedule P (540)
 * column (a). Each credit is limited by "the amount of tax on TTA business
 * income" (ca-3809-booklet-2025::sec::credit-limitations::b01), and the two
 * share line 7: line 9A column (e) is line 8A column (e) less what the hiring
 * credit used. So the pair together is at most line 7.
 *
 * DECISION (2026-11-26, by the author): Schedule P (540) column (a) of the
 * code 210 line holds the TTA carryovers already limited by Schedule Z line 7,
 * not the whole carryover, so its column (d) shows only the part the tax left
 * could not take.
 * - Schedule P (540): column (a), "Enter the amount of credit available to
 *   offset tax"; column (d), "the amount of credit carryover available to use
 *   in future years by subtracting the amount in column (b) ... from the
 *   amount in column (a)" (ca-540-sched-p-inst-2025::sec::column-a-through-column-d-instructions::b01).
 * - FTB 3809: line 8A column (f), "the amount of credit carryover that is
 *   used on Schedule P ... cannot be greater than the amount on line 8A,
 *   column (e)", and line 8B column (g) is the carryover that "includes both
 *   the Schedule P ... limitation and the limitation based on TTA business
 *   income" (ca-3809-booklet-2025::sec::part-ii-limitation-of-credits-for-corporations-individuals-estates-and-trusts::b01, ::b02).
 * Only the limited amount can offset tax, and the credit's own form keeps the
 * full carryover (lines 8B and 9B column (g)), so Schedule P column (a) takes
 * the limited amount and column (b) never passes Schedule Z line 7 (decision A86).
 */
export const creditAvailableToOffsetTax = (
  hiringCarryover: number,
  salesCarryover: number,
  line7: number,
): number => Math.min(hiringCarryover + salesCarryover, atLeast(0, line7));

export interface ScheduleZPartII {
  line8aColE: number;
  line8aColF: number;
  line8bColB: number;
  line8bColD: number;
  line8bColE: number;
  line8bColG: number;
  line9aColE: number;
  line9aColF: number;
  line9bColB: number;
  line9bColD: number;
  line9bColE: number;
  line9bColG: number;
}

/*
 * Schedule Z, Part II, for an individual
 * (ca-3809-booklet-2025::sec::part-ii-limitation-of-credits-for-corporations-individuals-estates-and-trusts::b01
 * to ::b04). `used` is the credit Schedule P (540) column (b) takes, both
 * credits together; the hiring credit (line 8) uses it first, as the lines run.
 * - 8A (e): line 7. 8A (f): the credit used, never more than 8A (e) or 8B (d).
 * - 8B (b): last year's carryover. 8B (c): "Individuals, estates, and trusts,
 *   leave blank", so 8B (d) is 8B (b). 8B (e): the smaller of 8A (e) and 8A
 *   (f). 8B (g): 8B (d) less 8B (e).
 * - 9A (e): 8A (e) less 8B (e). 9A (f), 9B (b) to (g): as line 8.
 */
export function scheduleZPartII(
  line7: number,
  hiringCarryover: number,
  salesCarryover: number,
  used: number,
): ScheduleZPartII {
  const line8aColE = atLeast(0, line7);
  const line8aColF = Math.min(hiringCarryover, line8aColE, atLeast(0, used));
  const line8bColE = Math.min(line8aColE, line8aColF);
  const line9aColE = line8aColE - line8bColE;
  const line9aColF = Math.min(salesCarryover, line9aColE, atLeast(0, used - line8aColF));
  const line9bColE = Math.min(line9aColE, line9aColF);
  return {
    line8aColE,
    line8aColF,
    line8bColB: hiringCarryover,
    line8bColD: hiringCarryover,
    line8bColE,
    line8bColG: hiringCarryover - line8bColE,
    line9aColE,
    line9aColF,
    line9bColB: salesCarryover,
    line9bColD: salesCarryover,
    line9bColE,
    line9bColG: salesCarryover - line9bColE,
  };
}

/* Part I line 1c: "Add line 1a and line 1b" (the form). */
export const line1c = (line1a: number, line1b: number): number => line1a + line1b;

/*
 * "The total of all business credits including the carryover of any business
 * credit for the taxable year may not reduce the 'net tax' ... by more than
 * $5,000,000" for taxable years 2024 to 2026
 * (ca-3809-booklet-2025::sec::general-information::b02). The credits cannot
 * take more than the net tax, so the limit can bind only when Form 540 line 35
 * is above it.
 */
export const BUSINESS_CREDIT_LIMIT = 5_000_000;
export const limitCanBind = (form540Line35: number): boolean =>
  form540Line35 > BUSINESS_CREDIT_LIMIT;

/* "Use credit code 210 to claim the TTA hiring credit and sales or use tax credit carryover" (ca-3809-booklet-2025::sec::credit-code::b01). */
export const TTA_CREDIT_CODE = "210";
/*
 * The Credit Table names two credits with code 210, "Targeted Tax Area Hiring"
 * and "Targeted Tax Area Sales or Use Tax" (ca-540-sched-p-inst-2025::sec::credit-table::b08),
 * and "Do not enter the same credit code or name on more than one line within a
 * section" (::to-complete-part-iii::b01): one line holds both, as FTB 3809 line
 * 1c adds them.
 */
export const TTA_CREDIT_NAME = "Targeted Tax Area";
