import type { OrphanDrug } from "../../facts/kinds/orphanDrugCredit.js";
import type { BaseFilingInfo } from "../../filingInfo.js";
import type { CreditLines } from "./lines.js";

/* Line 3 from the K-1s: whole dollars, or why the engine cannot place it. */
export type K1OrphanDrugCredits = { amount: number } | { gap: string };

export interface Form8820Figures {
  /* The return has an orphan drug credit fact of its own: lines 1 to 2c and Part II are figured (or wait, or have a gap). */
  ownCredit: boolean;
  /* Line 2a's answer; undefined with no fact of its own. */
  reducedCreditElection?: boolean;
  /* Lines 1 to 2c; undefined with no fact of its own, or while it waits. */
  lines?: CreditLines;
  /* Why lines 1 to 2c cannot be figured. */
  gap?: string;
  /* Part II, in the order stated. */
  drugs: OrphanDrug[];
  /* Line 3: undefined with no K-1 orphan drug credit. */
  k1Credits?: K1OrphanDrugCredits;
}

export interface Form8820FilingInfo extends BaseFilingInfo {
  /* Undefined while Form 8820 does not file. */
  form8820?: Form8820Figures;
  /* The copy being filled: 0 for the form, 1 and up for each extra Part II page (copies.ts). */
  form8820CopyIndex?: number;
}
