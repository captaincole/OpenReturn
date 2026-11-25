/*
 * The credit for prior year AMT that the return takes: Schedule P (540) line 10
 * column (b), which is FTB 3510 line 38. Form 540 lines 43 and 44 and Schedule
 * S line 2 read it here, from its source, so Schedule S line 2 never reads the
 * Form 540 line that holds its own credit. `read` takes a full field id.
 */

import type { BaseFilingInfo } from "../../../filingInfo.js";
import { numberOrBlank } from "../../../money.js";

type ReadField = (fieldId: string) => unknown;

export const PRIOR_YEAR_AMT_CREDIT_USED = "schedule-p.2.part3.10_prior_year_amt_credit_used_col_b";

export const files3510 = (info: BaseFilingInfo) => info.mustFile?.["form-3510"]?.value === true;

export const priorYearAmtCreditUsed = (read: ReadField) =>
  numberOrBlank(read(PRIOR_YEAR_AMT_CREDIT_USED));

/*
 * With FTB 3510 filed, the credit waits while line 32 waits, or while a line
 * 32 above 0 has no Schedule P column (b) yet.
 */
export function priorYearAmtCreditWaits(read: ReadField, info: BaseFilingInfo): boolean {
  if (!files3510(info)) return false;
  const available = numberOrBlank(read("form-3510.0.line.32_combine_lines_30_and_31"));
  if (available === undefined) return true;
  return available > 0 && priorYearAmtCreditUsed(read) === undefined;
}
