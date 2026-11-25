/*
 * Federal 1040 values reach the 540 through the form accessor `f`, not
 * through FilingInfo.
 */

import type { Schedule8812FilingInfo } from "../../../federal/schedule-8812/filingInfo.js";
import type { ScheduleAFilingInfo } from "../../../federal/schedule-a/filingInfo.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";
import type { Money } from "../../../money.js";
import type { Form3514FilingInfo } from "../3514/filingInfo.js";
import type { Form3803FilingInfo } from "../3803/filingInfo.js";
import type { Form3853FilingInfo } from "../3853/filingInfo.js";
import type { ScheduleSFilingInfo } from "../schedule-s/filingInfo.js";

/**
 * Line 10's Dependents table reads Schedule 8812's `dependents` slot. Line 18
 * follows Schedule CA line 30 under the federal increased standard deduction.
 * Lines 75–77 read FTB 3514's credits, which need its slots. Line 31 adds
 * FTB 3803's line 9. Line 43 totals every Schedule S. Line 92 is FTB 3853's
 * penalty, figured from its household.
 */
export interface Form540FilingInfo
  extends
    BaseFilingInfo,
    Pick<Schedule8812FilingInfo, "dependents">,
    Pick<ScheduleAFilingInfo, "increasedStandardDeduction" | "disasterLossGap">,
    Omit<Form3514FilingInfo, keyof BaseFilingInfo>,
    Pick<Form3803FilingInfo, "form3803Totals">,
    Pick<Form3853FilingInfo, "ca3853" | "form3803Children">,
    Pick<ScheduleSFilingInfo, "otherStateCredits"> {
  /** "full_year" | "part_year" | "non_resident". */
  caResidencyStatus?: string;

  /** W-2 Box 16 sum. */
  w2StateWages?: Money;
  /** W-2 Box 17 sum. */
  w2StateWithholding?: Money;
  /** Line 71: California tax withheld on the W-2G and the 1099s (withholding.ts), cents kept. */
  caWithholdingOtherForms?: number;
  /** W-2 Box 14 CA SDI sum. */
  w2CaSdiTotal?: Money;

  useTaxOwed?: Money;
  noUseTaxOwed?: boolean;
  /** Line 5: the year a qualifying surviving spouse/RDP's spouse died. */
  spouseYearOfDeath?: string;
  /** Line 91 radio group: "no_use_tax_owed" | "paid_directly_to_cdtfa". */
  useTaxZeroReason?: string;
  mailingSameAsResidence?: boolean;
  /** Line 72: the California payments the taxpayer states, summed; undefined when none is recorded. */
  caEstimatedAndOtherPayments?: Money;
  /** Separate from the federal refund decision: the two can differ. */
  refundFullOverpaymentCA?: boolean;
}
