import type { BaseFilingInfo } from "../../filingInfo.js";
import type { CreditLines } from "./lines.js";

/* Line 7 from the K-1s: whole dollars, or why the engine cannot place it. */
export type K1DisabledAccessCredits = { amount: number } | { gap: string };

export interface Form8826Figures {
  /* Lines 1 to 6; undefined with no expenditures of the taxpayer's own business, or while they wait. */
  lines?: CreditLines;
  /* The return has expenditures of its own business: lines 1 to 6 are figured (or wait, or have a gap). */
  ownCredit: boolean;
  /* Why lines 1 to 6 cannot be figured. */
  gap?: string;
  /* Line 7: undefined with no K-1 credit of this kind. */
  k1Credits?: K1DisabledAccessCredits;
}

export interface Form8826FilingInfo extends BaseFilingInfo {
  /* Undefined while Form 8826 does not file. */
  form8826?: Form8826Figures;
}
