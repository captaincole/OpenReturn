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
  line25c: number | undefined;
}

/*
 * Lines 19–25c. Line 19 is the box 1 total of the person's code J and T
 * 1099-Rs less what the answers leave off it (irs-8606-inst-2025::sec::line-19::b01–b02:
 * rollovers, returned contributions and the other listed exclusions). Line 23
 * of zero or less skips lines 24 and 25 (the form's text). Line 25b, qualified
 * disaster distributions, has no fact and reads as zero.
 */
export function partIIIFigures(
  rows: RetirementDistributionFactValue[],
  roth: RothIraFactValue,
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
  return { line19, line20, line21, line22, line23, line24, line25a, line25c: line25a };
}
