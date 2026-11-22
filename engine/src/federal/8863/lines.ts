import type { EducationAcademicPeriod } from "../../facts/index.js";
import { atLeast, roundDollars, roundToPlaces, sum } from "../../money.js";

/*
 * 2025 amounts, printed on the blank form and in Table 1
 * (irs-8863-inst-2025::sec::future-developments::b01,
 * comparison-of-education-credits-for-2025::b01).
 */
/* Lines 2 and 13: the MAGI limit. */
export const MAGI_LIMIT_JOINT = 180_000;
export const MAGI_LIMIT_OTHER = 90_000;
/* Lines 5 and 16: the phase-out range ($160,000–$180,000; $80,000–$90,000). */
export const PHASEOUT_RANGE_JOINT = 20_000;
export const PHASEOUT_RANGE_OTHER = 10_000;
/* Lines 6 and 17: "rounded to at least three places"; the engine uses three. */
export const RATIO_PLACES = 3;
/* Line 27: "Don't enter more than $4,000" (irs-8863-inst-2025::sec::use-the-adjusted-qualified-education-expenses::b01). */
export const AOC_EXPENSE_LIMIT = 4_000;
/* Lines 28 and 30: 100% of the first $2,000, then 25% of the next $2,000 (american-opportunity-credit::b01). */
export const AOC_FIRST_TIER = 2_000;
export const AOC_SECOND_TIER_RATE = 0.25;
/* Line 8: 40% of the American opportunity credit is refundable. */
export const REFUNDABLE_RATE = 0.4;
/* Line 11: at most $10,000 of expenses per return (lifetime-learning-credit::b01). */
export const LLC_EXPENSE_LIMIT = 10_000;
/* Line 12: 20%. */
export const LLC_RATE = 0.2;

/* Which credit a student's Part III figures: lines 27–30, or line 31. */
export type StudentCredit = "american_opportunity" | "lifetime_learning";

/*
 * The Adjusted Qualified Education Expenses Worksheet, one per academic period
 * (irs-8863-inst-2025::sec::adjusted-qualified-education-expenses::b01): line 1
 * less lines 2a, 2b and 2c, -0- when zero or less. Course materials bought
 * elsewhere count for the American opportunity credit only
 * (qualified-education-expenses::b01). The periods' cents add, and the total
 * rounds once: it is the amount the student's line 27 or 31 takes.
 */
export function adjustedExpenses(
  periods: ReadonlyArray<EducationAcademicPeriod>,
  credit: StudentCredit,
): number {
  const perPeriod = periods.map((period) => {
    const materials = credit === "american_opportunity" ? period.courseMaterialsPaid : 0;
    const line1 = sum(period.tuitionAndFeesPaid, materials);
    const line3 = sum(period.taxFreeAssistance, period.taxFreeAssistanceAfter2025, period.refunds);
    return atLeast(0, line1 - line3);
  });
  return roundDollars(sum(...perPeriod));
}

export interface AmericanOpportunityLines {
  line27: number;
  line28: number;
  line29: number;
  line30: number;
}

/* Lines 27–30 of one student's Part III (the blank form, page 2). */
export function americanOpportunityLines(adjusted: number): AmericanOpportunityLines {
  const line27 = Math.min(adjusted, AOC_EXPENSE_LIMIT);
  const line28 = atLeast(0, line27 - AOC_FIRST_TIER);
  const line29 = roundDollars(line28 * AOC_SECOND_TIER_RATE);
  const line30 = line28 === 0 ? line27 : AOC_FIRST_TIER + line29;
  return { line27, line28, line29, line30 };
}

export const magiLimit = (joint: boolean): number => (joint ? MAGI_LIMIT_JOINT : MAGI_LIMIT_OTHER);
export const phaseOutRange = (joint: boolean): number =>
  joint ? PHASEOUT_RANGE_JOINT : PHASEOUT_RANGE_OTHER;

/* Lines 6 and 17: 1.000 when the room under the limit is the whole range, else the ratio to three places. */
export function phaseOutDecimal(room: number, range: number): number {
  return room >= range ? 1 : roundToPlaces(room / range, RATIO_PLACES);
}

/* Lines 2 through 6, or 13 through 17: the MAGI limit and the decimal. */
export interface PhaseOutLines {
  limit: number;
  magi: number;
  /* Line 4 or 15, -0- when zero or less. */
  room: number;
  /* False when line 4 or 15 is zero or less: stop (line 4), or -0- on line 18 (line 15). */
  credit: boolean;
  range?: number;
  decimal?: number;
}

