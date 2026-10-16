/*
 * Schedule2FilingInfo — Schedule 2 (Additional Taxes) specific slots
 * layered on top of BaseFilingInfo.
 *
 * Every computed line reads other forms (Form 8959 line 18, Form 8960
 * line 17, Form 8889 lines 17b/21), so the only slot is the must-file
 * determination.
 */

import type { BaseFilingInfo } from "../../filingInfo.js";
import type { EngineDerivation } from "../../types.js";

export interface Schedule2FilingInfo extends BaseFilingInfo {
  /**
   * Schedule 2 must-file determination. Driven by
   * `decisions.scope.must_file_schedule_2`, with a fallback to "a form
   * that feeds Schedule 2 is required" (today: Form 8959).
   */
  mustFileSchedule2?: boolean;
  /** Provenance for mustFileSchedule2. */
  mustFileSchedule2Derivation?: EngineDerivation;
}
