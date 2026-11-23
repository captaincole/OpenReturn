/*
 * MANUAL EDIT: the Form 1040 lines that take Form 8814 amounts. With no Form
 * 8814 each line is what it was (federal/8814/totals.ts withForm8814).
 */

import type { FormAccessor } from "../../defineForm.js";
import { numberOrBlank, roundDollars } from "../../money.js";
import { figuredForm8814, withForm8814 } from "../8814/totals.js";
import { roundedWithReceived } from "../passThrough/receipts.js";
import type { Form1040FilingInfo } from "./filingInfo.js";
import type { Form1040 } from "./types.js";

type Form = FormAccessor<Form1040>;

/*
 * Line 3a: qualified dividends, a K-1's qualified dividends
 * (irs-1041k1-inst-2025::sec::box-2b-qualified-dividends::b01), plus each Form
 * 8814 line 9, not its line 2b (irs-8814-inst-2025::sec::line-2b::b01,
 * ::line-9::b01, ::line-3::b06; irs-1040-inst-2025::sec::line-3a::b01). Line
 * 16's worksheet line 2 reads it.
 */
export function line3a(info: Form1040FilingInfo) {
  const own = roundedWithReceived(info.qualifiedDividends, info.passThroughQualifiedDividends);
  if (typeof own === "object") return own;
  return withForm8814(info.form8814Totals, own, (figured) => figured.line9);
}

/*
 * Line 3b: Schedule B line 6 when Schedule B files, whose line 5 lists each
 * K-1's dividends and each Form 8814 line 9 (::line-9::b01); otherwise the
 * ordinary dividends, a K-1's (irs-1041k1-inst-2025::sec::box-2a-ordinary-dividends::b01),
 * plus line 9 (irs-1040-inst-2025::sec::line-3b::b01).
 */
export function line3b(form: Form, info: Form1040FilingInfo) {
  const scheduleB = numberOrBlank(form["schedule-b.0.line.6_total_ordinary_dividends"]);
  if (scheduleB !== undefined) return withForm8814(info.form8814Totals, scheduleB, () => 0);
  const own = roundedWithReceived(info.ordinaryDividends, info.passThroughOrdinaryDividends);
  if (typeof own === "object") return own;
  return withForm8814(info.form8814Totals, own, (figured) => figured.line9);
}

/* Line 3c boxes 1 and 2: the child's qualified dividends (line 9) are in lines 3a and 3b. */
export const childDividendsIncluded = (_: unknown, info: Form1040FilingInfo) =>
  (figuredForm8814(info.form8814Totals)?.line9 ?? 0) > 0 ? true : undefined;

/*
 * Form 8814 line 10 on line 7a: only without Schedule D, which otherwise takes
 * it on line 13 (::line-10::b01, ::line-3::b01). Undefined when none.
 */
function childGainOnLine7a(info: Form1040FilingInfo): number | undefined {
  if (info.mustFile?.["schedule-d"]?.value !== false) return undefined;
  return childGainInLine7a(info);
}

/*
 * The child's capital gain in line 7a's total, on either path: directly, or
 * through Schedule D line 13 (irs-1040-inst-2025::sec::line-7b::b01: "If you
 * are including your child's capital gain or (loss) in the total on line 7a").
 */
function childGainInLine7a(info: Form1040FilingInfo): number | undefined {
  const line10 = figuredForm8814(info.form8814Totals)?.line10 ?? 0;
  return line10 > 0 ? line10 : undefined;
}

/* Line 7a without Schedule D: Exception 1's capital gain distributions, plus Form 8814 line 10. */
export function line7aWithoutScheduleD(info: Form1040FilingInfo) {
  const own = roundDollars(info.capitalGainDistributionsNoScheduleD);
  if (info.mustFile?.["schedule-d"]?.value !== false) return own;
  return withForm8814(info.form8814Totals, own, (figured) => figured.line10);
}

export const line7bBindings = {
  // irs-1040-inst-2025::sec::line-7b::b01: Exception 1 applies; the child's distributions count as capital gain distributions.
  "line.7b_schedule_d_not_required": (_: unknown, info: Form1040FilingInfo) =>
    info.capitalGainDistributionsNoScheduleD !== undefined || childGainOnLine7a(info) !== undefined
      ? true
      : undefined,
  // ::line-7b::b01: the child's capital gain is in line 7a: check the box and enter Form 8814 line 10.
  "line.7b_includes_childs_capital_gain": (_: unknown, info: Form1040FilingInfo) =>
    childGainInLine7a(info) === undefined ? undefined : true,
  "line.7b_childs_capital_gain_amount": (_: unknown, info: Form1040FilingInfo) =>
    childGainInLine7a(info),
};

/*
 * Line 16 adds each Form 8814 line 15 once, after the tax on taxable income
 * (irs-1040-inst-2025::sec::line-16::b01, irs-8814-inst-2025::sec::line-15::b01),
 * and checks box 1.
 */
export function line16WithForm8814(info: Form1040FilingInfo, tax: number | undefined) {
  return tax === undefined
    ? undefined
    : withForm8814(info.form8814Totals, tax, (figured) => figured.line15);
}

export const line16FromForm8814 = (_: unknown, info: Form1040FilingInfo) =>
  (figuredForm8814(info.form8814Totals)?.line15 ?? 0) > 0 ? true : undefined;
