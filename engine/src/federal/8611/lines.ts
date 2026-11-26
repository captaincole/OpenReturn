/*
 * Form 8611's arithmetic, pure: every amount in whole dollars, every decimal
 * as thousandths (333 is .333, 1000 is 1.000). The comment over each rule
 * names its block in irs-8611-form-2025.
 */

import type { Form8609AAdditionsAmounts, LowIncomeHousingBasisChange } from "../../facts/index.js";
import { atLeast, roundDollars, roundToPlaces, sum } from "../../money.js";

/* Decimals on this form are carried to 3 places (lines 4 and 6, face-page-1::b01, b02). */
export const DECIMAL_PLACES = 3;
export const THOUSANDTHS = 1000;
/* "Enter 1.000 on line 6" (line-6::b01). */
export const FULL_RECAPTURE = THOUSANDTHS;

/*
 * Line 4, the credit recapture percentage, by the year of the compliance period
 * in which the recapture event occurs (line-4::b01): years 2 through 11 .333,
 * year 12 .267, year 13 .200, year 14 .133, year 15 .067.
 */
const FIRST_TABLE_YEAR = 2;
const LAST_FULL_RATE_YEAR = 11;
const FULL_RATE = 333;
const LATER_RATES: Readonly<Record<number, number>> = { 12: 267, 13: 200, 14: 133, 15: 67 };

/* The year of the compliance period that holds `taxYear`: the first credit year is year 1. */
export function yearOfCompliancePeriod(firstCreditYear: number, taxYear: number): number {
  return taxYear - firstCreditYear + 1;
}

/* Line 4 in thousandths; undefined outside years 2 to 15, which the table does not list. */
export function recapturePercentage(yearOfPeriod: number): number | undefined {
  if (yearOfPeriod >= FIRST_TABLE_YEAR && yearOfPeriod <= LAST_FULL_RATE_YEAR) return FULL_RATE;
  return LATER_RATES[yearOfPeriod];
}

/* A decimal rounded to 3 places, in thousandths. */
export function thousandthsOf(decimal: number): number {
  return roundDollars(roundToPlaces(decimal, DECIMAL_PLACES) * THOUSANDTHS);
}

/* "Multiply line N by line M": an amount times a printed decimal, nearest dollar. */
export function timesDecimal(amount: number, thousandths: number): number {
  return roundDollars((amount * thousandths) / THOUSANDTHS);
}

/*
 * DECISION (2026-11-25, by the author): line 6 is "a decimal amount carried out
 * to at least 3 places" (irs-8611-form-2025::sec::face-page-1::b02), and lines 7
 * and 9 multiply by "the decimal amount on line 6" (::face-page-1::b02,
 * ::line-9::b01). The engine carries exactly 3 places, rounded to the nearest,
 * and multiplies by the printed value, as line 4's table does (::line-4::b01).
 * Reason: one rule for every decimal on the form, the same as rows A1 and A28
 * of docs/rule-decisions.md.
 *
 * Line 6 (line-6::b01): 1.000 for a disposition that does not avoid recapture or
 * a fall below the minimum set-aside. Otherwise the decrease this year, measured
 * against the qualified basis of the first year of the credit period, both
 * "without regard to any additions to qualified basis after the first year":
 * a decrease first uses up the additions, so only the part of the first-year
 * basis lost counts. The prior-year example (Form 8611, Rev. 1-2006, Line 7
 * example) enters .3 for a building at 70% of its first-year basis in year 4.
 * 0 when the basis did not fall this year or stays at the first-year amount.
 */
export function basisDecreasePercentage(change: LowIncomeHousingBasisChange): number {
  if (change.kind !== "decrease") return FULL_RECAPTURE;
  const { firstYearQualifiedBasis, priorYearEndQualifiedBasis, yearEndQualifiedBasis } = change;
  if (yearEndQualifiedBasis >= priorYearEndQualifiedBasis || firstYearQualifiedBasis <= 0) return 0;
  const lost = atLeast(0, firstYearQualifiedBasis - yearEndQualifiedBasis);
  if (lost >= firstYearQualifiedBasis) return FULL_RECAPTURE;
  return thousandthsOf(lost / firstYearQualifiedBasis);
}

/* One Line 2 Worksheet (part-i::b01); e and h in thousandths. */
export interface Line2Worksheet {
  lineA: number;
  lineB: number;
  lineC: number;
  lineD: number;
  lineE: number;
  lineF: number;
  lineG: number;
  lineH: number;
  lineI: number;
}

/*
 * The Line 2 Worksheet for one prior year (part-i::b01, line-2::b01): a and c
 * from Form 8609-A lines 10 and 11, e the step 1 decimal of its line 14
 * instructions (0 when line 14 does not apply), h line 16 divided by line 15.
 * Each amount in whole dollars, each decimal to 3 places (QUESTIONS.md).
 */
