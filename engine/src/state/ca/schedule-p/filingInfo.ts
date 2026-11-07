/*
 * Schedule P (540) reads the 540 and Schedule CA through the form accessor. The
 * adjustments and preferences the taxpayer states (not on any form) come through
 * these slots.
 */

import type { BaseFilingInfo } from "../../../filingInfo.js";

export interface SchedulePFilingInfo extends BaseFilingInfo {
  /** Part I line 10: the incentive stock option spread (amt.iso_exercise_spread). */
  isoExerciseSpread?: number;
}
