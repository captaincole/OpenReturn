/*
 * Form 8606 Part III, Distributions From Roth IRAs, for one person, from the
 * code J and T 1099-Rs and the Roth IRA answers (facts/kinds/rothIra.ts). Form
 * 1040 line 4b reads line 25c before Form 8606 is evaluated.
 */

import type { RetirementDistributionFactValue, RothIraFactValue } from "../../facts/index.js";
import { atLeast, roundDollars, sum } from "../../money.js";

/* irs-8606-inst-2025::sec::line-20::b01: at most $10,000 of qualified first-time homebuyer expenses. */
const HOMEBUYER_LIMIT = 10000;
/* Roth IRA distributions that are not qualified (code Q is qualified). */
export const NONQUALIFIED_ROTH_CODES = ["J", "T"];

export interface PartIIIFigures {
  line19: number;
  line20: number;
  line21: number;
  line22: number | undefined;
  line23: number | undefined;
  line24: number | undefined;
  line25a: number | undefined;
  /* Undefined with no Form 8915-F Roth IRA distribution. */
  line25b?: number;
  line25c: number | undefined;
}

/*
 * Line 25b: "If all your distributions in 2025 from Roth IRAs are qualified
 * disaster distributions, enter the amount from line 25a on line 25b ...
 * multiply the amount on line 25a by a fraction. The numerator of the fraction
 * is your total qualified disaster distributions, and the denominator is the
 * amount from Form 8606, line 21" (irs-8606-inst-2025::sec::line-25b::b01–b02).
 */
function line25bOf(line25a: number, line21: number, qualifiedDisaster: number): number {
  if (line21 <= 0) return 0;
  return roundDollars((line25a * Math.min(qualifiedDisaster, line21)) / line21);
}

/*
 * Lines 19–25c. Line 19 is the box 1 total of the person's code J and T
 * 1099-Rs less what the answers leave off it (irs-8606-inst-2025::sec::line-19::b01–b02:
 * rollovers, returned contributions and the other listed exclusions). Line 23
 * of zero or less skips lines 24 and 25 (the form's text). Line 25b takes the
 * person's Form 8915-F Roth IRA qualified disaster distributions; without
 * them it is blank and line 25c is line 25a.
 */
export function partIIIFigures(
  rows: RetirementDistributionFactValue[],
  roth: RothIraFactValue,
  qualifiedDisaster?: number,
): PartIIIFigures {
  const gross = sum(...rows.map((row) => row.box1));
  const line19 = roundDollars(atLeast(0, gross - (roth.notOnLine19 ?? 0)));
  const line20 = roundDollars(Math.min(HOMEBUYER_LIMIT, roth.firstTimeHomebuyerExpenses ?? 0));
  const line21 = atLeast(0, line19 - line20);
  const line22 = roundDollars(roth.contributionBasis);
  const line23 = line22 === undefined ? undefined : atLeast(0, line21 - line22);
  if (line23 === undefined || line23 === 0)
    return {
      line19,
      line20,
      line21,
      line22,
      line23,
      line24: undefined,
      line25a: undefined,
      line25c: line23,
    };
  const line24 = roundDollars(roth.conversionAndRolloverBasis);
  const line25a = line24 === undefined ? undefined : atLeast(0, line23 - line24);
  const line25b =
    line25a === undefined || qualifiedDisaster === undefined
      ? undefined
      : line25bOf(line25a, line21, qualifiedDisaster);
  const line25c = line25a === undefined ? undefined : line25a - (line25b ?? 0);
  return { line19, line20, line21, line22, line23, line24, line25a, line25b, line25c };
}
