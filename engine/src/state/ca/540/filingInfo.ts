/*
 * Federal 1040 values reach the 540 through the form accessor `f`, not
 * through FilingInfo.
 */

import type { BaseFilingInfo } from "../../../filingInfo.js";
import type { Money } from "../../../money.js";

export interface Form540FilingInfo extends BaseFilingInfo {
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
