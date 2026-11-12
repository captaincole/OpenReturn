import type { BaseFilingInfo } from "../../filingInfo.js";

export interface Form6251FilingInfo extends BaseFilingInfo {
  /** Line 2a: the return itemizes (decisions.itemize_vs_standard); undefined means 1040 line 12e. */
  itemizesDeductions?: boolean;
  /** Line 2c: last year's AMT Form 4952 line 7 (investment_interest.amt_disallowed_carryover). */
  amtDisallowedInterestCarryover?: number;
  /** Line 2g: 1099-INT box 9 plus 1099-DIV box 13; undefined with neither form. */
  privateActivityBondInterest?: number;
  /** Line 2i: the incentive stock option spread (amt.iso_exercise_spread); undefined while unstated. */
  isoExerciseSpread?: number;
}
