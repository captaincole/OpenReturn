/*
 * Bindings read federal values through the form accessor (f["form-1040.line.1a"]).
 * Add a slot here only when the accessor and BaseFilingInfo cannot reach a value.
 */

import type { Form2106FilingInfo } from "../../../federal/2106/filingInfo.js";
import type { Form4797FilingInfo } from "../../../federal/4797/filingInfo.js";
import type { Form8889FilingInfo } from "../../../federal/8889/filingInfo.js";
import type { Form982FilingInfo } from "../../../federal/982/filingInfo.js";
import type { ScheduleAFilingInfo } from "../../../federal/schedule-a/filingInfo.js";
import type { ScheduleFFilingInfo } from "../../../federal/schedule-f/filingInfo.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";
import type { Form3801FilingInfo } from "../3801/filingInfo.js";
import type { Form3803FilingInfo } from "../3803/filingInfo.js";
import type { Form3805EFilingInfo } from "../3805e/filingInfo.js";
import type { Form3913FilingInfo } from "../3913/filingInfo.js";
import type { Form5870AFilingInfo } from "../5870a/filingInfo.js";
import type { ScheduleD1FilingInfo } from "../schedule-d-1/filingInfo.js";
import type { ScheduleDCaFilingInfo } from "../schedule-d-ca/filingInfo.js";
import type { ScheduleG1FilingInfo } from "../schedule-g-1/filingInfo.js";
import type { CaEmployeeAmounts, DepreciationAdjustment } from "./activities.js";

/*
 * Part II waits while Schedule A prints the federal increased standard deduction.
 * Line 12 columns B and C read whether a Form 2106 claims depreciation.
 * Line 5 reads FTB 3801's figures when that form files.
 */
export interface ScheduleCaFilingInfo
  extends
    BaseFilingInfo,
    Form3801FilingInfo,
    Pick<Form2106FilingInfo, "form2106Totals" | "form2106TotalsGap">,
    Pick<Form8889FilingInfo, "hsaEmployerContributions">,
    Pick<ScheduleAFilingInfo, "increasedStandardDeduction" | "disasterLossGap">,
    Pick<ScheduleDCaFilingInfo, "scheduleDCaFigures">,
    Pick<Form3803FilingInfo, "childIncomeLine8z">,
    Pick<ScheduleFFilingInfo, "farms">,
    Pick<Form982FilingInfo, "form982Gap" | "principalResidenceExclusion">,
    Pick<
      Form3913FilingInfo,
      | "caMovingWaits"
      | "caMovingExpenseDeduction"
      | "caMovingReimbursementExcess"
      | "caMovingTotalsGap"
    >,
    Pick<ScheduleG1FilingInfo, "scheduleG1CaSubtraction">,
    // Line 4 reads Form 4797 line 18b and Schedule D-1 line 21; line 3 the Part IV difference.
    Pick<Form4797FilingInfo, "form4797" | "form4797Gap" | "form4797SummaryGap">,
    Pick<
      ScheduleD1FilingInfo,
      "scheduleD1" | "scheduleD1Gap" | "scheduleD1SummaryGap" | "scheduleD1Recapture"
    >,
    // Line 4 columns B and C are a gap while an FTB 3805E amount is bound for Schedule D-1.
    Pick<Form3805EFilingInfo, "form3805ETotals">,
    // Line 8z column C takes FTB 5870A Part II line 2 or 4, or an untaxed trust distribution.
    Pick<Form5870AFilingInfo, "form5870AScheduleCaAddition"> {
  /** Part II line 21: investment fees (misc_deductions.investment_fees), a California-only deduction. */
  caInvestmentFees?: number;
  /** Lines 1a, 3, 15 and 17: a contractor who is an employee for California; undefined when not one. */
  caEmployeeAmounts?: CaEmployeeAmounts;
  /** Line 3 column B: the Schedule C wages the federal Forms 5884 and 8844 credits took off, and the expenses the Form 8820 credit took off, in total; undefined with none. */
  caWageCreditAddBack?: number;
  /** Line 6 column B: the farms' Forms 5884 and 8844 credits and the labor hired they took off Schedule F line 22; undefined with none. */
  caFarmLaborCredits?: { credit: number; reduction: number };
  /** Line 3 (businesses) and line 5 (rentals) columns B and C: the FTB 3885A differences. */
  businessDepreciationAdjustment?: DepreciationAdjustment;
  rentalDepreciationAdjustment?: DepreciationAdjustment;
}
