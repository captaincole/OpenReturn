import type { BaseFilingInfo } from "../../filingInfo.js";

/* Line 3: whole dollars, or why the engine cannot place a credit. */
export type PassThroughBiofuelCredits = { amount: number } | { gap: string };

export interface Form6478Figures {
  /* Line 3; undefined with no pass-through credit on the return. */
  line3?: PassThroughBiofuelCredits;
}

export interface Form6478FilingInfo extends BaseFilingInfo {
  /* Undefined while Form 6478 does not file. */
  form6478?: Form6478Figures;
}
