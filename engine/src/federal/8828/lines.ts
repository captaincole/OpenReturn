import type { MortgageSubsidyTableRow } from "../../facts/index.js";
import { roundDollars, roundToPlaces } from "../../money.js";
import { fullMonthsBetween, yearsBetween } from "../4797/dates.js";

/*
 * Form 8828 arithmetic, from YYYY-MM-DD dates and dollar amounts. Every rule
 * names its block of irs-8828-inst-2025 (or of the form face, irs-8828-face-2025).
 */

/* Face note under line 5: "If the date of closing of the loan was before January 1, 1991, recapture tax does not apply." */
export const FIRST_CLOSING_DATE_WITH_RECAPTURE = "1991-01-01";
/* "during the first 9 years after you received a federally subsidized QMB or MCC loan" (recapture-tax::b01). */
export const RECAPTURE_PERIOD_YEARS = 9;
/* Line 14: "Multiply line 13 by 50% (.50)" (face-part-ii::b01). */
export const GAIN_SHARE = 0.5;
/* Line 18: "If the amount on line 17 is $5,000 or more, enter "100."" (face-part-ii::b01). */
export const INCOME_PERCENTAGE_STEP = 5000;
export const FULL_PERCENTAGE = 100;
/* Line 16: the notice's family-size columns, 2 or fewer and 3 or more (line-16::b01). */
export const LARGER_FAMILY_SIZE = 3;
/* Worksheet line B: "If the repayment date on line B is more than 4 years after the closing date ... do not use this worksheet" (holding-period-percentage-worksheet::b01). */
export const REPAYMENT_WORKSHEET_YEARS = 4;
/* Worksheet line D: 1 year 20%, 2 years 40%, 3 years 60%, 4 years 80% (::b01, ::b02). */
export const REPAYMENT_YEAR_PERCENTAGES = [20, 40, 60, 80] as const;
/* Worksheet line G: 1 year 100%, 2 80%, 3 60%, 4 40%, 5 20%, 6 or more 0% (::b02). */
export const AFTER_REPAYMENT_PERCENTAGES = [100, 80, 60, 40, 20] as const;
const MONTHS_PER_YEAR = 12;
const WHOLE_PERCENT = 0;

/* Line 7: "Number of years and full months between original closing date (line 5) and date of sale" (face-part-i::b02). */
export function holdingPeriod(closingDate: string, saleDate: string) {
  const months = fullMonthsBetween(closingDate, saleDate);
  const fullMonths = months % MONTHS_PER_YEAR;
  return { years: (months - fullMonths) / MONTHS_PER_YEAR, fullMonths };
}

/* Years from one date to another, a part year counted as a whole year ("Round up to the nearest whole year", worksheet lines C and F). */
export function yearsRoundedUp(from: string, to: string): number {
  const { full, partYear } = yearsBetween(from, to);
  return full + (partYear ? 1 : 0);
}

/*
 * Line 16's row: "the line that corresponds to the number of full and partial
 * years that you held your home" (line-16::b01, b02); line 20 reads the same row
 * (line-20::b01).
 */
export function yearsHeld(closingDate: string, saleDate: string): number {
  return yearsRoundedUp(closingDate, saleDate);
}

/*
 * Who must file: a loan "provided after December 31, 1990" (who-must-file::b01),
 * and a sale within the 9-year period.
 *
 * DECISION (2026-11-25, by the author): a sale more than 9 years after the
 * closing files no Form 8828. Text A, irs-8828-inst-2025::sec::who-must-file::b01:
 * "You must file this form if all of the following apply ... You sold or
 * otherwise disposed of your home ... Your original mortgage loan was provided
 * after December 31, 1990 ... You received a federal mortgage subsidy", with no
 * time limit. Text B, ::recapture-tax::b01: "If you sold or otherwise disposed of
 * your home during the first 9 years ... you may have to pay back (recapture)";
 * and line 16 reads "the line that corresponds to the number of full and partial
 * years that you held your home" (::line-16::b02) of a table that has 9 lines.
 * The engine follows Text B: after 9 years the form's own lines 16 and 20 have no
 * value to take, and the form's arithmetic wins over a sentence that breaks it.
 */
export function withinRecapturePeriod(closingDate: string, saleDate: string): boolean {
  return (
    closingDate >= FIRST_CLOSING_DATE_WITH_RECAPTURE &&
    yearsHeld(closingDate, saleDate) <= RECAPTURE_PERIOD_YEARS
  );
}

/*
 * The worksheet applies when the loan was fully repaid "(1) before the date of
 * sale or disposition of your home, and (2) within the first 4 years after the
 * closing date" (holding-period-percentage-worksheet::b01; line-20::b01). Not
 * when lines 6 and 8 are the same date. A repayment on the 4th anniversary is
 * not "more than 4 years after".
 */
export function usesRepaymentWorksheet(
  closingDate: string,
  repaymentDate: string | undefined,
  saleDate: string,
): boolean {
  if (repaymentDate === undefined || repaymentDate >= saleDate) return false;
  const { full, partYear } = yearsBetween(closingDate, repaymentDate);
  return full < REPAYMENT_WORKSHEET_YEARS || (full === REPAYMENT_WORKSHEET_YEARS && !partYear);
}

export interface RepaymentWorksheet {
  lineC: number;
  lineD: number;
  lineF: number;
  lineG: number;
  /* The adjusted holding period percentage for line 20. */
  lineH: number;
}

/*
 * Worksheet lines C to H (holding-period-percentage-worksheet::b01–b03). A
 * repayment on the closing day counts as 1 year on line C (QUESTIONS.md).
 */
