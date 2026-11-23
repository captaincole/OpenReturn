/*
 * MANUAL EDIT: Form 6251 lines 8, 9 and 10 with the regular foreign tax credit
 * (Schedule 3 line 1) computed. Read by full field id.
 */

import { atLeast, numberOrBlank, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { claimsByElection, foreignTaxCredit } from "../1116/credit.js";
import { isGap } from "../1116/lines.js";
import type { Form6251FilingInfo } from "./filingInfo.js";

type Accessor = { readonly [fieldId: string]: unknown };
type Value = number | Unsupported | undefined;

const LINE_7 = "form-6251.0.line.7_tax_on_line_6";
const LINE_10 = "form-6251.0.line.10_regular_tax_less_credits";

const AMT_COPY_GAP =
  "Form 1116 files: the AMT foreign tax credit is figured on a second set of Forms 1116 with AMT amounts (irs-6251-inst-2025::sec::line-8-alternative-minimum-tax-foreign-tax::b01), which the engine does not figure.";

/*
 * Line 10 (irs-6251-inst-2025::sec::line-10::b01–b02): Form 1040 line 16 (less
 * any Form 4972 tax) and Schedule 2 line 1z, minus Schedule 3 line 1. Form 8978
 * and Schedule J are not modeled. A gap in Schedule 3 line 1 is a gap here.
 */
export function line10Of(form: Accessor, info: Form6251FilingInfo): Value {
  const line16 = numberOrBlank(form["form-1040.line.16"]);
  if (line16 === undefined) return undefined;
  const credit = foreignTaxCredit(form, info);
  if (isGap(credit)) return credit;
  const form4972Tax = info.mustFile?.["form-4972"]?.value === true ? info.form4972Tax : 0;
  const tax = sum(
    line16,
    -sum(form4972Tax),
    form["schedule-2.0.line.1z_total_lines_1a_through_1y"],
  );
  return atLeast(0, tax - sum(credit));
}

/*
 * Line 8, the AMT foreign tax credit (line-8-alternative-minimum-tax-foreign-tax::b01, b02):
 * blank when line 10 is at least line 7, or with no foreign tax credit. With
 * the election it is the Schedule 3 line 1 amount. With Form 1116 it needs the
 * AMT Forms 1116: a gap.
 */
export function line8Of(form: Accessor, info: Form6251FilingInfo): Value {
  const line7 = numberOrBlank(form[LINE_7]);
  const line10 = numberOrBlank(form[LINE_10]);
  if (line7 === undefined || line10 === undefined || line10 >= line7) return undefined;
  const credit = foreignTaxCredit(form, info);
  if (credit === undefined || isGap(credit)) return credit;
  if (claimsByElection(info)) return credit;
  return unsupported(AMT_COPY_GAP);
}

/* Line 9: line 7 minus line 8; a gap in line 8 is a gap here. */
export function line9Of(form: Accessor, info: Form6251FilingInfo): Value {
  const line7 = numberOrBlank(form[LINE_7]);
  if (line7 === undefined) return undefined;
  const line8 = line8Of(form, info);
  return isGap(line8) ? line8 : line7 - sum(line8);
}

/* Line 11: a zero line 9 enters -0-; else line 9 minus line 10, at least 0. */
export function line11Of(form: Accessor, info: Form6251FilingInfo): Value {
  const line9 = line9Of(form, info);
  if (line9 === 0) return 0;
  if (isGap(line9) || line9 === undefined) return line9;
  const line10 = line10Of(form, info);
  if (isGap(line10)) return line10;
  return line10 === undefined ? undefined : atLeast(0, line9 - line10);
}
