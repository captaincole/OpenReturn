import type { DayNumber } from "../../../federal/2210/dates.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";
import type { Unsupported } from "../../../types.js";
import type { PriorYearInputs } from "./lines.js";

/*
 * The answers FTB 5805F reads besides Form 540's lines. An undefined answer
 * waits: the resolver lists its key in missingInputs.
 */
export interface Form5805FAnswers {
  /* False when the form files by its decision on a return with no Form 540. */
  files540: boolean;
  separateReturn: boolean;
  /* Lines 7 to 9; "no_twelve_month_return" leaves them blank. */
  priorYear?: PriorYearInputs | "no_twelve_month_return";
  /* True while the 2024 withholding for exception 2 waits. */
  priorYearWithholdingWaits: boolean;
  /* Line 11 less line 5. */
  paymentsByDueDate?: number;
  filedAndPaidByMarch2?: boolean;
  /* Line 13; the gap when the stated date cannot be read. */
  underpaymentPaidOn?: DayNumber | Unsupported;
  waiver?: { amount: number; explanation: string };
}

export interface Form5805FFilingInfo extends BaseFilingInfo {
  form5805F?: Form5805FAnswers;
}
