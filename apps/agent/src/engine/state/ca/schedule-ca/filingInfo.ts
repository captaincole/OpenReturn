/*
 * ScheduleCaFilingInfo — Schedule CA (540) specific slots layered on
 * top of BaseFilingInfo.
 *
 * Schedule CA is almost entirely a derivative of federal Form 1040.
 * Col A echoes federal income lines; col B/C record CA adjustments.
 * Most bindings read upstream values via cross-form references on the
 * form accessor (e.g. f["form-1040.line.1a"]), not via FilingInfo.
 *
 * This interface stays minimal on purpose: only the form-scoping flag
 * for now. Add a slot here when a Schedule CA binding needs a value
 * that the form accessor and BaseFilingInfo cannot reach.
 */

import type { BaseFilingInfo } from "../../../filingInfo.js";
import type { EngineDerivation } from "../../../types.js";

export interface ScheduleCaFilingInfo extends BaseFilingInfo {
  /**
   * Schedule CA (540) must-file determination. Driven by the
   * `decisions.scope.must_file_schedule_ca` AI decision. True when the
   * taxpayer files 540 and has any federal-vs-CA difference to record,
   * or when a CPA files the schedule for documentation even though col
   * B/C are entirely zero.
   */
  mustFileScheduleCA?: boolean;
  /** Provenance for mustFileScheduleCA — populated by resolveFilingInfo. */
  mustFileScheduleCADerivation?: EngineDerivation;
}
