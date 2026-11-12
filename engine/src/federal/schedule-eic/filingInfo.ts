import type { DependentFact } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";

export interface ScheduleEICFilingInfo extends BaseFilingInfo {
  /** Dependents who are qualifying children for the EIC, in the order recorded (lines 1–6). */
  eicQualifyingChildren?: DependentFact[];
}
