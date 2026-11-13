import type { Form4562Activity } from "../../../federal/4562/filingInfo.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";

/* One business or rental of Form 4562's list, with FTB 3885A's line 1 answer. */
export type Form3885AActivity = Form4562Activity & {
  /* Line 1: a passive activity; undefined while an answer is missing. */
  passive: boolean | undefined;
};

export interface Form3885AFilingInfo extends BaseFilingInfo {
  /* One FTB 3885A per activity with a difference (ca-3885a-inst-2025::sec::specific-line-instructions::b01). */
  form3885aActivities?: Form3885AActivity[];
  /* Which activity this copy is for (renderCopies sets it); absent means the first. */
  form3885aCopyIndex?: number;
}
