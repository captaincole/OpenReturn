/*
 * Schedule1FilingInfo — Schedule 1 (Additional Income and Adjustments to
 * Income) specific slots layered on top of BaseFilingInfo.
 */

import type { BaseFilingInfo } from "../../filingInfo.js";
import type { EngineDerivation } from "../../types.js";

export interface Schedule1FilingInfo extends BaseFilingInfo {
  /**
   * Schedule 1 must-file determination. Driven by
   * `decisions.scope.must_file_schedule_1`, with a fallback to "other
   * income exists" (1099-MISC box 3). More triggers join as their lines
   * get bound.
   */
  mustFileSchedule1?: boolean;
  /** Provenance for mustFileSchedule1. */
  mustFileSchedule1Derivation?: EngineDerivation;
  /** Line 8z: sum of 1099-MISC box 3 (other income), cents kept. Undefined without 1099-MISC facts. */
  miscOtherIncome?: number;
}
