/*
 * Bindings read federal values through the form accessor (f["form-1040.line.1a"]).
 * Add a slot here only when the accessor and BaseFilingInfo cannot reach a value.
 */

import type { Form8889FilingInfo } from "../../../federal/8889/filingInfo.js";
import type { ScheduleAFilingInfo } from "../../../federal/schedule-a/filingInfo.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";

/* Part II waits while Schedule A prints the federal increased standard deduction. */
export interface ScheduleCaFilingInfo
  extends
    BaseFilingInfo,
    Pick<Form8889FilingInfo, "hsaEmployerContributions">,
    Pick<ScheduleAFilingInfo, "increasedStandardDeduction"> {
  /** Part II line 21: investment fees (misc_deductions.investment_fees), a California-only deduction. */
  caInvestmentFees?: number;
}
