import type { BaseFilingInfo } from "../../filingInfo.js";
import type { TrackLines } from "./lines.js";

/* Line 6 from the K-1s: whole dollars, or why the engine cannot place it. */
export type K1TrackCredits = { amount: number } | { gap: string };

export interface Form8900Figures {
  /* The return has a railroad track maintenance fact of its own: lines 1 to 5 are figured (or wait, or have a gap). */
  ownCredit: boolean;
  /* Lines 1 to 5; undefined with no fact of its own, or while it waits. */
  lines?: TrackLines;
  /* Why lines 1 to 5 cannot be figured. */
  gap?: string;
  /* Line 6: undefined with no K-1 railroad track maintenance credit. */
  k1Credits?: K1TrackCredits;
}

export interface Form8900FilingInfo extends BaseFilingInfo {
  /* Undefined while Form 8900 does not file. */
  form8900?: Form8900Figures;
}
