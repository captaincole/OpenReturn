/*
 * Line 11: interest on the line 10 recapture (irs-8611-form-2025::sec::line-11::b01).
 * "Figure the interest separately for each prior tax year for which a credit is
 * being recaptured", at the overpayment rate of section 6621(a)(1), compounded
 * daily, from the due date (not including extensions) of the prior year's
 * return to the due date of the 2025 return. The daily compounding is Form
 * 8621's (federal/8621/interest.ts), on the section 6621 table for individuals
 * (data/underpaymentRates.ts): for an individual the overpayment rate and the
 * underpayment rate are the same since 1999 (QUESTIONS.md).
 *
 * Line 10 is shared among the prior years in proportion to each year's credit
 * less its credit from additions (the Line 2 Worksheet's i): the part of line 3
 * that year holds (QUESTIONS.md). The interest keeps its cents and rounds once.
 */

import { roundDollars, sum } from "../../money.js";
import { compoundedInterest, returnDueDate } from "../8621/interest.js";

/* One prior year's share of the credit subject to recapture. */
export interface InterestYear {
  taxYear: number;
  weight: number;
}

export type InterestResult = { kind: "figured"; amount: number } | { kind: "gap"; reason: string };

export const NO_PRIOR_YEAR_CREDIT =
  "Line 11 places the interest in the prior years of the credit (irs-8611-form-2025::sec::line-11::b01), and the fact lists no prior year with a credit above 0.";
export const PAST_RATE_TABLE =
  "Line 11 needs a section 6621 rate for a day the engine's table does not hold (data/underpaymentRates.ts).";

/* The interest on line 10, whole dollars; 0 when line 10 is 0. */
export function recaptureInterest(
  line10: number,
  years: readonly InterestYear[],
  recaptureYear: number,
): InterestResult {
  if (line10 === 0) return { kind: "figured", amount: 0 };
  const prior = years.filter((year) => year.taxYear < recaptureYear && year.weight > 0);
  const total = sum(...prior.map((year) => year.weight));
  if (!(total > 0)) return { kind: "gap", reason: NO_PRIOR_YEAR_CREDIT };
  const end = returnDueDate(recaptureYear);
  const amounts: number[] = [];
  for (const year of prior) {
    const amount = compoundedInterest(
      (line10 * year.weight) / total,
      returnDueDate(year.taxYear),
      end,
    );
    if (amount === undefined) return { kind: "gap", reason: PAST_RATE_TABLE };
    amounts.push(amount);
  }
  return { kind: "figured", amount: roundDollars(sum(...amounts)) };
}
