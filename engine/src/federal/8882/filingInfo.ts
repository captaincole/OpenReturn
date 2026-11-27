import type { BaseFilingInfo } from "../../filingInfo.js";
import type { OwnLines } from "./lines.js";

/* Line 5 from the K-1s and other notices: whole dollars, or why the engine cannot place it. */
export type PassThroughChildcareCredits = { amount: number } | { gap: string };

export interface Form8882Figures {
  /* Lines 1 to 4; undefined with no expenditure of the taxpayer's own business, or with a gap. */
  lines?: OwnLines;
  /* The return has expenditures of its own business: lines 1 to 4 are figured (or have a gap). */
  ownCredit: boolean;
  /* Why lines 1 to 4 cannot be figured. */
  gap?: string;
  /* Line 5: undefined with no credit from a pass-through entity. */
  passThrough?: PassThroughChildcareCredits;
}

export interface Form8882FilingInfo extends BaseFilingInfo {
  /* Undefined while Form 8882 does not file. */
  form8882?: Form8882Figures;
}
