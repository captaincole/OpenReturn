/*
 * Form 8615 arithmetic: pure functions on whole-dollar amounts. The tax on an
 * amount is figured in tax.ts; the return's lines are read in form.ts.
 */

import { atLeast, roundDollars, roundToPlaces } from "../../money.js";

/*
 * Line 2 and Who Must File condition 1: $2,700
 * (irs-8615-inst-2025::sec::line-2::b01, ::who-must-file::b01).
 */
export const BASE_AMOUNT = 2_700;

/* Line 2 for a child who itemizes: $1,350 plus the directly connected deductions (::line-2::b01). */
export const ITEMIZED_BASE = 1_350;

/* "Rounded to at least three places": lines 12b and the Line 5 Worksheet ratios use three. */
export const RATIO_PLACES = 3;

/*
 * Line 12b is less than 1 (line 7 is above 0), and the form prints no whole
 * part. When three places would round it up to 1.000, the engine keeps more
 * places, up to this many (QUESTIONS.md).
 */
const MOST_LINE_12B_PLACES = 6;

/* A ratio the form enters as a decimal, at most 1.000 where the worksheet says so. */
const ratio = (part: number, whole: number) => roundToPlaces(part / whole, RATIO_PLACES);
const ratioAtMostOne = (part: number, whole: number) => Math.min(1, ratio(part, whole));

/* A worksheet amount "but don't enter less than zero or more than" the limit. */
const between = (value: number, limit: number) => Math.min(atLeast(0, value), atLeast(0, limit));

export interface Line1Inputs {
  /* Form 1040 line 9. */
  totalIncome: number;
  /* Form 1040 line 11b. */
  adjustedGrossIncome: number;
  /* Wages (line 1z) and business income (Schedule 1 lines 3 and 6, a loss as 0). */
  earnedIncome: number;
  /* Schedule 1 line 18: the penalty on early withdrawal of savings. */
  earlyWithdrawalPenalty: number;
  /*
   * The Alternate Worksheet's line B: each net loss from self-employment and any
   * net operating loss deduction, as a positive number. 0 when none.
   */
  alternateWorksheetLosses: number;
}

/*
 * Line 1 (irs-8615-inst-2025::sec::line-1::b01): AGI with no earned income;
 * otherwise the Child's Unearned Income Worksheet (line 9 less earned income and
 * the penalty, ::child-s-unearned-income-worksheet-line-1::b01), or the
 * Alternate Worksheet when the child has a self-employment loss or a net
 * operating loss deduction (line 9 plus those losses, less the same amounts,
 * ::alternate-worksheet-for-form-8615-line-1::b01).
 */
export function line1(inputs: Line1Inputs): number {
  const lineD = inputs.earnedIncome + inputs.earlyWithdrawalPenalty;
  if (inputs.alternateWorksheetLosses > 0) {
    return inputs.totalIncome + inputs.alternateWorksheetLosses - lineD;
  }
  if (inputs.earnedIncome === 0) return inputs.adjustedGrossIncome;
  return inputs.totalIncome - lineD;
}

/*
 * Line 2: $2,700, or for a child who itemizes the larger of $1,350 plus the
 * deductions directly connected with the unearned income, and $2,700 (::line-2::b01).
 */
export function line2(itemizes: boolean, directlyConnected: number): number {
  if (!itemizes) return BASE_AMOUNT;
  return Math.max(ITEMIZED_BASE + directlyConnected, BASE_AMOUNT);
}

/* The qualified dividends and net capital gain a worksheet finds in an amount. */
export interface PreferentialParts {
  qualifiedDividends: number;
  netCapitalGain: number;
}

export const NO_PREFERENTIAL_PARTS: PreferentialParts = {
  qualifiedDividends: 0,
  netCapitalGain: 0,
};

/* What every Line 5 Worksheet reads from the child's return and Form 8615. */
export interface Line5WorksheetInputs extends PreferentialParts {
  form8615Line1: number;
  form8615Line2: number;
  form8615Line3: number;
  form8615Line5: number;
  itemizes: boolean;
  /* Worksheets #2 and #3 line 5: itemized deductions directly connected with the dividends and gain. */
  itemizedForDividendsAndGains: number;
  /* Worksheet #3 line 11: Schedule A line 17 for a child who itemizes, else the standard deduction. */
  deductions: number;
  /* Worksheet #3 line 13: Form 1040 line 11b. */
  adjustedGrossIncome: number;
}

/*
 * Line 5 Worksheet #1 (irs-8615-inst-2025::sec::line-8::b04, ::b05): line 2 is
 * $2,700 and lines 3 and 5 are the same. Lines 6 and 7 are calculated lines,
 * rounded to the dollar (Pub. 929 (2012): $1,900 × .375 = $713). The base
 * amount is the year's line 2 amount; only a prior-year example passes another.
 */
export function line5Worksheet1(
  inputs: Line5WorksheetInputs,
  baseAmount: number = BASE_AMOUNT,
): PreferentialParts {
  const line4 = ratioAtMostOne(inputs.qualifiedDividends, inputs.form8615Line1);
  const line5 = ratioAtMostOne(inputs.netCapitalGain, inputs.form8615Line1);
  const line6 = roundDollars(baseAmount * line4);
  const line7 = roundDollars(baseAmount * line5);
  const line8 = between(inputs.qualifiedDividends - line6, inputs.form8615Line5);
  const line9 = between(inputs.netCapitalGain - line7, inputs.form8615Line5 - line8);
  return { qualifiedDividends: line8, netCapitalGain: line9 };
}

