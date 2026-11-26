/*
 * Where Form 3800's credit goes: line 38 "Individuals. Schedule 3 (Form 1040),
 * line 6a" (irs-3800-face-2025::sec::face-part-ii-2::b04;
 * irs-1040-inst-2025::sec::line-6a::b01). Form 8801 line 22 subtracts it too.
 */

import { isGap, type Cell } from "./cells.js";
import { form3800Of } from "./form.js";
import type { Accessor, Form3800Info } from "./tax.js";

/*
 * Schedule 3 line 6a: line 38, or the gap that holds it. Undefined when Form
 * 3800 does not file (Schedule 3 keeps its old reason), and while it waits.
 */
export function line6aFrom3800(form: Accessor, info: Form3800Info): { value: Cell } | undefined {
  if (info.mustFile?.["form-3800"]?.value !== true) return undefined;
  const result = form3800Of(form, info);
  if (result === undefined) return { value: undefined };
  return { value: result.taxGap ?? result.c.line38 };
}

/* Why Schedule 3 line 6a is an engine gap, for a total that subtracts it (Form 8801 line 22). */
export function generalBusinessCreditGap(form: Accessor, info: Form3800Info): string | undefined {
  const value = line6aFrom3800(form, info)?.value;
  return isGap(value) ? `Schedule 3 line 6a (Form 3800): ${value.reason}` : undefined;
}
