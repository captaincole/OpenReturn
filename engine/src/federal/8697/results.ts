/*
 * What other forms read from Form 8697. Schedule 2 line 17n: "For
 * individuals, include any interest due on the appropriate line of Schedule 2
 * (Form 1040), Part II (for example, 2025 Schedule 2 (Form 1040), Part II, line
 * 17n)" (irs-8697-inst-2025::sec::filing-instructions::b01): Part I line 10 or
 * Part II line 11. Interest to be refunded is claimed on the form itself, filed
 * separately (::if-interest-is-to-be-refunded-to-you::b01), so it adds nothing.
 */

import { unsupported, type Unsupported } from "../../types.js";
import type { Form8697FilingInfo } from "./filingInfo.js";

/* Line 17n's reason with no Form 8697: Form 8866 (section 167(g)) is the line's other source. */
export const NO_LOOK_BACK_FORM =
  "No Form 8697 files, and Form 8866 (look-back interest under the income forecast method) is not modeled.";

/* Schedule 2 line 17n: the net interest owed; blank while the form waits for its fact or owes none. */
export function lookBackInterestForSchedule2(
  info: Form8697FilingInfo,
): number | Unsupported | undefined {
  if (info.mustFile?.["form-8697"]?.value !== true) return unsupported(NO_LOOK_BACK_FORM);
  const plan = info.form8697;
  if (plan === undefined) return undefined;
  if (plan.gap !== undefined) return unsupported(plan.gap);
  if (plan.interestGap !== undefined) return unsupported(plan.interestGap);
  return plan.totals?.net.owed;
}
