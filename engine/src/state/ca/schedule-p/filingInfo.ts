/*
 * Schedule P (540) reads the 540 and Schedule CA through the form accessor. The
 * adjustments and preferences the taxpayer states (not on any form) come through
 * these slots.
 */

import type { BaseFilingInfo } from "../../../filingInfo.js";

export interface SchedulePFilingInfo extends BaseFilingInfo {
  /** Part I line 10: the incentive stock option spread (the Forms 3921, else amt.iso_exercise_spread). */
  isoExerciseSpread?: number;
  /** Forms 3921 are on file and the shares were sold in the year of exercise: line 10 is not handled. */
  isoSharesSoldInYear?: boolean;
  /** Part I line 7: last year's AMT FTB 3526 line 7 (investment_interest.ca_amt_disallowed_carryover). */
  caAmtDisallowedInterestCarryover?: number;
}
