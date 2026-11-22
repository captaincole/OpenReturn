/*
 * Schedule CA (540) Part II lines 8a and 8e, column C, with a federal mortgage
 * interest credit: "If you reduced your federal mortgage interest deduction by
 * the amount of your mortgage interest credit (from federal Form 8396 …),
 * increase your California itemized deductions by the same amount. Enter the
 * amount of your federal mortgage interest credit on line 8, column C"
 * (ca-540-sched-ca-inst-2025::sec::line-8-home-mortgage-interest::b01).
 *
 * The amount is Form 8396 line 3, the reduction on federal Schedule A line 8a
 * (irs-1040sa-inst-2025::sec::line-8a::b02). It goes in column C only while
 * federal line 8a prints, so no federal limit (the other column C entry) is
 * open. Line 8e column C is line 8a's while lines 8b and 8c print nothing.
 * Without Form 8396 each line keeps the reason it had before.
 */

import type { FormAccessor, FormSpec } from "../../../defineForm.js";
import { numberOrBlank } from "../../../money.js";
import { unsupported } from "../../../types.js";
import type { ScheduleCaFilingInfo } from "./filingInfo.js";
import type { ScheduleCa } from "./types.js";

type Bindings = FormSpec<ScheduleCa, ScheduleCaFilingInfo>["bindings"];

const LINE_8A_WITHOUT_CREDIT =
  "Line 8a col C (the interest the federal $750,000 limit disallowed, home equity interest, the mortgage interest credit) needs the Pub. 936 average-balance worksheet and California's $1,000,000 limit; the engine knows only the 1098's January 1 principal.";
const LINE_8E_WITHOUT_CREDIT =
  "Line 8e col C totals lines 8a–8c col C; every upstream row is unsupported.";
const LINE_8E_WITH_OTHER_ROWS =
  "Line 8e col C totals lines 8a–8c col C; lines 8b and 8c col C (the federal limit on interest and points not on a Form 1098) are unsupported.";

/* Form 8396 line 3 above 0, while the form files and federal line 8a prints. */
function creditAddBack(form: FormAccessor<ScheduleCa>, info: ScheduleCaFilingInfo) {
  if (info.mustFile?.["form-8396"]?.value !== true) return undefined;
  if (numberOrBlank(form["schedule-a.0.line.8a_mortgage_interest_form1098"]) === undefined) {
    return undefined;
  }
  const line3 = numberOrBlank(form["form-8396.0.line.3_interest_times_credit_rate"]);
  return line3 !== undefined && line3 > 0 ? line3 : undefined;
}

export const mortgageCreditBindings: Bindings = {
  "4.page2.interest_8a_additions": (form, info) =>
    creditAddBack(form, info) ?? unsupported(LINE_8A_WITHOUT_CREDIT),
  "4.page2.interest_8e_additions": (form, info) => {
    const line8a = creditAddBack(form, info);
    if (line8a === undefined) return unsupported(LINE_8E_WITHOUT_CREDIT);
    const otherRows = [
      form["4.page2.interest_8b_federal"],
      form["4.page2.interest_8c_federal"],
    ].some((amount) => numberOrBlank(amount) !== undefined);
    return otherRows ? unsupported(LINE_8E_WITH_OTHER_ROWS) : line8a;
  },
};
