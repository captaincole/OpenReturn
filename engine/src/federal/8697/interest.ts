/*
 * Look-back interest on one prior year's increase or decrease in tax (Part I
 * lines 7 and 8, Part II lines 8 and 9). "Compounded on a daily basis,
 * generally from the due date (not including extensions) of the return for the
 * prior year until the earlier of" the due date of the filing year's return or
 * the date it is filed and its tax fully paid (irs-8697-inst-2025::sec::lines-7-and-8::b01,
 * ::lines-8-and-9::b01). The rate is fixed for each accrual period, which
 * "starts on the day after the return due date ... for each prior tax year and
 * ends on the return due date for the following tax year"
 * (::applicable-interest-rates::b01). Each day grows the balance by the rate
 * over the days in its calendar year (365, or 366), as Form 8621 does
 * (federal/8621/interest.ts). Cents kept.
 */

import { addDays, daysBetween, daysInYear, returnDueDate, utcDate } from "../8621/interest.js";
import { lookBackRateOn } from "./rates.js";

export interface AccrualPeriod {
  firstDay: Date;
  lastDay: Date;
  rate: number;
}

/* The date the interest stops: the 2025 return's due date, or an earlier date it was filed and paid. */
export function interestEndDate(filingYear: number, filedAndPaidOn: string | undefined): Date {
  const due = returnDueDate(filingYear);
  const filed = filedAndPaidOn === undefined ? undefined : utcDate(filedAndPaidOn);
  return filed !== undefined && filed.getTime() < due.getTime() ? filed : due;
}

/* The accrual periods from the prior year's due date to `end`; undefined when a period has no rate. */
export function accrualPeriods(priorYear: number, end: Date): AccrualPeriod[] | undefined {
  const periods: AccrualPeriod[] = [];
  let year = priorYear;
  let due = returnDueDate(year);
  while (due.getTime() < end.getTime()) {
    const firstDay = addDays(due, 1);
    const nextDue = returnDueDate(year + 1);
    const rate = lookBackRateOn(firstDay);
    if (rate === undefined) return undefined;
    periods.push({ firstDay, lastDay: nextDue.getTime() < end.getTime() ? nextDue : end, rate });
    year += 1;
    due = nextDue;
  }
  return periods;
}

/* The growth of one period's days, first and last day included, year by year. */
function periodGrowth(period: AccrualPeriod): number {
  let factor = 1;
  let day = period.firstDay;
  const stop = addDays(period.lastDay, 1);
  while (day.getTime() < stop.getTime()) {
    const year = day.getUTCFullYear();
    const nextYear = new Date(Date.UTC(year + 1, 0, 1));
    const until = nextYear.getTime() < stop.getTime() ? nextYear : stop;
    factor *= (1 + period.rate / daysInYear(year)) ** daysBetween(day, until);
    day = until;
  }
  return factor;
}

/* The interest on `amount` (dollars, a positive change in tax), cents kept; undefined past the rate table. */
export function lookBackInterest(amount: number, priorYear: number, end: Date): number | undefined {
  const periods = accrualPeriods(priorYear, end);
  if (periods === undefined) return undefined;
  const factor = periods.reduce((product, period) => product * periodGrowth(period), 1);
  return amount * (factor - 1);
}
