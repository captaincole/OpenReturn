import type { BaseFilingInfo } from "../../filingInfo.js";
import type { CreditLines } from "./lines.js";

/* Line 15 from the K-1s: whole dollars, or why the engine cannot place it. */
export type K1HealthCredits = { amount: number } | { gap: string };

/* The header answers of the fact (lines A, B and C). */
export interface Form8941Answers {
  shopCoverage: boolean;
  marketplaceIdentifier?: string;
  employmentTaxEin?: string;
  creditClaimedBefore2024: boolean;
}

export interface Form8941Figures {
  /* The fact's header answers; undefined with no fact of the taxpayer's own employees. */
  answers?: Form8941Answers;
  /* Line A "Yes" and line C "No": lines 1 to 14 are figured (or have a gap). */
  claimsCredit: boolean;
  /* Lines 1 to 14; undefined with no claim, or with a gap. */
  lines?: CreditLines;
  /* Why lines 1 to 14 cannot be figured. */
  gap?: string;
  /* Line 15: undefined with no K-1 credit of this kind. */
  k1Credits?: K1HealthCredits;
}

export interface Form8941FilingInfo extends BaseFilingInfo {
  /* Undefined while Form 8941 does not file. */
  form8941?: Form8941Figures;
}
