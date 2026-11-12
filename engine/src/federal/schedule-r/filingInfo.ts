import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form1040FilingInfo } from "../1040/filingInfo.js";

/*
 * Schedule R reads the ages (BaseFilingInfo), the MFS lived-apart answer
 * (Form 1040's slot) and the answers below. Lines 13a, 14 and 21 read Form
 * 1040 and Schedule 3 through the form accessor.
 */
export interface ScheduleRFilingInfo
  extends BaseFilingInfo, Pick<Form1040FilingInfo, "livedApartFromSpouseAllYear"> {
  /** Part I: retired on permanent and total disability, for a person under 65; undefined when not asked. */
  scheduleRTaxpayerRetiredOnDisability?: boolean;
  scheduleRSpouseRetiredOnDisability?: boolean;
  /** Line 11: each person's taxable disability income (the disability pensions on Form 1040 line 1h). */
  scheduleRTaxpayerDisabilityIncome?: number;
  scheduleRSpouseDisabilityIncome?: number;
  /** Part II box. */
  scheduleRPhysicianStatementOnFile?: boolean;
  /** Line 13b. */
  scheduleRNontaxablePensions?: number;
}
