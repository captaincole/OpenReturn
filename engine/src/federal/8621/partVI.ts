/*
 * Form 8621 Part VI: each outstanding section 1294 election in its own column
 * (irs-8621-inst-2025::sec::part-vi::b01), at most six on the form.
 */

import type { PficPrior1294Election } from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import { compoundedInterest, returnDueDate } from "./interest.js";
import { TAX_YEAR } from "./line15.js";

export const PART_VI_COLUMNS = 6;

export interface PartVIColumn {
  /* Line 17: the last day of the election's tax year, MM/DD/YYYY (::line-17::b01). */
  line17: string;
  line18: number;
  line19: number;
  /* Lines 21–24 only when an event of 2025 ends the election in whole or in part. */
  line21?: string;
  line22?: number;
  line23?: number;
  line24?: number;
  /* Line 25 only on a partial termination (::lines-25-and-26::b01). */
  line25?: number;
}

/*
 * Line 23 (::line-23::b01): all of line 19 when the election ends in full;
 * otherwise line 19 × line 22 / line 18. The engine reads a termination as
 * full when line 22 is at least line 18 (QUESTIONS.md, question 9).
 */
export function deferredTaxDue(line18: number, line19: number, line22: number): number {
  if (line22 >= line18 || line18 <= 0) return line19;
  return roundDollars((line19 * line22) / line18);
}

/*
 * Line 24 (::line-24::b01): interest on the deferred tax due "beginning on the
 * due date (without regard to extensions) of your tax return for the tax year
 * in which the section 1294 election is made and ending with the due date
 * ... for the tax year of the termination". Undefined past the rate table.
 */
export function terminationInterest(line23: number, electionYear: number): number | undefined {
  const interest = compoundedInterest(line23, returnDueDate(electionYear), returnDueDate(TAX_YEAR));
  return interest === undefined ? undefined : roundDollars(interest);
}

/* One column, or why it cannot be figured. */
export function partVIColumn(election: PficPrior1294Election): PartVIColumn | string {
  const line17 = `12/31/${election.taxYear}`;
  const line18 = roundDollars(election.undistributedEarnings);
  const line19 = roundDollars(election.deferredTax);
  const column = { line17, line18, line19 };
  if (election.terminatingEvent === undefined) return column;
  if (election.earningsDistributed === undefined)
    return `The ${election.taxYear} section 1294 election names an ending event but no earnings distributed (line 22).`;
  const line22 = roundDollars(election.earningsDistributed);
  const line23 = deferredTaxDue(line18, line19, line22);
  const line24 = terminationInterest(line23, election.taxYear);
  if (line24 === undefined) return "The interest on line 24 runs past the section 6621 rate table.";
  const partial = line23 < line19;
  return {
    ...column,
    line21: election.terminatingEvent,
    line22,
    line23,
    line24,
    line25: partial ? line19 - line23 : undefined,
  };
}
