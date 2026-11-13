/*
 * Bindings read federal values through the form accessor (f["form-1040.line.1a"]).
 * Add a slot here only when the accessor and BaseFilingInfo cannot reach a value.
 */

import type { Form8889FilingInfo } from "../../../federal/8889/filingInfo.js";
import type { ScheduleAFilingInfo } from "../../../federal/schedule-a/filingInfo.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";
import type { CaEmployeeAmounts, DepreciationAdjustment } from "./activities.js";

/* Part II waits while Schedule A prints the federal increased standard deduction. */
export interface ScheduleCaFilingInfo
  extends
    BaseFilingInfo,
    Pick<Form8889FilingInfo, "hsaEmployerContributions">,
    Pick<ScheduleAFilingInfo, "increasedStandardDeduction" | "disasterLossGap"> {
  /** Part II line 21: investment fees (misc_deductions.investment_fees), a California-only deduction. */
  caInvestmentFees?: number;
  /** Lines 1a, 3, 15 and 17: a contractor who is an employee for California; undefined when not one. */
  caEmployeeAmounts?: CaEmployeeAmounts;
  /** Line 3 (businesses) and line 5 (rentals) columns B and C: the FTB 3885A differences. */
  businessDepreciationAdjustment?: DepreciationAdjustment;
  rentalDepreciationAdjustment?: DepreciationAdjustment;
}
