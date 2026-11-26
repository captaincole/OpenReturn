import { numberOrBlank, sumOrBlank } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Form8828FilingInfo } from "./filingInfo.js";
import { partIILines } from "./partII.js";

const LAST_LINE = 23;

type Fields = Readonly<Record<string, unknown>>;

/* Line 15 begins with "Your adjusted gross income as shown on line 11 of your Form 1040" (line-15::b01). */
export const agiOf = (form: Fields): number | undefined =>
  numberOrBlank(form["form-1040.line.11b"]);

/* Line 15 adds "Any tax-exempt interest that you received or accrued for the tax year" (line-15::b01). */
export const taxExemptInterestOf = (form: Fields): number =>
  numberOrBlank(form["form-1040.line.2a"]) ?? 0;

/*
 * Schedule 2 line 17b: "Tax. Enter the smaller of line 14 or line 22. Also,
 * include this amount on Schedule 2 (Form 1040), line 17b"
 * (irs-8828-face-2025::sec::face-part-ii::b02; irs-1040-inst-2025::sec::line-17b::b01).
 * The total of line 23 of every copy, one for each home. A copy that stops early
 * (a loss on line 13, line 17 zero or less) adds nothing. Blank when Form 8828
 * does not file, when no copy has a tax, or while a notice or Form 1040 line 11
 * waits; unsupported when any copy's line 23 is.
 */
export function recaptureTaxForSchedule2(
  form: Fields,
  info: Form8828FilingInfo,
): number | Unsupported | undefined {
  if (info.mustFile?.["form-8828"]?.value !== true) return undefined;
  const copies = info.form8828Copies ?? [];
  const gap = copies.find((lines) => lines?.gap && lines.gap.fromLine <= LAST_LINE)?.gap;
  if (gap) return unsupported(gap.reason);
  const agi = agiOf(form);
  if (agi === undefined) return undefined;
  const taxes: Array<number | undefined> = [];
  for (const lines of copies) {
    if (lines === undefined) return undefined;
    taxes.push(partIILines(lines, agi, taxExemptInterestOf(form))?.line23);
  }
  return sumOrBlank(...taxes);
}
