import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form982Lines } from "./form.js";

export interface Form982FilingInfo extends BaseFilingInfo {
  /* The printed Form 982; undefined while it waits, with a gap, or with nothing excluded. */
  form982?: Form982Lines;
  /* Why the form's lines are unsupported. */
  form982Gap?: string;
  /* Schedule 1 line 8c: the taxable part of the nonbusiness canceled debts, cents kept; undefined with no debt. */
  canceledDebtIncome?: number;
  /* Why line 8c is unsupported (a Form 982 gap, or a taxable business debt the engine does not route). */
  canceledDebtGap?: string;
  /* Line 8c waits for an answer about a canceled debt. */
  canceledDebtWaits?: boolean;
  /* Line 1e's part of line 2, cents kept: Schedule CA line 8c column C. */
  principalResidenceExclusion?: number;
}