export function phaseOutLines(magi: number, joint: boolean): PhaseOutLines {
  const limit = magiLimit(joint);
  const difference = limit - magi;
  if (difference <= 0) return { limit, magi, room: 0, credit: false };
  const range = phaseOutRange(joint);
  return {
    limit,
    magi,
    room: difference,
    credit: true,
    range,
    decimal: phaseOutDecimal(difference, range),
  };
}

export interface PartILines extends PhaseOutLines {
  line1: number;
  /* Lines 7–9; undefined when line 4 stops the part. */
  line7?: number;
  /* Undefined when the line 7 box is checked or line 4 stops the part. */
  line8?: number;
  line9?: number;
  /* The line 7 box: the filer cannot take the refundable part. */
  line7Box: boolean;
}

/*
 * Part I (the blank form, lines 1–9): line 7 is line 1 times line 6, line 8 is
 * 40% of line 7, line 9 is line 7 less line 8. With the line 7 box checked,
 * line 8 is skipped and line 9 is line 7 (irs-8863-inst-2025::sec::line-7::b03).
 * While the line 7 answers wait (refundable undefined), lines 7–9 stay blank.
 */
export function partILines(
  line1: number,
  magi: number,
  joint: boolean,
  refundable: boolean | undefined,
): PartILines {
  const phase = phaseOutLines(magi, joint);
  const base = { ...phase, line1, line7Box: false };
  if (!phase.credit || phase.decimal === undefined || refundable === undefined) return base;
  const line7 = roundDollars(line1 * phase.decimal);
  if (!refundable) return { ...base, line7, line9: line7, line7Box: true };
  const line8 = roundDollars(line7 * REFUNDABLE_RATE);
  return { ...base, line7, line8, line9: line7 - line8 };
}

export interface PartIILines {
  line10: number;
  /* Lines 11–17; undefined when line 10 is zero ("skip lines 11 through 17"). */
  line11?: number;
  line12?: number;
  phase?: PhaseOutLines;
  line18: number;
}

/*
 * Part II through line 18 (the blank form): line 11 is the smaller of line 10
 * and $10,000, line 12 is 20% of it, line 18 is line 12 times line 17. Line 10
 * zero, or line 15 zero or less, puts -0- on line 18.
 */
export function partIILines(line10: number, magi: number, joint: boolean): PartIILines {
  if (line10 === 0) return { line10, line18: 0 };
  const line11 = Math.min(line10, LLC_EXPENSE_LIMIT);
  const line12 = roundDollars(line11 * LLC_RATE);
  const phase = phaseOutLines(magi, joint);
  const line18 =
    phase.credit && phase.decimal !== undefined ? roundDollars(line12 * phase.decimal) : 0;
  return { line10, line11, line12, phase, line18 };
}

export interface CreditLimitLines {
  line1: number;
  line2: number;
  line3: number;
  line4: number;
  line5: number;
  line6: number;
  line7: number;
}

/*
 * The Credit Limit Worksheet (irs-8863-inst-2025::sec::credit-limit-worksheet::b01):
 * line 1 is Form 8863 line 18, line 2 line 9, line 4 Form 1040 line 18, line 5
 * Schedule 3 lines 1, 2, 6d and 6l. Line 7, the smaller of lines 3 and 6, goes
 * on Form 8863 line 19. Line 6 is -0- when line 5 is more than line 4: a credit
 * is never negative (QUESTIONS.md).
 */
export function creditLimitLines(
  line18: number,
  line9: number,
  form1040Line18: number,
  scheduleThreeCredits: ReadonlyArray<unknown>,
): CreditLimitLines {
  const line3 = line18 + line9;
  const line5 = sum(...scheduleThreeCredits);
  const line6 = atLeast(0, form1040Line18 - line5);
  return {
    line1: line18,
    line2: line9,
    line3,
    line4: form1040Line18,
    line5,
    line6,
    line7: Math.min(line3, line6),
  };
}

/* Lines 6 and 17 as the form prints them: the digit before the point and three after. */
export function decimalText(decimal: number): { whole: string; fraction: string } {
  const thousandths = roundToPlaces(decimal * 10 ** RATIO_PLACES, 0);
  const scale = 10 ** RATIO_PLACES;
  const fraction = thousandths % scale;
  return {
    whole: String((thousandths - fraction) / scale),
    fraction: String(fraction).padStart(RATIO_PLACES, "0"),
  };
}
