import type { BaseFilingInfo } from "../../filingInfo.js";
import type { TipRow } from "./lines.js";

/* One person's Form 4137: "complete a separate Form 4137 for each spouse with unreported tips". */
export interface TipFiler {
  owner: "taxpayer" | "spouse";
  /* Line 1: one row per employer, in fact order. */
  rows: TipRow[];
  /* Line 8: the person's W-2 boxes 3 and 7; undefined while a W-2 cannot be placed. */
  socialSecurityWagesAndTips?: number;
}

export interface Form4137FilingInfo extends BaseFilingInfo {
  /* One copy per person who must file, the taxpayer first; undefined while a tip row cannot be placed. */
  form4137Filers?: TipFiler[];
  /* Which person this copy is for (renderCopies sets it); absent means the first. */
  form4137CopyIndex?: number;
  /* Form 1040 line 1c: every person's unreported and noncash tips; blank with no tips. */
  tipIncomeNotOnLine1a?: number;
  /* Form 8959's Who Must File: line 6 of every person's Form 4137 together. */
  tipsSubjectToMedicareTotal?: number;
}
