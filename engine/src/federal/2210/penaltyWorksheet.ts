/*
 * The Worksheet for Form 2210, Part III, Section B—Figure the Penalty
 * (irs-2210-inst-2025::sec::tax-year-2025::b03–b05), as pure arithmetic.
 *
 * "Your payments are applied first to any underpayment balance on an earlier
 * installment even if you designate a payment for a later period"
 * (section-b-figure-the-penalty::b01). Each part of an underpayment owes the
 * rate for the days from its due date to the day a payment paid it, or to
 * April 15, 2026. A payment on or before a due date that no earlier
 * underpayment takes reduces that installment, as Section A's line 15 does,
 * so it never appears on worksheet line 1b (line-1b::b01).
 *
 * DECISION (2026-11-24): two official texts differ on withholding.
 * - "For withheld federal income tax ... you are considered to have paid
 *   one-fourth of these amounts on each payment due date"
 *   (irs-2210-inst-2025::sec::table-1-estimated-tax-payments::b01), and
 *   payments "are applied first to any underpayment balance on an earlier
 *   installment" (section-b-figure-the-penalty::b01).
 * - "Do not enter any withheld federal income tax ... on line 1b"
 *   (irs-2210-inst-2025::sec::line-1b::b01).
 * The engine follows the first: withholding counts as paid on each due date
 * and first pays an earlier underpayment, as Section A line 15 does. Under
 * the second, a person with enough withholding late in the year would owe a
 * penalty to April 15 on tax that was paid.
 */

import { roundDollars, sum } from "../../money.js";
import {
  DAYS_IN_YEAR,
  DUE_DATES_2025,
  PENALTY_END_2025,
  RATE_PERIODS_2025,
  type DayNumber,
} from "./dates.js";

/* A payment on the day it counts (countedDay), in whole dollars or cents. */
export interface DatedPayment {
  day: DayNumber;
  amount: number;
}

/* Worksheet line 1b: one part of a column's underpayment and the day it was paid. */
export interface PaidPart {
  column: number;
  amount: number;
  /* The payment's day, or April 15, 2026 when no payment reached it. */
  paidDay: DayNumber;
}

export interface PenaltyWorksheet {
  /* Line 1a: each column's underpayment (Section A line 17; 0 when none). */
  underpayments: number[];
  parts: PaidPart[];
  /* Line 14 before rounding: lines 4, 7, 10 and 13 of every column. */
  penaltyExact: number;
  /* Line 14 (and Form 2210 line 19 before a waiver): the total, rounded once. */
  penalty: number;
}

interface OpenPart {
  column: number;
  remaining: number;
}

/* Pays the oldest open parts first; returns what is left of the payment. */
function payOldest(open: OpenPart[], payment: DatedPayment, paid: PaidPart[]): number {
  let left = payment.amount;
  while (left > 0 && open.length > 0) {
    const oldest = open[0];
    const applied = Math.min(left, oldest.remaining);
    paid.push({ column: oldest.column, amount: applied, paidDay: payment.day });
    oldest.remaining -= applied;
    left -= applied;
    if (oldest.remaining <= 0) open.shift();
  }
  return left;
}

/* Days of one rate period for a part due on `due` and paid on `paidDay` (lines 3, 6, 9, 12). */
export function daysInRatePeriod(
  due: DayNumber,
  paidDay: DayNumber,
  periodStart: DayNumber,
  periodLast: DayNumber,
): number {
  return Math.max(0, Math.min(paidDay, periodLast) - Math.max(due, periodStart));
}

/* Lines 4, 7, 10 and 13 for one part: amount × days ÷ 365 × the rate of each period. */
export function partPenalty(part: PaidPart): number {
  const due = DUE_DATES_2025[part.column];
  let start = DUE_DATES_2025[0];
  let total = 0;
  for (const period of RATE_PERIODS_2025) {
    const days = daysInRatePeriod(due, part.paidDay, start, period.last);
    total += ((part.amount * days) / DAYS_IN_YEAR) * period.rate;
    start = period.last;
  }
  return total;
}

/*
 * The worksheet from the required installments (line 10) and every payment
 * (estimated tax, the applied 2024 overpayment, withholding on its counted
 * days). Payments after January 15, 2026 pay earlier parts only.
 */
export function penaltyWorksheet(
  installments: readonly number[],
  payments: readonly DatedPayment[],
): PenaltyWorksheet {
  const sorted = [...payments].sort((first, second) => first.day - second.day);
  const open: OpenPart[] = [];
  const parts: PaidPart[] = [];
  const underpayments: number[] = [];
  let credit = 0;
  let next = 0;
  DUE_DATES_2025.forEach((due, column) => {
    for (; next < sorted.length && sorted[next].day <= due; next++) {
      credit += payOldest(open, sorted[next], parts);
    }
    const underpaid = Math.max(0, installments[column] - credit);
    credit = Math.max(0, credit - installments[column]);
    underpayments.push(underpaid);
    if (underpaid > 0) open.push({ column, remaining: underpaid });
  });
  for (; next < sorted.length; next++) payOldest(open, sorted[next], parts);
  for (const part of open) {
    parts.push({ column: part.column, amount: part.remaining, paidDay: PENALTY_END_2025 });
  }
  const penaltyExact = sum(...parts.map(partPenalty));
  return { underpayments, parts, penaltyExact, penalty: roundDollars(penaltyExact) };
}
