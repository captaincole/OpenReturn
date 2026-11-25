/*
 * Form 8911 and Schedule A (Form 8911), Rev. December 2025: pure arithmetic
 * with the amounts as named constants. Each Schedule A is one single item of
 * refueling property; Form 8911 adds them and limits the personal part to the
 * tax.
 */

import { atLeast, roundDollars, sumOrBlank } from "../../money.js";

/* Schedule A line 13: "If construction began before January 29, 2023 ... answer 'Yes'". */
export const PWA_NOT_NEEDED_BEFORE = "2023-01-29";
/* "You can't claim the credit for ... property placed in service after June 30, 2026" (what-s-new::b01). */
export const LAST_PLACED_IN_SERVICE_DATE = "2026-06-30";

/* Schedule A line 14: 6%, or 30% with the PWA requirements (amount-of-credit::b01). */
export const BUSINESS_RATE = 0.06;
export const BUSINESS_RATE_WITH_PWA = 0.3;
/* Schedule A line 15: the limit for each single item of business/investment use property. */
export const BUSINESS_LIMIT_PER_ITEM = 100_000;
/* Schedule A lines 19 and 20: 30%, limited to $1,000 for each single item at the main home. */
export const PERSONAL_RATE = 0.3;
export const PERSONAL_LIMIT_PER_ITEM = 1_000;

/* Schedule A line 9: 100% stops after line 16. */
export const FULL_BUSINESS_USE = 100;
const MONTHS_IN_YEAR = 12;

export interface ScheduleAInputs {
  /* Line 8. */
  cost: number;
  /* Line 9 before a change of use: 0 to 100. */
  businessUsePercent: number;
  /* Line 9: the months of business use when the use changed; absent for the whole year. */
  businessUseMonths?: number;
  /* Line 11. Absent: none. */
  section179Deduction?: number;
  /* Line 13: the answer, "Yes" when construction began before January 29, 2023. */
  line13: boolean;
  /* Line 17: installed on the main home. */
  line17: boolean;
}

export interface ScheduleALines {
  line8: number;
  line9: number;
  line10: number;
  /* Lines 11–16: blank when line 10 is zero ("skip lines 11 through 16"). */
  line11?: number;
  line12?: number;
  line14?: number;
  line16?: number;
  /* Lines 18–21: blank at 100% business use, or when line 17 is "No" ("Stop here"). */
  line18?: number;
  line19?: number;
  line21?: number;
}

/*
 * Line 9 (irs-8911-inst-2025::sec::line-9::b01): the percentage; for a change
 * of use, "Multiply that percentage by the number of months you use the
 * property in your business ... and divide the result by 12".
 */
export function businessUsePercentage(percent: number, months?: number): number {
  return months === undefined ? percent : (percent * months) / MONTHS_IN_YEAR;
}

/* Lines 10–16: the business/investment use part of one item. */
function partII(line8: number, line9: number, inputs: ScheduleAInputs) {
  // Line 10: "Multiply line 8 by line 9. If the result is zero, enter -0-, skip lines 11 through 16".
  const line10 = roundDollars((line8 * line9) / 100);
  if (line10 === 0) return { line10 };
  // Line 11 (line-11::b01) and line 12; cost "must first be reduced by any section 179 expense deduction" (amount-of-credit::b01).
  const line11 = roundDollars(inputs.section179Deduction ?? 0);
  const line12 = atLeast(0, line10 - line11);
  // Line 14: 6% (30% if line 13 is "Yes"); line 15 $100,000; line 16 the smaller.
  const rate = inputs.line13 ? BUSINESS_RATE_WITH_PWA : BUSINESS_RATE;
  const line14 = roundDollars(line12 * rate);
  return { line10, line11, line12, line14, line16: Math.min(line14, BUSINESS_LIMIT_PER_ITEM) };
}

/* Lines 17–21: the personal use part, at the main home only. */
function partIII(line8: number, line10: number, line17: boolean) {
  if (!line17) return {};
  const line18 = line8 - line10;
  const line19 = roundDollars(line18 * PERSONAL_RATE);
  return { line18, line19, line21: Math.min(line19, PERSONAL_LIMIT_PER_ITEM) };
}

/* One Schedule A (Form 8911), lines 8–21 (blank form). */
export function scheduleALines(inputs: ScheduleAInputs): ScheduleALines {
  const line8 = roundDollars(inputs.cost);
  const line9 = businessUsePercentage(inputs.businessUsePercent, inputs.businessUseMonths);
  const business = partII(line8, line9, inputs);
  // Line 16: "If you entered 100% on line 9 above, stop here."
  const personal = line9 >= FULL_BUSINESS_USE ? {} : partIII(line8, business.line10, inputs.line17);
  return { line8, line9, ...business, ...personal };
}

/*
 * Line 13: "If construction began before January 29, 2023 (see line 4), skip
 * the instructions and answer 'Yes'". Dates are YYYY-MM-DD, so they compare as text.
 */
export function constructionBeforePwaRules(constructionBeganDate: string | undefined): boolean {
  return constructionBeganDate !== undefined && constructionBeganDate < PWA_NOT_NEEDED_BEFORE;
}

/* Form 8911 lines 1 and 4: the totals of Schedule A lines 16 and 21; blank with none. */
export function scheduleATotal(amounts: ReadonlyArray<number | undefined>): number | undefined {
  return sumOrBlank(...amounts);
}

/* Form 8911 Part I: line 2 the K-1 credits, line 3 "Add lines 1 and 2". */
export function partITotals(line1: number | undefined, k1Credit: number | undefined) {
  const line2 = k1Credit === undefined || k1Credit === 0 ? undefined : roundDollars(k1Credit);
  return { line1, line2, line3: sumOrBlank(line1, line2) };
}

export interface NetRegularTax {
  line5: number;
  line6a?: number;
  line6b?: number;
  line6c: number;
  /* Line 7: "If zero or less, enter -0- and stop here". */
  line7: number;
}

/* Lines 5–7 (blank form): regular tax before credits, less the credits that come first. */
export function netRegularTax(
  line5: number,
  line6a: number | undefined,
  line6b: number | undefined,
): NetRegularTax {
  const line6c = sumOrBlank(line6a, line6b) ?? 0;
  return { line5, line6a, line6b, line6c, line7: atLeast(0, line5 - line6c) };
}

/*
 * Lines 9 and 10 (blank form): line 7 less the tentative minimum tax; "If zero
 * or less, enter -0- and stop here", so line 10 stays blank. Line 10 is the
 * smaller of line 4 and line 9; the part that does not fit is lost
 * (irs-8911-inst-2025::sec::line-10::b01).
 */
export function personalCreditLines(line4: number, line7: number, line8: number) {
  const line9 = atLeast(0, line7 - line8);
  return { line9, line10: line9 === 0 ? undefined : Math.min(line4, line9) };
}
