/*
 * Federal 1040 values reach the 540 through the form accessor `f`, not
 * through FilingInfo.
 */

import type { Schedule8812FilingInfo } from "../../../federal/schedule-8812/filingInfo.js";
import type { ScheduleAFilingInfo } from "../../../federal/schedule-a/filingInfo.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";
import type { Money } from "../../../money.js";
import type { Form3514FilingInfo } from "../3514/filingInfo.js";

/**
 * Line 10's Dependents table reads Schedule 8812's `dependents` slot. Line 18
 * follows Schedule CA line 30 under the federal increased standard deduction.
 * Lines 75–77 read FTB 3514's credits, which need its slots.
 */
export interface Form540FilingInfo
  extends
    BaseFilingInfo,
    Pick<Schedule8812FilingInfo, "dependents">,
    Pick<ScheduleAFilingInfo, "increasedStandardDeduction" | "disasterLossGap">,
    Omit<Form3514FilingInfo, keyof BaseFilingInfo> {
  /** "full_year" | "part_year" | "non_resident". */
  caResidencyStatus?: string;

  /** W-2 Box 16 sum. */
  w2StateWages?: Money;
  /** W-2 Box 17 sum. */
  w2StateWithholding?: Money;
  /** W-2 Box 14 CA SDI sum. */
  w2CaSdiTotal?: Money;

  useTaxOwed?: Money;
  noUseTaxOwed?: boolean;
  /** Line 91 radio group: "no_use_tax_owed" | "paid_directly_to_cdtfa". */
  useTaxZeroReason?: string;
  mailingSameAsResidence?: boolean;
  /** Separate from the federal refund decision: the two can differ. */
  refundFullOverpaymentCA?: boolean;
}
