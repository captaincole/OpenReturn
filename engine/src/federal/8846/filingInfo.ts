import type { BaseFilingInfo } from "../../filingInfo.js";
import type { CreditLines } from "./lines.js";

/* Line 5 from the K-1s: whole dollars, or why the engine cannot place it. */
export type K1TipCredits = { amount: number } | { gap: string };

export interface Form8846Figures {
  /* Lines 1 to 4; undefined with no credit of the taxpayer's own business, or while it waits. */
  lines?: CreditLines;
  /* The return has a credit of its own business: lines 1 to 4 are figured (or wait, or have a gap). */
  ownCredit: boolean;
  /* The line 4 box. */
  overWageBase: boolean;
  /* Why line 4 cannot be figured. */
  gap?: string;
  /* Line 5: undefined with no K-1 credit of this kind. */
  k1Credits?: K1TipCredits;
}

export interface Form8846FilingInfo extends BaseFilingInfo {
  /* Undefined while Form 8846 does not file. */
  form8846?: Form8846Figures;
}
