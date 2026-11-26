/*
 * Form 2555's arithmetic, Parts IV to IX, in whole dollars. Every input is in
 * U.S. dollars (person.ts converts a foreign amount first). Each amount line
 * keeps the cents of its parts and rounds its own total; a line the form
 * defines as arithmetic on other lines uses their rounded values.
 */

import { atLeast, roundDollars, roundToPlaces, sum, sumOrBlank } from "../../money.js";

/* Line 37 (irs-2555-inst-2025::sec::what-s-new::b01): "the maximum exclusion amount has increased to $130,000". */
export const MAXIMUM_EXCLUSION_2025 = 130_000;
/* Line 32: "Multiply $56.99 by the number of days on line 31. If 365 is entered on line 31, enter $20,800". */
export const BASE_HOUSING_DAILY_2025 = 56.99;
export const BASE_HOUSING_FULL_YEAR_2025 = 20_800;
/*
 * Line 29b, a location Notice 2025-16 does not list: "$39,000 (30% of
 * $130,000) if your qualifying period includes all of 2025 (or $106.85 per
 * day ...)" (irs-2555-inst-2025::sec::line-29b::b01; worksheet line 3, b02).
 */
export const HOUSING_LIMIT_DAILY_2025 = 106.85;
export const HOUSING_LIMIT_FULL_YEAR_2025 = 39_000;
/* "the number of days in your 2025 tax year (usually 365)" (line 39). */
export const DAYS_IN_2025 = 365;

/*
 * DECISION (2026-11-25, by the author): lines 35 and 39 keep exactly three
 * decimal places, and lines 36 and 40 multiply by the printed value. Text A,
 * the form, lines 35 and 39: "Enter the result as a decimal (rounded to at
 * least three places)" (irs-2555-face-2025::sec::face-part-vi::b01,
 * face-part-vii::b01). Text B, Pub. 54: the exclusion is prorated "based on
 * the number of days that you did meet either test"
 * (irs-pub-54-2025::sec::foreign-earned-income-exclusion::b01), which a
 * ratio of more places follows more closely. The form allows both; the
 * engine takes the form's minimum, as rows A1 and A16 do for Forms 6252 and
 * FTB 3805E, so one rule holds for every ratio the engine prints.
 */
export const RATIO_PLACES = 3;
/*
 * Line 44: Pub. 54's examples state the share of the expenses as a percentage
 * with two decimals (98.48%, 13.33%, 52.74%, 96.77%), a ratio of four places,
 * and multiply by it (irs-pub-54-2025::sec::how-to-report-deductions::b04–b06).
 */
export const ALLOCATION_PLACES = 4;

/* A ratio rounded to `places`, never more than 1 (line 35: "don't enter more than 1.000"). */
export function decimalRatio(numerator: number, denominator: number, places: number): number {
  if (denominator <= 0) return 0;
  return Math.min(1, roundToPlaces(numerator / denominator, places));
}

/* Part IV's amounts in dollars, before the whole-dollar rounding of each line. */
export interface PartIVAmounts {
  wages?: number;
  business?: number;
  partnership?: number;
  lodging?: number;
  meals?: number;
  car?: number;
  otherNoncash?: number;
  costOfLiving?: number;
  family?: number;
  education?: number;
  homeLeave?: number;
  quarters?: number;
  otherAllowance?: number;
  otherIncome?: number;
  excludableMealsAndLodging?: number;
}

export interface PartIVLines {
  line19?: number;
  line20a?: number;
  line20b?: number;
  line21a?: number;
  line21b?: number;
  line21c?: number;
  line21d?: number;
  line22a?: number;
  line22b?: number;
  line22c?: number;
  line22d?: number;
  line22e?: number;
  line22f?: number;
  line22g?: number;
  line23?: number;
  line24: number;
  line25?: number;
  line26: number;
}

/* Lines 19 to 26 (irs-2555-face-2025::sec::face-part-iv::b01, b02). */
export function partIVLines(amounts: PartIVAmounts): PartIVLines {
  const whole = (value: number | undefined) => roundDollars(value);
  const line22 = {
    line22a: whole(amounts.costOfLiving),
    line22b: whole(amounts.family),
    line22c: whole(amounts.education),
    line22d: whole(amounts.homeLeave),
    line22e: whole(amounts.quarters),
    line22f: whole(amounts.otherAllowance),
  };
  const line22g = sumOrBlank(...Object.values(line22));
  const upTo21d = {
    line19: whole(amounts.wages),
    line20a: whole(amounts.business),
    line20b: whole(amounts.partnership),
    line21a: whole(amounts.lodging),
    line21b: whole(amounts.meals),
    line21c: whole(amounts.car),
    line21d: whole(amounts.otherNoncash),
  };
  const line23 = whole(amounts.otherIncome);
  // Line 24: "Add lines 19 through 21d, line 22g, and line 23".
  const line24 = sum(...Object.values(upTo21d), line22g, line23);
  const line25 = whole(amounts.excludableMealsAndLodging);
  // Line 26: "Subtract line 25 from line 24 ... This is your 2025 foreign earned income".
  return { ...upTo21d, ...line22, line22g, line23, line24, line25, line26: line24 - sum(line25) };
}

/* Line 29b for a location Notice 2025-16 does not list: $39,000 for a full year, else $106.85 a day. */
export function standardHousingLimit(days: number): number {
  return days === DAYS_IN_2025
    ? HOUSING_LIMIT_FULL_YEAR_2025
    : roundDollars(HOUSING_LIMIT_DAILY_2025 * days);
}

