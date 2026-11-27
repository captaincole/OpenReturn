/*
 * Schedule CA (540NR) runs Schedule CA (540)'s column A to C rules, so it
 * reads that schedule's slots, and Form 540NR's list of the forms figured for
 * Form 540 only. Its own slots: the Part I answers and the column E amounts.
 */

import type { CaResidencyFactValue, CaStatedAmountLine } from "../../../facts/index.js";
import type { Form540NRFilingInfo } from "../540nr/filingInfo.js";
import type { ScheduleCaFilingInfo } from "../schedule-ca/filingInfo.js";
import type { ScheduleD540NRFilingInfo } from "../schedule-d-540nr/filingInfo.js";

export interface ScheduleCa540NRFilingInfo
  extends
    ScheduleCaFilingInfo,
    Pick<Form540NRFilingInfo, "formsNeededOnly540" | "caResidencyStatus">,
    // Line 7a columns B and C: Schedule D (540NR) lines 12a and 12b, and its gap.
    Pick<ScheduleD540NRFilingInfo, "scheduleD540NRFigures"> {
  /* Part I: each person's stated residency answers (facts/kinds/caResidency.ts). */
  caResidencyTaxpayer?: CaResidencyFactValue;
  caResidencySpouse?: CaResidencyFactValue;
  /* Column E: the stated California amount of each line (facts/kinds/caCaliforniaAmounts.ts). */
  californiaAmounts?: Partial<Record<CaStatedAmountLine, number>>;
  /*
   * The lines whose column E the form asks for: a document or schedule on the
   * return feeds the line (resolveInfo.ts). Another line with a column D amount
   * and no stated amount is a gap.
   */
  californiaAmountLinesAsked?: CaStatedAmountLine[];
}
