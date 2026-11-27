/*
 * The days of 2025 an owner held a building (lines 4 and 8) and the share of
 * line 15 that line 16 takes, from the ownership answers of the building fact.
 */

import type { LowIncomeHousingOwnership } from "../../facts/index.js";

/* The tax year: a calendar 2025, 365 days. */
export const TAX_YEAR = 2025;
export const DAYS_IN_YEAR = 365;
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

interface CalendarDay {
  year: number;
  month: number;
  day: number;
}

/* "YYYY-MM-DD" as numbers. */
function calendarDay(date: string): CalendarDay {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

/* Day 1 is January 1; the last day of month m is the sum of months 1 to m. */
function daysBeforeMonth(month: number): number {
  return MONTH_DAYS.slice(0, month - 1).reduce((total, days) => total + days, 0);
}

export function dayOfYear(date: string): number {
  const { month, day } = calendarDay(date);
  return daysBeforeMonth(month) + day;
}

const inTaxYear = (date: string | undefined): date is string =>
  date !== undefined && calendarDay(date).year === TAX_YEAR;

/*
 * "The owner who has owned the building for the longest period during the month
 * in which the change in ownership occurs is deemed to have owned the building
 * for that month. If the seller and new owner have owned the building for the
 * same amount of time during the month of disposition, the seller is deemed to
 * have owned the building for that month" (irs-8609a-inst-2025::sec::line-4::b01).
 * The date of a sale is the seller's last day: the seller holds `day` days of
 * the month, the buyer the rest.
 */
function sellerKeepsMonth(date: string): boolean {
  const { month, day } = calendarDay(date);
  return day >= MONTH_DAYS[month - 1] - day;
}

/* A buyer's first day: the first of the month of the sale, or of the next month. */
function firstDayOwned(acquiredOn: string): number {
  const { month } = calendarDay(acquiredOn);
  return sellerKeepsMonth(acquiredOn) ? daysBeforeMonth(month + 1) + 1 : daysBeforeMonth(month) + 1;
}

/* A seller's last day: the last of the month of the sale, or of the month before. */
function lastDayOwned(disposedOn: string): number {
  const { month } = calendarDay(disposedOn);
  return sellerKeepsMonth(disposedOn) ? daysBeforeMonth(month + 1) : daysBeforeMonth(month);
}

/*
 * The days of 2025 the owner held the building, or undefined for the whole year
 * ("If you owned the building ... for the entire year, enter zero on line 4",
 * line-4::b01). An acquisition or a disposition dated outside 2025 changes nothing.
 */
export function daysOwned(ownership: LowIncomeHousingOwnership): number | undefined {
  const acquired = inTaxYear(ownership.acquiredOn) ? ownership.acquiredOn : undefined;
  const disposed = inTaxYear(ownership.disposedOn) ? ownership.disposedOn : undefined;
  if (acquired === undefined && disposed === undefined) return undefined;
  const first = acquired === undefined ? 1 : firstDayOwned(acquired);
  const last = disposed === undefined ? DAYS_IN_YEAR : lastDayOwned(disposed);
  return Math.max(0, last - first + 1);
}

/* The owner disposed of the building, or the entire interest, during 2025. */
export const disposedIn2025 = (ownership: LowIncomeHousingOwnership): boolean =>
  inTaxYear(ownership.disposedOn);

/* An interest change in 2025: the last day at the first share, and the share after. */
export function interestChangeIn2025(ownership: LowIncomeHousingOwnership) {
  const change = ownership.interestChange;
  return change !== undefined && inTaxYear(change.on) ? change : undefined;
}

/*
 * Line 16's share of line 15 for an owner who held one share all year, or whose
 * share changed on `on` (irs-8609a-inst-2025::sec::line-16::b01–b04):
 * - no change: the share ("A would enter 60% of line 15 on line 16");
 * - an increase, or a decrease with the procedures that prevent recapture: each
 *   share for its days ("273/365 of 100% ... plus 92/365 of 40%");
 * - a decrease without them: the share kept at the close of the year ("no credit
 *   is allowed to the taxpayer for that percentage of the interest disposed of").
 * Undefined when a decrease does not say whether the procedures were followed.
 */
export function shareOfCredit(ownership: LowIncomeHousingOwnership): number | undefined {
  const change = interestChangeIn2025(ownership);
  if (change === undefined) return ownership.share;
  const decrease = change.shareAfter < ownership.share;
  if (decrease && change.recaptureAvoided === undefined) return undefined;
  if (decrease && change.recaptureAvoided === false) return change.shareAfter;
  const daysBefore = dayOfYear(change.on);
  const daysAfter = DAYS_IN_YEAR - daysBefore;
  return (daysBefore * ownership.share + daysAfter * change.shareAfter) / DAYS_IN_YEAR;
}