/* Lines 1 through 9 of Worksheets #2 and #3: the itemized deductions taken off each part. */
function afterDirectDeductions(inputs: Line5WorksheetInputs, line5: number) {
  const line3 = inputs.qualifiedDividends + inputs.netCapitalGain;
  const line4 = ratio(inputs.qualifiedDividends, line3);
  const line6 = roundDollars(line4 * line5);
  const line7 = line5 - line6;
  return {
    line3,
    line4,
    line8: inputs.netCapitalGain - line7,
    line9: inputs.qualifiedDividends - line6,
  };
}

/*
 * Line 5 Worksheet #2 (::line-8::b05, ::b06, ::b07): line 2 is more than $2,700
 * and lines 3 and 5 are the same.
 */
export function line5Worksheet2(inputs: Line5WorksheetInputs): PreferentialParts {
  const { line8, line9 } = afterDirectDeductions(inputs, inputs.itemizedForDividendsAndGains);
  const line11 = ratioAtMostOne(inputs.qualifiedDividends, inputs.form8615Line1);
  const line12 = Math.min(ratio(inputs.netCapitalGain, inputs.form8615Line1), 1 - line11);
  const line13 = roundDollars(ITEMIZED_BASE * line11);
  const line14 = roundDollars(ITEMIZED_BASE * line12);
  const line15 = between(line9 - line13, inputs.form8615Line5);
  const line16 = between(line8 - line14, inputs.form8615Line5 - line15);
  return { qualifiedDividends: line15, netCapitalGain: line16 };
}

/* Line 5 Worksheet #3 (::line-8::b08, ::b09, ::b10): line 5 is less than line 3. */
export function line5Worksheet3(inputs: Line5WorksheetInputs): PreferentialParts {
  const directly = inputs.itemizes ? inputs.itemizedForDividendsAndGains : 0;
  const { line3, line4, line8, line9 } = afterDirectDeductions(inputs, directly);
  const line10 = 0;
  const line11 = inputs.itemizes ? inputs.deductions - directly : inputs.deductions;
  const line12 = line10 + line11;
  const line14 = ratioAtMostOne(line3, inputs.adjustedGrossIncome);
  const line15 = roundDollars(line12 * line14);
  const line16 = roundDollars(line15 * line4);
  const line17 = line15 - line16;
  const line18 = between(line9 - line16, inputs.form8615Line5);
  const line19 = between(line8 - line17, inputs.form8615Line5 - line18);
  return { qualifiedDividends: line18, netCapitalGain: line19 };
}

/*
 * The qualified dividends and net capital gain on line 5 (::line-8::b02): zero
 * when the child has neither, else the Line 5 Worksheet the lines pick.
 */
export function line5Parts(inputs: Line5WorksheetInputs): PreferentialParts {
  if (inputs.qualifiedDividends + inputs.netCapitalGain <= 0) return NO_PREFERENTIAL_PARTS;
  if (inputs.form8615Line5 < inputs.form8615Line3) return line5Worksheet3(inputs);
  if (inputs.form8615Line2 > BASE_AMOUNT) return line5Worksheet2(inputs);
  return line5Worksheet1(inputs);
}

/*
 * Line 14's parts (irs-8615-inst-2025::sec::line-14::b01): the child's amounts
 * less the parts on line 5.
 */
export function line14Parts(
  child: PreferentialParts,
  onLine5: PreferentialParts,
): PreferentialParts {
  return {
    qualifiedDividends: child.qualifiedDividends - onLine5.qualifiedDividends,
    netCapitalGain: child.netCapitalGain - onLine5.netCapitalGain,
  };
}

/* Line 8's parts (::line-8::b01, ::b02): the parts on lines 5, 6 and 7 added. */
export function addParts(...parts: PreferentialParts[]): PreferentialParts {
  return {
    qualifiedDividends: parts.reduce((total, each) => total + each.qualifiedDividends, 0),
    netCapitalGain: parts.reduce((total, each) => total + each.netCapitalGain, 0),
  };
}

/* Line 6: the parent's taxable income; zero or less enters -0- (::line-6::b01). */
export function line6(parentTaxableIncome: number): number {
  return atLeast(0, parentTaxableIncome);
}

export interface Lines12And13 {
  /* Blank when line 7 is blank. */
  line12a?: number;
  line12b?: number;
  line13: number;
}

/*
 * Lines 12a, 12b and 13 (::line-11::b01, ::lines-12a-and-12b::b01, ::line-13::b01):
 * with line 7 blank, line 13 is line 11. Otherwise line 12b is line 5 over line
 * 12a, rounded to three places, and line 13 is line 11 times line 12b, to the dollar.
 */
export function lines12And13(
  line5: number,
  line7: number | undefined,
  line11: number,
): Lines12And13 {
  if (line7 === undefined) return { line13: line11 };
  const line12a = line5 + line7;
  const line12b = line12bRatio(line5 / line12a);
  return { line12a, line12b, line13: roundDollars(line11 * line12b) };
}

/* The fewest places from three on that keep line 12b under 1. */
function line12bPlaces(exact: number): number {
  for (let places = RATIO_PLACES; places < MOST_LINE_12B_PLACES; places += 1) {
    if (roundToPlaces(exact, places) < 1) return places;
  }
  return MOST_LINE_12B_PLACES;
}

/* Line 12b: line 5 over line 12a, rounded to three places, or more when three would give 1.000. */
export function line12bRatio(exact: number): number {
  return roundToPlaces(exact, line12bPlaces(exact));
}

/* Line 12b prints after the form's "× .": the digits of the decimal, three or more. */
export function line12bDigits(line12b: number): string {
  const places = line12bPlaces(line12b);
  const digits = roundToPlaces(line12b * 10 ** places, 0);
  return String(digits % 10 ** places).padStart(places, "0");
}
