import type { BaseFilingInfo } from "../../../filingInfo.js";
import type { Form3913Lines } from "./lines.js";

export interface Form3913FilingInfo extends BaseFilingInfo {
  /* The "military member" answer of the one FTB 3913 the engine prints; undefined with more than one move. */
  form3913Military?: boolean;
  /* That copy's lines; undefined while an answer waits or with a gap. */
  form3913?: Form3913Lines;
  /* Why the printed form's lines are unsupported (more than one move, both vehicle methods). */
  form3913Gap?: string;
  /* A non-military move waits for an answer: the Schedule CA (540) amounts wait too. */
  caMovingWaits?: boolean;
  /* Schedule CA (540) line 14 column C: line 5 of every non-military FTB 3913. */
  caMovingExpenseDeduction?: number;
  /* Schedule CA (540) line 1h column C: line 4 − line 3 of every non-military FTB 3913 when more than 0. */
  caMovingReimbursementExcess?: number;
  /* Why the Schedule CA (540) amounts cannot be figured. */
  caMovingTotalsGap?: string;
}