export function repaymentWorksheet(
  closingDate: string,
  repaymentDate: string,
  saleDate: string,
): RepaymentWorksheet {
  const lineC = Math.max(1, yearsRoundedUp(closingDate, repaymentDate));
  const lineD = REPAYMENT_YEAR_PERCENTAGES[lineC - 1] ?? 0;
  const lineF = yearsRoundedUp(repaymentDate, saleDate);
  const lineG = AFTER_REPAYMENT_PERCENTAGES[lineF - 1] ?? 0;
  const lineH = roundToPlaces((lineD * lineG) / FULL_PERCENTAGE, WHOLE_PERCENT);
  return { lineC, lineD, lineF, lineG, lineH };
}

/* The notice's row for the years held; undefined when the table has none. */
export function tableRowFor(
  table: ReadonlyArray<MortgageSubsidyTableRow>,
  years: number,
): MortgageSubsidyTableRow | undefined {
  return table.find((row) => row.yearsHeld === years);
}

/* Line 16: the row's amount in the column of the family size at the sale (line-16::b01). */
export function adjustedQualifyingIncome(row: MortgageSubsidyTableRow, familySize: number): number {
  return roundDollars(
    familySize >= LARGER_FAMILY_SIZE
      ? row.adjustedQualifyingIncomeThreeOrMore
      : row.adjustedQualifyingIncomeTwoOrFewer,
  );
}

export interface GainLines {
  line9: number;
  line10: number;
  line11: number;
  line12: number;
  line13: number;
  /* Blank on a loss: "If a loss, stop here" (line 13, face-part-ii::b01). */
  line14?: number;
}

/* Lines 9 to 14 (face-part-ii::b01): each amount whole dollars, then the form's arithmetic. */
export function gainLines(salesPrice: number, expensesOfSale: number, adjustedBasis: number) {
  const line9 = roundDollars(salesPrice);
  const line10 = roundDollars(expensesOfSale);
  const line11 = line9 - line10;
  const line12 = roundDollars(adjustedBasis);
  const line13 = line11 - line12;
  const lines: GainLines = { line9, line10, line11, line12, line13 };
  return line13 < 0 ? lines : { ...lines, line14: roundDollars(line13 * GAIN_SHARE) };
}

/*
 * Line 15: "Begin with: Your adjusted gross income as shown on line 11 of your
 * Form 1040 ... Add: Any tax-exempt interest ... Subtract: Any gain included in
 * your gross income because of the disposition of your home" (line-15::b01).
 */
export function modifiedAgi(agi: number, taxExemptInterest: number, gainIncluded: number): number {
  return roundDollars(agi + taxExemptInterest - gainIncluded);
}

/*
 * Line 18: 100 when line 17 is $5,000 or more; otherwise line 17 / $5,000 as a
 * percentage, "Round to the nearest whole percentage" (face-part-ii::b01).
 *
 * DECISION (2026-11-25, by the author): line 18 rounds to the nearest whole
 * percent. Text A, irs-8828-face-2025::sec::face-part-ii::b01: "divide the amount
 * on line 17 by $5,000 and enter the result as a percentage. Round to the nearest
 * whole percentage". Text B, an issuer's notice that the line 16 instructions
 * send the taxpayer to (NJ HMFA, "Notice to Mortgagor of Potential Federal
 * Recapture Tax on Sale of Home", nj.gov/dca/hmfa/lenders/docs/len_recapture_tax.pdf):
 * "The "income percentage" is 1 percent for each $50 by which your family's
 * modified adjusted gross income exceeds the applicable adjusted qualifying
 * income", which counts only whole $50 steps. The engine follows Text A: a
 * form's own instructions decide how that form is filled.
 */
export function incomePercentage(line17: number): number {
  if (line17 >= INCOME_PERCENTAGE_STEP) return FULL_PERCENTAGE;
  return roundToPlaces((line17 / INCOME_PERCENTAGE_STEP) * FULL_PERCENTAGE, WHOLE_PERCENT);
}

/* Line 19 for the filer's interest: the notice's amount times the ownership share, whole dollars. */
export function subsidizedAmountForInterest(amount: number, ownershipShare = 1): number {
  return roundDollars(amount * ownershipShare);
}

export interface RecaptureInputs {
  line14: number;
  line15: number;
  line16: number;
  line19: number;
  /* In percent. */
  line20: number;
}

export interface RecaptureLines {
  line17: number;
  /* Lines 18 to 23 are blank when line 17 is zero or less: "stop here" (face-part-ii::b01). */
  line18?: number;
  line19?: number;
  line20?: number;
  line21?: number;
  line22?: number;
  line23?: number;
}

/* Lines 17 to 23 (face-part-ii::b01, b02). */
export function recaptureLines(inputs: RecaptureInputs): RecaptureLines {
  const line17 = inputs.line15 - inputs.line16;
  if (line17 <= 0) return { line17 };
  const line18 = incomePercentage(line17);
  // Line 21: "Multiply line 19 by the percentage on line 20".
  const line21 = roundDollars((inputs.line19 * inputs.line20) / FULL_PERCENTAGE);
  // Line 22: "Recapture amount. Multiply line 21 by the percentage on line 18".
  const line22 = roundDollars((line21 * line18) / FULL_PERCENTAGE);
  // Line 23: "Tax. Enter the smaller of line 14 or line 22".
  const line23 = Math.min(inputs.line14, line22);
  return { line17, line18, line19: inputs.line19, line20: inputs.line20, line21, line22, line23 };
}
