/*
 * The 2025 deduction for NOLs carried from earlier years (Schedule 1 line 8a,
 * Form 172 Part I line 23), as a pure function of amounts.
 */

import type { NolCarryoverRow } from "../../facts/index.js";
import { atLeast, roundDollars, sum } from "../../money.js";

/*
 * "your NOL deduction for tax years beginning after December 31, 2020, cannot
 * exceed the sum of: 1. The NOLs carried to the year from tax years beginning
 * before January 1, 2018; plus 2. The lesser of: a. The NOLs carried to the
 * year from tax years beginning after December 31, 2017, or b. 80% of the
 * excess (if any) of taxable income computed without regard to deductions for
 * NOLs, or Qualified Business Income (QBI), or section 250 deductions, over the
 * NOLs carried to the year from tax years beginning before January 1, 2018"
 * (irs-172-inst-2025::sec::how-to-carry-an-nol-back-or-forward::b01, ::b02).
 */
export const FIRST_LIMITED_LOSS_YEAR = 2018;
export const TAXABLE_INCOME_LIMIT_RATE = 0.8;
/* A carryover reaches 2025 from an earlier year only. */
export const LAST_CARRYOVER_YEAR = 2024;

export const LATER_YEAR_ROW_GAP =
  "An NOL carryover row names a year of loss after 2024; only a loss of an earlier year is carried to 2025.";

export interface CarryoverTotals {
  /* NOLs from tax years beginning before 2018: deducted in full. */
  before2018: number;
  /* NOLs from 2018 on: limited to 80% of taxable income. */
  from2018: number;
}

/* The rows split by the 2018 line, each whole dollars; a gap reason when a row is not a prior year. */
export function carryoverTotals(rows: ReadonlyArray<NolCarryoverRow>): CarryoverTotals | string {
  if (rows.some((row) => row.yearOfLoss > LAST_CARRYOVER_YEAR)) return LATER_YEAR_ROW_GAP;
  const totalOf = (limited: boolean) =>
    sum(
      ...rows
        .filter((row) => row.yearOfLoss >= FIRST_LIMITED_LOSS_YEAR === limited)
        .map((row) => roundDollars(row.carryoverTo2025)),
    );
  return { before2018: totalOf(false), from2018: totalOf(true) };
}

/*
 * The deduction: the losses before 2018 in full, plus the losses from 2018 up
 * to 80% of what taxable income before the NOL and QBI deductions leaves after
 * them. taxableIncome is needed only with a loss from 2018 on.
 */
export function nolDeduction(totals: CarryoverTotals, taxableIncome: number): number {
  const room = atLeast(0, taxableIncome - totals.before2018);
  const limited = Math.min(totals.from2018, roundDollars(TAXABLE_INCOME_LIMIT_RATE * room));
  return totals.before2018 + limited;
}
