import type { BaseFilingInfo } from "../../filingInfo.js";
import type { FirmRow } from "./lines.js";

/* One person's Form 8919: "If married, complete a separate Form 8919 for each spouse who must file this form." */
export interface WageFiler {
  owner: "taxpayer" | "spouse";
  /* Lines 1 through 5: one row per firm, in fact order. */
  rows: FirmRow[];
  /*
   * Line 8: the person's W-2 boxes 3 and 7, plus line 10 of the person's Form
   * 4137; undefined while a W-2 or a tip record cannot be placed.
   */
  socialSecurityWagesAndTips?: number;
}

export interface Form8919FilingInfo extends BaseFilingInfo {
  /* One copy per person with wages on line 6, the taxpayer first; undefined while a firm cannot be placed. */
  form8919Filers?: WageFiler[];
  /* Which person this copy is for (renderCopies sets it); absent means the first. */
  form8919CopyIndex?: number;
  /* Form 8959's Who Must File: line 6 of every person's Form 8919 together; undefined with no firm. */
  uncollectedWagesTotal?: number;
}
