import type { WaiverRequest } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";
import type { DayNumber } from "../2210/dates.js";
import type { DatedPayment } from "../2210/penaltyWorksheet.js";

/*
 * The answers Form 2210-F reads besides the return's lines (resolveInfo.ts).
 * An undefined answer waits: the resolver lists its key in missingInputs.
 */
export interface Form2210FAnswers {
  /* No 2024 return, or one for less than 12 months: line 10 stays blank. */
  noTwelveMonthReturn: boolean;
  /* Line 10: the 2024 tax (prior_year.federal_tax), whole dollars. */
  priorYearTax?: number;
  jointReturn2024?: boolean;
  waiver?: { request: WaiverRequest; amount?: number };
  /* Line 12 less line 8, whole dollars. */
  paymentsByDueDate: number;
  /* Estimated tax payments after January 15, 2026, whole dollars on their days. */
  latePayments: DatedPayment[];
  filedAndPaidByMarch2?: boolean;
  underpaymentPaidOn?: DayNumber;
  section1062NetTaxLiability?: number;
}

export interface Form2210FFilingInfo extends BaseFilingInfo {
  form2210F?: Form2210FAnswers;
  /* Why the form cannot be figured from the answers (a date that cannot be read). */
  form2210FGap?: string;
}
