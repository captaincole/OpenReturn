/*
 * Form 6765 Section D for an individual: lines 33a to 36. "Before completing
 * this section, you must complete Form 3800 if you are a qualified small
 * business other than a partnership or an S corporation"
 * (irs-6765-inst-2025::sec::section-d-qualified-small-business::b01): line 35
 * reads Form 3800 through the worksheet in the instructions.
 */

import { numberOrBlank } from "../../money.js";
import type { Unsupported } from "../../types.js";
import { firstGap, isGap, type Cell } from "../3800/cells.js";
import { asCell } from "./cells.js";
import type { PayrollLines } from "./figures.js";
import type { Form6765FilingInfo } from "./filingInfo.js";
import { carryforwardWorksheet, line36Of } from "./lines.js";

type Accessor = { readonly [fieldId: string]: unknown };

/* The Form 3800 fields the worksheet reads (Part I lines 5 and 6, Part II lines 25, 35, 36 and 38). */
const FORM_3800 = {
  partILine5: "form-3800.0.line.5_carrybacks_from_2026",
  partILine6: "form-3800.0.line.6_total_credits_not_allowed_tmt",
  partIILine25: "form-3800.1.line.25_add_lines_22_and_24",
  partIILine35: "form-3800.1.line.35_specified_credit_carryback",
  partIILine36: "form-3800.1.line.36_add_lines_30_33_34_35",
  partIILine38: "form-3800.1.line.38_credit_allowed_current_year",
} as const;

/* Section D's lines, or its gap; undefined without the election. */
export function payrollOf(info: Form6765FilingInfo): PayrollLines | Unsupported | undefined {
  return asCell(info.researchCredit?.figures.payroll);
}

/* Lines 33a and 33b: checked with the election, unchecked without it once the form files. */
export function payrollBox(
  info: Form6765FilingInfo,
  pick: (lines: PayrollLines) => boolean,
): boolean | Unsupported | undefined {
  if (info.researchCredit === undefined) return undefined;
  const payroll = payrollOf(info);
  if (payroll === undefined) return false;
  return isGap(payroll) ? payroll : pick(payroll);
}

/*
 * Line 35: "Use the worksheet to figure the general business credit
 * carryforward for the current year" (irs-6765-inst-2025::sec::line-35::b01;
 * the worksheet is in line-44::b01, ::b02). With no Form 3800 there is no
 * credit to carry: 0. It waits for Form 3800 line 38.
 */
export function line35Value(form: Accessor, info: Form6765FilingInfo): Cell {
  const payroll = payrollOf(info);
  if (payroll === undefined || isGap(payroll)) return payroll;
  if (info.mustFile?.["form-3800"]?.value !== true) return 0;
  const read = Object.fromEntries(
    Object.entries(FORM_3800).map(([name, fieldId]) => [name, form[fieldId]]),
  );
  const gap = firstGap(Object.values(read) as Cell[]);
  if (gap) return gap;
  if (numberOrBlank(read.partIILine38) === undefined) return undefined;
  return carryforwardWorksheet({
    partILine5: numberOrBlank(read.partILine5),
    partILine6: numberOrBlank(read.partILine6),
    partIILine25: numberOrBlank(read.partIILine25),
    partIILine35: numberOrBlank(read.partIILine35),
    partIILine36: numberOrBlank(read.partIILine36),
    partIILine38: numberOrBlank(read.partIILine38),
  });
}

/* Line 36: "All others, enter the smallest of line 28, line 34, or line 35". */
export function line36Value(form: Accessor, info: Form6765FilingInfo): Cell {
  const payroll = payrollOf(info);
  if (payroll === undefined || isGap(payroll)) return payroll;
  const line28 = asCell(info.researchCredit?.figures.line28);
  const line35 = line35Value(form, info);
  if (isGap(line28)) return line28;
  if (isGap(line35)) return line35;
  if (line35 === undefined) return undefined;
  return line36Of(line28 ?? 0, payroll.line34, line35);
}
