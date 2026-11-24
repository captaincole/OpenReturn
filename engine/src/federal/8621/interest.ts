/*
 * Interest "using the rates and methods under section 6621" (Form 8621 lines
 * 16f and 24; irs-8621-inst-2025::sec::line-16f::b01, ::line-24::b01). Section
 * 6622 compounds the interest daily; the engine divides the annual rate by the
 * days in the year (365, or 366 in a leap year; QUESTIONS.md). The rates are
 * data/underpaymentRates.ts.
 */

import { underpaymentRateOn } from "../../data/underpaymentRates.js";

const MS_PER_DAY = 86_400_000;

/* An ISO date (YYYY-MM-DD) as midnight UTC; undefined when it does not parse. */
export function utcDate(iso: string): Date | undefined {
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) return undefined;
  const [year, month, day] = parts;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : undefined;
}

/* Whole days from one UTC midnight to another (exact: both are midnights). */
export function daysBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / MS_PER_DAY;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

export function daysInYear(year: number): number {
  return daysBetween(new Date(Date.UTC(year, 0, 1)), new Date(Date.UTC(year + 1, 0, 1)));
}

/*
 * The due date of a calendar-year individual return "without regard to
 * extensions": April 15 of the next year (QUESTIONS.md, question 7: the
 * weekend rule is not applied).
 */
export function returnDueDate(taxYear: number): Date {
  return new Date(Date.UTC(taxYear + 1, 3, 15));
}

const MONTHS_PER_QUARTER = 3;

/* The first day of the quarter after the one that holds `day`. */
function nextQuarterStart(day: Date): Date {
  const month = day.getUTCMonth();
  const quarterStartMonth = month - (month % MONTHS_PER_QUARTER);
  return new Date(Date.UTC(day.getUTCFullYear(), quarterStartMonth + MONTHS_PER_QUARTER, 1));
}

/*
 * Interest on an amount from one day to another: each day after `from`, up to
 * and including `to`, grows the balance by the day's rate over the days in its
 * year. A quarter has one rate and lies in one year, so its days compound as
 * one power. Undefined when a day is past the rate table. Cents kept.
 */
export function compoundedInterest(principal: number, from: Date, to: Date): number | undefined {
  let factor = 1;
  let day = addDays(from, 1);
  while (day.getTime() <= to.getTime()) {
    const rate = underpaymentRateOn(day);
    if (rate === undefined) return undefined;
    const next = nextQuarterStart(day);
    const end = next.getTime() <= to.getTime() ? next : addDays(to, 1);
    factor *= (1 + rate / daysInYear(day.getUTCFullYear())) ** daysBetween(day, end);
    day = end;
  }
  return principal * (factor - 1);
}
