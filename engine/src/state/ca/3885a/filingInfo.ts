import type { ActivityDepreciation } from "../../../facts/index.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";

/* One business or rental whose California depreciation or amortization differs from federal. */
export interface Form3885AActivity {
  factKey: string;
  kind: "business" | "rental";
  /* The header's business or activity name. */
  name: string;
  /* Line 1: a passive activity; undefined while an answer is missing. */
  passive: boolean | undefined;
  depreciation: ActivityDepreciation;
}

export interface Form3885AFilingInfo extends BaseFilingInfo {
  /* One FTB 3885A per activity with a difference (ca-3885a-inst-2025::sec::specific-line-instructions::b01). */
  form3885aActivities?: Form3885AActivity[];
  /* Which activity this copy is for (renderCopies sets it); absent means the first. */
  form3885aCopyIndex?: number;
}
