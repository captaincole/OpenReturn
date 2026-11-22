/*
 * Form 5329 Part I, lines 1–4, for one person, as pure functions of the
 * person's early distributions. The resolver (partI.ts) builds the rows; the
 * bindings print these lines, and Schedule 2 line 8 adds line 4 of each person.
 */

import { atLeast, roundDollars, sum } from "../../money.js";
import type { EarlyDistributionPerson } from "./filingInfo.js";

/* Form line 4: "Enter 10% (0.10) of line 3". */
export const EARLY_DISTRIBUTION_TAX_RATE = 0.1;
/*
 * irs-5329-inst-2025::sec::line-4::b01: a SIMPLE IRA distribution within 2
 * years of first participating takes 25%; such distributions "are designated
 * with code S in box 7".
 */
export const SIMPLE_IRA_EARLY_TAX_RATE = 0.25;
/* irs-5329-inst-2025::sec::line-2::b01: "If more than one exception applies, enter 99." */
export const MORE_THAN_ONE_EXCEPTION = "99";

/* One 1099-R that puts an amount on line 1. */
export interface EarlyDistributionRow {
  /* The part included in income (1040 line 4b or 5b), cents kept. */
  amountInIncome: number;
  /* Box 7 code S: a SIMPLE IRA in its first 2 years (25%). */
  simpleIraFirstTwoYears: boolean;
  /* The exception that covers part of it (Form 5329 line 2), if any. */
  exception?: { number: string; amount: number };
}

/* The part of one row an exception excludes: never more than the row's amount in income. */
export function excludedAmount(row: EarlyDistributionRow): number {
  if (!row.exception) return 0;
  return Math.min(row.amountInIncome, atLeast(0, row.exception.amount));
}

/* Line 1: the cents are kept while adding and only the total is rounded. */
export function line1(rows: readonly EarlyDistributionRow[]): number {
  return roundDollars(sum(...rows.map((row) => row.amountInIncome)));
}

/*
 * Line 2: 0 when no exception applies, as Pub. 590-B's filled-in form prints
 * "-0-" for Tom Jones (irs-pub-590b-2025::sec::omb-no-1545-0074-2::b05).
 */
export function line2(rows: readonly EarlyDistributionRow[]): number {
  return roundDollars(sum(...rows.map(excludedAmount)));
}

/* Line 2's exception number: the one that applies, or 99 for more than one. */
export function line2ExceptionNumber(rows: readonly EarlyDistributionRow[]): string | undefined {
  const numbers = [
    ...new Set(rows.flatMap((row) => (row.exception ? [row.exception.number] : []))),
  ];
  if (numbers.length === 0) return undefined;
  return numbers.length === 1 ? numbers[0] : MORE_THAN_ONE_EXCEPTION;
}

/* Line 3: line 1 less line 2, on the rounded lines. */
export function line3(rows: readonly EarlyDistributionRow[]): number {
  return atLeast(0, line1(rows) - line2(rows));
}

/*
 * Line 4: 10% of line 3, and 25% of the part of line 3 from a code S row (the
 * part of those rows no exception covers, at most line 3).
 */
export function line4(rows: readonly EarlyDistributionRow[]): number {
  const subject = line3(rows);
  const simpleRows = rows.filter((row) => row.simpleIraFirstTwoYears);
  const simple = Math.min(
    subject,
    sum(...simpleRows.map((row) => row.amountInIncome - excludedAmount(row))),
  );
  return roundDollars(
    simple * SIMPLE_IRA_EARLY_TAX_RATE + (subject - simple) * EARLY_DISTRIBUTION_TAX_RATE,
  );
}

/* Schedule 2 line 8's Part I amount: line 4 of each person. Undefined while a person waits. */
export function earlyDistributionTax(
  people: readonly EarlyDistributionPerson[],
): number | undefined {
  if (people.some((person) => person.pending)) return undefined;
  return sum(...people.map((person) => line4(person.rows)));
}
