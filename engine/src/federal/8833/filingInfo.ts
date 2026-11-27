import type { TreatyPositionFact } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";

export interface Form8833FilingInfo extends BaseFilingInfo {
  /*
   * One Form 8833 for each treaty-based return position the return discloses,
   * in the order recorded: "Attach a separate Form 8833 for each treaty-based
   * return position taken" (irs-8833-form-2025::sec::face-page-1::b01).
   */
  form8833Positions?: TreatyPositionFact[];
  /* Why the content lines are gaps: the decision files the form with no position to print. */
  form8833Gap?: string;
  /* Which position this copy is for (renderCopies sets it); absent means the first. */
  form8833CopyIndex?: number;
}
