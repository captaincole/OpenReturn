/*
 * Schedule CA (540) Part I line 12, certain business expenses of reservists,
 * performing artists and fee-basis government officials. Column A copies
 * federal Schedule 1 line 12. "If claiming a depreciation deduction as an
 * unreimbursed employee business expense on federal Form 2106 ..., you may have
 * an adjustment in column B or column C. For more information, get FTB Pub.
 * 1001." (ca-540-sched-ca-inst-2025::sec::line-11-through-line-25::b01). With no
 * Form 2106 depreciation there is no adjustment; with it, the California
 * depreciation is not figured.
 */

import type { FormAccessor } from "../../../defineForm.js";
import { numberOrBlank } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import type { ScheduleCaFilingInfo } from "./filingInfo.js";
import type { ScheduleCa } from "./types.js";

const CA_DEPRECIATION =
  "Form 2106 claims vehicle depreciation: California's section 179 limit and its nonconformity to the special depreciation allowance can make a column B or C adjustment (FTB Pub. 1001), which the engine does not figure.";

export function line12Federal(
  form: FormAccessor<ScheduleCa>,
  info: ScheduleCaFilingInfo,
): number | Unsupported | undefined {
  if (info.form2106TotalsGap) return unsupported(info.form2106TotalsGap);
  const amount = numberOrBlank(form["schedule-1.1.line.12"]);
  return amount ? amount : undefined;
}

/* Columns B and C: blank with no Form 2106 depreciation; unsupported with it. */
export function line12Adjustment(
  form: FormAccessor<ScheduleCa>,
  info: ScheduleCaFilingInfo,
): Unsupported | undefined {
  if (info.form2106TotalsGap) return unsupported(info.form2106TotalsGap);
  if (numberOrBlank(form["schedule-1.1.line.12"]) === undefined) return undefined;
  return info.form2106Totals?.depreciation ? unsupported(CA_DEPRECIATION) : undefined;
}
