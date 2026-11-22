import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form3903Lines } from "./lines.js";

export interface Form3903FilingInfo extends BaseFilingInfo {
  /* The one Form 3903 the engine prints; undefined with no certified move or with a gap. */
  form3903?: Form3903Lines;
  /* Why the printed form's lines are unsupported (more than one move, both vehicle methods). */
  form3903Gap?: string;
  /* Schedule 1 line 14: the sum of the line 5 amounts of every Form 3903. */
  movingExpenseDeduction?: number;
  /* Form 1040 line 1h: line 4 − line 3 of every Form 3903 where it is more than 0. */
  movingReimbursementExcess?: number;
  /* Why Schedule 1 line 14 and the line 1h part cannot be figured. */
  movingTotalsGap?: string;
}