/* Line 32: $56.99 a day; $20,800 for 365 days. */
export function baseHousingAmount(days: number): number {
  return days === DAYS_IN_2025
    ? BASE_HOUSING_FULL_YEAR_2025
    : roundDollars(BASE_HOUSING_DAILY_2025 * days);
}

export interface PartVIInputs {
  line27: number;
  /* Line 28 in dollars, before rounding. */
  expenses: number;
  /* Line 29b. */
  limit: number;
  /* Line 31. */
  days: number;
  /* Line 34 before rounding; undefined when all foreign earned income is self-employment income. */
  employerProvided?: number;
}

export interface PartVILines {
  line28: number;
  line29b: number;
  line30: number;
  line31: number;
  line32: number;
  /* "If the result is zero or less, don't complete the rest of this part or any of Part IX": then -0-. */
  line33: number;
  line34?: number;
  line35?: number;
  line36?: number;
}

/*
 * Lines 28 to 36. Line 34: "If all of your foreign earned income (Part IV) is
 * self-employment income, skip lines 34 and 35 and enter zero on line 36"
 * (irs-2555-inst-2025::sec::line-34::b01). Line 36 is "line 33 by line 35 ...
 * but don't enter more than the amount on line 34".
 */
export function partVILines(inputs: PartVIInputs): PartVILines {
  const line28 = roundDollars(inputs.expenses);
  const line30 = Math.min(line28, inputs.limit);
  const line32 = baseHousingAmount(inputs.days);
  const result = line30 - line32;
  const lines = { line28, line29b: inputs.limit, line30, line31: inputs.days, line32 };
  if (result <= 0) return { ...lines, line33: 0 };
  if (inputs.employerProvided === undefined) return { ...lines, line33: result, line36: 0 };
  const line34 = roundDollars(inputs.employerProvided);
  const line35 = decimalRatio(line34, inputs.line27, RATIO_PLACES);
  const line36 = Math.min(roundDollars(result * line35), line34);
  return { ...lines, line33: result, line34, line35, line36 };
}

export interface PartVIILines {
  line37: number;
  line38: number;
  line39: number;
  line40: number;
  line41: number;
  line42: number;
}

/*
 * Lines 37 to 42. Line 39: "If line 38 and the number of days in your 2025
 * tax year (usually 365) are the same, enter 1.000. Otherwise, divide line 38
 * by the number of days" (irs-2555-face-2025::sec::face-part-vii::b01).
 * Line 42 is "the smaller of line 40 or line 41".
 */
export function partVIILines(line27: number, line36: number | undefined, days: number) {
  const line39 = days === DAYS_IN_2025 ? 1 : decimalRatio(days, DAYS_IN_2025, RATIO_PLACES);
  const line40 = roundDollars(MAXIMUM_EXCLUSION_2025 * line39);
  const line41 = line27 - sum(line36);
  const lines: PartVIILines = {
    line37: MAXIMUM_EXCLUSION_2025,
    line38: days,
    line39,
    line40,
    line41,
    line42: atLeast(0, Math.min(line40, line41)),
  };
  return lines;
}

/*
 * Line 44: the deductions definitely related to the foreign earned income
 * times the share of it excluded. Pub. 54: "multiplying the deduction by a
 * fraction, the numerator of which is your foreign earned income exclusion and
 * the denominator of which is your foreign earned income"
 * (irs-pub-54-2025::sec::how-to-report-deductions::b01). The exclusion is
 * line 43, both exclusions (line-44::b01: "allocable to the excluded income").
 */
export function line44Amount(line43: number, line27: number, relatedDeductions: number): number {
  if (relatedDeductions <= 0) return 0;
  return roundDollars(decimalRatio(line43, line27, ALLOCATION_PLACES) * relatedDeductions);
}

/* Last year's Form 2555 lines 46 and 48, for the Housing Deduction Carryover Worksheet. */
export interface PriorYearHousing {
  line46: number;
  line48: number;
}

/*
 * Line 49: the Housing Deduction Carryover Worksheet
 * (irs-2555-inst-2025::sec::housing-deduction-carryover-worksheet-line-49::b01):
 * line 3 = 2024 line 46 − 2024 line 48 ("If the result is zero, stop; enter
 * -0-"), line 6 = 2025 line 47 − 2025 line 48, line 7 the smaller of 3 and 6.
 */
export function housingCarryover(
  prior: PriorYearHousing | undefined,
  line47: number,
  line48: number,
): number {
  if (prior === undefined) return 0;
  const worksheet3 = roundDollars(prior.line46) - roundDollars(prior.line48);
  if (worksheet3 <= 0) return 0;
  return atLeast(0, Math.min(worksheet3, line47 - line48));
}

export interface PartIXLines {
  line46: number;
  line47: number;
  line48: number;
  line49: number;
  line50: number;
}

/*
 * Part IX: "If line 33 is more than line 36 and line 27 is more than line 43,
 * complete this part" (irs-2555-inst-2025::sec::part-ix-taxpayers-claiming-the::b01).
 * Lines 46 to 50 as the form prints them (face-part-ix::b01).
 */
export function partIXLines(inputs: {
  line27: number;
  line33: number;
  line36: number;
  line43: number;
  prior?: PriorYearHousing;
}): PartIXLines | undefined {
  if (!(inputs.line33 > inputs.line36 && inputs.line27 > inputs.line43)) return undefined;
  const line46 = inputs.line33 - inputs.line36;
  const line47 = inputs.line27 - inputs.line43;
  const line48 = Math.min(line46, line47);
  const line49 = housingCarryover(inputs.prior, line47, line48);
  return { line46, line47, line48, line49, line50: line48 + line49 };
}
