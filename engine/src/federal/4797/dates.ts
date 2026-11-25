/*
 * Holding periods for Form 4797, from YYYY-MM-DD dates. Plain integer math on
 * the date parts: no rounding of money is involved.
 */

import { INHERITED } from "../../facts/index.js";

interface DateParts {
  year: number;
  month: number;
  day: number;
}

const partsOf = (date: string): DateParts => {
  const [year, month, day] = date.split("-").map(Number);
  return { year: year ?? 0, month: month ?? 0, day: day ?? 0 };
};

const DAYS_TO_ADD = 1;

/* The day after a date, YYYY-MM-DD. */
export function dayAfter(date: string): string {
  const { year, month, day } = partsOf(date);
  return new Date(Date.UTC(year, month - 1, day + DAYS_TO_ADD)).toISOString().slice(0, 10);
}

/*
 * Held more than 1 year: "begin counting on the day after you received the
 * property and include the day you disposed of it"
 * (irs-4797-inst-2025::sec::part-i::b01). So a sale on the first anniversary is
 * 1 year exactly, and the day after it is more. Inherited property counts as
 * held more than 1 year.
 */
export function heldMoreThanOneYear(dateAcquired: string, dateSold: string): boolean {
  if (dateAcquired === INHERITED) return true;
  const acquired = partsOf(dateAcquired);
  const anniversary = `${acquired.year + 1}-${dateAcquired.slice(5)}`;
  return dateSold > anniversary;
}

const MONTHS_PER_YEAR = 12;

/*
 * Full months from the start of a holding period to a date: "if you bought
 * low-income housing on January 1, 2009, the holding period starts on January
 * 2, 2009. If you sold it on January 2, 2025, the holding period is exactly 192
 * full months" (irs-pub-544-2025::sec::applicable-percentage::b04).
 */
export function fullMonthsBetween(start: string, end: string): number {
  const from = partsOf(start);
  const to = partsOf(end);
  const months = (to.year - from.year) * MONTHS_PER_YEAR + (to.month - from.month);
  return to.day < from.day ? months - 1 : months;
}

/* Full months held: the holding period starts the day after the property was acquired. */
export function fullMonthsHeld(dateAcquired: string, end: string): number {
  return fullMonthsBetween(dayAfter(dateAcquired), end);
}

/* Full years from one date to another, and whether part of a year is left over. */
export function yearsBetween(start: string, end: string): { full: number; partYear: boolean } {
  const from = partsOf(start);
  const to = partsOf(end);
  const beforeAnniversary = to.month < from.month || (to.month === from.month && to.day < from.day);
  const full = to.year - from.year - (beforeAnniversary ? 1 : 0);
  return { full, partYear: `${from.year + full}-${start.slice(5)}` !== end };
}

/* "mo., day, yr.": MM/DD/YYYY, or INHERITED as the instructions say to enter it. */
export function printedDate(date: string): string {
  if (date === INHERITED) return INHERITED;
  const { year, month, day } = partsOf(date);
  return `${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}/${year}`;
}
