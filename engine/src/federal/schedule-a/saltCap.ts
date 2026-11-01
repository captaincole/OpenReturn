import { atLeast, roundDollars } from "../../money.js";
import type { FilingStatus } from "../../values.js";

/*
 * Line 5e cap, from the 2025 SALT worksheet: $40,000 less 30% of MAGI over
 * the threshold, not below $10,000, then halved for MFS.
 */
export function saltCap(magi: number | undefined, filingStatus: FilingStatus | undefined): number {
  const mfs = filingStatus === "married_filing_separately";
  const excess = magi === undefined ? 0 : atLeast(0, magi - (mfs ? 250000 : 500000));
  const cap = atLeast(10000, 40000 - roundDollars(0.3 * excess));
  return mfs ? roundDollars(cap / 2) : cap;
}
