/*
 * Form 8814's arithmetic as pure functions: the lines of one child's form from
 * the child's amounts and one year's printed amounts.
 */

import { atLeast, roundDollars, roundToPlaces, sum } from "../../money.js";

/* The amounts the form prints for a year; a test can pass another year's. */
export interface Form8814Amounts {
  /* Line 5, the base amount; line 4 at or under it skips lines 5–12. */
  baseAmount: number;
  /* Line 13, the amount not taxed; line 15 also asks whether line 14 is less than it. */
  amountNotTaxed: number;
  /* Line 15 "No": the tax entered. */
  maximumTax: number;
  /* Line 15 "Yes": the rate on line 14. */
  rate: number;
  /* Line 4: at or over this total, the form is not filed and the child files a return. */
  grossIncomeLimit: number;
}

/* The 2025 form (sources/2025/forms/federal/8814/blank.pdf, lines 4, 5, 13 and 15). */
export const FORM_8814_AMOUNTS_2025: Form8814Amounts = {
  baseAmount: 2700,
  amountNotTaxed: 1350,
  maximumTax: 135,
  rate: 0.1,
  grossIncomeLimit: 13500,
};

/* Lines 7 and 8: "rounded to at least three places"; the engine uses three. */
export const RATIO_PLACES = 3;

/* Lines 1a–3 in whole dollars, blank when the child has none (the Fred example leaves 1a and 1b blank). */
export interface Form8814Inputs {
  line1a?: number;
  line1b?: number;
  line2a?: number;
  line2b?: number;
  line3?: number;
}

/* Lines 6–12, figured only when line 4 is over the base amount. */
export interface Form8814PartI {
  line6: number;
  /* Lines 7–10 are blank when lines 2b and 3 are both zero or blank; each also when its own line is. */
  line7?: number;
  line8?: number;
  line9?: number;
  line10?: number;
  line11: number;
  line12: number;
}

export interface Form8814Lines extends Form8814Inputs {
  line4: number;
  /* Undefined when line 4 is at or under the base amount: "skip lines 5 through 12". */
  partI?: Form8814PartI;
  line14: number;
  line15: number;
  /* Line 15's question: is line 14 less than the amount not taxed? */
  line14LessThanAmountNotTaxed: boolean;
}

/* A document amount as a whole-dollar line: blank unless above zero. */
export function wholeDollarsOrBlank(amount: number | undefined): number | undefined {
  const dollars = roundDollars(amount);
  return dollars !== undefined && dollars > 0 ? dollars : undefined;
}

/*
 * Lines 7 and 8: the line over line 4, rounded to three places before line 9
 * or 10 multiplies it (the blank form's words). The 2025 instructions' Fred
 * example (irs-8814-inst-2025::sec::line-3::b05) prints two places, 0.78 and
 * 0.22, for the same dollars.
 */
function ratio(line: number | undefined, line4: number): number | undefined {
  return line === undefined ? undefined : roundToPlaces(line / line4, RATIO_PLACES);
}

/* Lines 6–12 (blank form; irs-8814-inst-2025::sec::line-2b::b01, ::line-3::b01). */
function partI(inputs: Form8814Inputs, line4: number, amounts: Form8814Amounts): Form8814PartI {
  const line6 = line4 - amounts.baseAmount;
  // "If both lines 2b and 3 are zero or blank, skip lines 7 through 10, enter -0- on line 11."
  if (inputs.line2b === undefined && inputs.line3 === undefined) {
    return { line6, line11: 0, line12: line6 };
  }
  const line7 = ratio(inputs.line2b, line4);
  const line8 = ratio(inputs.line3, line4);
  const line9 = line7 === undefined ? undefined : roundDollars(line6 * line7);
  const line10 = line8 === undefined ? undefined : roundDollars(line6 * line8);
  const line11 = sum(line9, line10);
  // Line 12 subtracts the rounded line 11, so lines 9, 10 and 12 add up to line 6.
  return { line6, line7, line8, line9, line10, line11, line12: line6 - line11 };
}

/* One child's Form 8814, lines 4–15, from lines 1a–3 and the year's amounts. */
export function form8814Lines(
  inputs: Form8814Inputs,
  amounts: Form8814Amounts = FORM_8814_AMOUNTS_2025,
): Form8814Lines {
  const line4 = sum(inputs.line1a, inputs.line2a, inputs.line3);
  const line14 = atLeast(0, line4 - amounts.amountNotTaxed);
  const line14LessThanAmountNotTaxed = line14 < amounts.amountNotTaxed;
  return {
    ...inputs,
    line4,
    partI: line4 > amounts.baseAmount ? partI(inputs, line4, amounts) : undefined,
    line14,
    line15: line14LessThanAmountNotTaxed ? roundDollars(line14 * amounts.rate) : amounts.maximumTax,
    line14LessThanAmountNotTaxed,
  };
}

/* Line 12, or 0 when lines 5–12 are skipped. */
export const line12Of = (lines: Form8814Lines): number => lines.partI?.line12 ?? 0;

/*
 * The part of the child's income that is the parents' investment income
 * (irs-pub-550-2025::sec::net-investment-income::b03–b05): line 12, less line 6
 * times the Alaska Permanent Fund dividends over line 4. Form 4952 line 4a, and
 * Form 8960 line 7 ("line 12, excluding Alaska Permanent Fund Dividends").
 */
export function line12LessAlaskaDividends(
  lines: Form8814Lines,
  alaskaPermanentFundDividends: number | undefined,
): number {
  if (lines.partI === undefined) return 0;
  const alaska = alaskaPermanentFundDividends ?? 0;
  if (alaska <= 0) return lines.partI.line12;
  return lines.partI.line12 - roundDollars((lines.partI.line6 * alaska) / lines.line4);
}

/*
 * Pub. 596 Worksheet 1 line 4 for one Form 8814: line 12, or Worksheet 2 line
 * 10 when the child had an Alaska Permanent Fund dividend
 * (irs-pub-596-2025::sec::passive-activities::b03, ::b04): line 12 less line 12
 * times the dividend over (line 2a − line 2b + line 1a), that ratio rounded to
 * three places.
 */
export function eicWorksheet1Line4(
  lines: Form8814Lines,
  alaskaPermanentFundDividends: number | undefined,
): number {
  const line12 = line12Of(lines);
  const alaska = alaskaPermanentFundDividends ?? 0;
  if (alaska <= 0) return line12;
  const worksheet2Line5 = sum(lines.line2a, -sum(lines.line2b), lines.line1a);
  const worksheet2Line7 = roundToPlaces(alaska / worksheet2Line5, RATIO_PLACES);
  return line12 - roundDollars(worksheet2Line7 * line12);
}