export function line2Worksheet(amounts: Form8609AAdditionsAmounts): Line2Worksheet {
  const lineA = roundDollars(amounts.line10);
  const lineB = lineA * 2;
  const lineC = roundDollars(amounts.line11);
  const lineD = lineB - lineC;
  const lineE = thousandthsOf(amounts.line14Step1Decimal);
  const lineF = timesDecimal(lineD, lineE);
  const lineG = lineD - lineF;
  const lineH = amounts.line15 > 0 ? thousandthsOf(amounts.line16 / amounts.line15) : 0;
  const lineI = timesDecimal(lineG, lineH);
  return { lineA, lineB, lineC, lineD, lineE, lineF, lineG, lineH, lineI };
}

/* Lines 1 to 7 of a building the owner figures. */
export interface OwnPartLines {
  line1: number;
  line2: number;
  line3: number;
  line4: number;
  line5: number;
  line6: number;
  line7: number;
}

export interface OwnPartInputs {
  /* Each prior year's Form 8586 credit for the building, cents kept. */
  credits: readonly number[];
  worksheets: readonly Line2Worksheet[];
  line4: number;
  line6: number;
  acceleratedPortionRecapturedEarlier: number;
}

/*
 * Line 1: the credits of all prior years before the tax liability limit
 * (line-1::b01). Line 2: the i amounts of every Line 2 Worksheet (part-i::b01).
 * Line 3 = 1 − 2, line 5 = 3 × 4, line 7 = 5 × 6, less the accelerated portion
 * recaptured earlier: "do not recapture that amount again" (line-7::b01; the
 * Rev. 1-2006 example: $27 less the $18 of year 2 is $9), never below 0.
 */
export function ownPartLines(inputs: OwnPartInputs): OwnPartLines {
  const line1 = roundDollars(sum(...inputs.credits));
  const line2 = sum(...inputs.worksheets.map((worksheet) => worksheet.lineI));
  const line3 = line1 - line2;
  const line5 = timesDecimal(line3, inputs.line4);
  const line7 = atLeast(
    0,
    timesDecimal(line5, inputs.line6) - roundDollars(inputs.acceleratedPortionRecapturedEarlier),
  );
  return { line1, line2, line3, line4: inputs.line4, line5, line6: inputs.line6, line7 };
}

/*
 * Line 9 (line-9::b01): step 1 the unused credits, step 2 less those from
 * additions, steps 3 and 4 times line 4 and line 6, rounded once at the end.
 */
export function unusedAcceleratedPortion(
  unusedCredits: number,
  unusedCreditsFromAdditions: number,
  line4: number,
  line6: number,
): number {
  const step2 = atLeast(0, unusedCredits - unusedCreditsFromAdditions);
  return roundDollars((step2 * line4 * line6) / (THOUSANDTHS * THOUSANDTHS));
}

/* Lines 9 to 15. */
export interface RecaptureLines {
  line9: number;
  line10: number;
  line11: number;
  line12: number;
  line13: number;
  line14: number;
  line15: number;
}

/* Line 10: line 7 or line 8 less line 9, never below 0 (face-page-1::b02). */
export function netRecapture(recapture: number, line9: number): number {
  return atLeast(0, recapture - line9);
}

/*
 * Lines 12 to 15 (face-page-1::b02, b03; line-13::b01): line 12 = 10 + 11;
 * line 13 = the unused credits (line 9 step 1) less line 9; line 14 = 12 − 13
 * and line 15 = 13 − 12, each 0 when zero or less.
 */
export function recaptureLines(
  line9: number,
  line10: number,
  line11: number,
  unusedCredits: number,
): RecaptureLines {
  const line12 = line10 + line11;
  const line13 = atLeast(0, roundDollars(unusedCredits) - line9);
  return {
    line9,
    line10,
    line11,
    line12,
    line13,
    line14: atLeast(0, line12 - line13),
    line15: atLeast(0, line13 - line12),
  };
}

/* A decimal in thousandths as the form prints it around its point: "", "333"; "1", "000". */
export function decimalDigits(thousandths: number): { whole: string; decimal: string } {
  const whole = (thousandths - (thousandths % THOUSANDTHS)) / THOUSANDTHS;
  return {
    whole: whole === 0 ? "" : String(whole),
    decimal: String(thousandths % THOUSANDTHS).padStart(DECIMAL_PLACES, "0"),
  };
}

/* A decimal in thousandths as one text: ".250", "1.000". */
export function decimalText(thousandths: number): string {
  const { whole, decimal } = decimalDigits(thousandths);
  return `${whole}.${decimal}`;
}
