import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form6198Outcome } from "./figure.js";

/* One copy of Form 6198: one activity (irs-6198-inst-2025::sec::aggregation-or-separation::b01). */
export interface Form6198Copy {
  /* The header's description of the activity. */
  description: string;
  /* Whose activity it is: the identifying number. */
  owner: "taxpayer" | "spouse";
  outcome: Form6198Outcome<unknown>;
}

export interface Form6198FilingInfo extends BaseFilingInfo {
  /* The activities that file Form 6198, one copy each: the K-1s first, then the businesses, in fact order. */
  form6198Copies?: Form6198Copy[];
  /* Which activity this copy is for (renderCopies sets it); absent means the first. */
  form6198CopyIndex?: number;
}
