import { numberOrBlank } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Form8828FilingInfo } from "./filingInfo.js";

const LINE_23 = "form-8828.0.line.23_recapture_tax";
const LAST_LINE = 23;

/*
 * Schedule 2 line 17b: "Tax. Enter the smaller of line 14 or line 22. Also,
 * include this amount on Schedule 2 (Form 1040), line 17b"
 * (irs-8828-face-2025::sec::face-part-ii::b02; irs-1040-inst-2025::sec::line-17b::b01).
 * Blank when Form 8828 does not file, or when it stops early (a loss on line 13,
 * line 17 zero or less); unsupported when line 23 is.
 */
export function recaptureTaxForSchedule2(
  form: Readonly<Record<string, unknown>>,
  info: Form8828FilingInfo,
): number | Unsupported | undefined {
  if (info.mustFile?.["form-8828"]?.value !== true) return undefined;
  if (info.form8828Gap) return unsupported(info.form8828Gap);
  const gap = info.form8828?.gap;
  if (gap && gap.fromLine <= LAST_LINE) return unsupported(gap.reason);
  return numberOrBlank(form[LINE_23]);
}
