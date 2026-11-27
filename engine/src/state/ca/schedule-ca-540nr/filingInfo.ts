/*
 * Schedule CA (540NR) runs Schedule CA (540)'s column A to C rules, so it
 * reads that schedule's slots, and Form 540NR's list of the forms figured for
 * Form 540 only. Its own slots: the Part I answers and the column E amounts.
 */

import type { CaResidencyFactValue, CaStatedAmountLine } from "../../../facts/index.js";
import type { Form540NRFilingInfo } from "../540nr/filingInfo.js";
import type { ScheduleCaFilingInfo } from "../schedule-ca/filingInfo.js";

export interface ScheduleCa540NRFilingInfo
  extends
    ScheduleCaFilingInfo,
    Pick<Form540NRFilingInfo, "formsNeededOnly540" | "caResidencyStatus"> {
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
