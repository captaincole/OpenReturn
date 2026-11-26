/*
 * MANUAL EDIT: Schedule CA (540) lines that take FTB 3461's results.
 * - Line 8p column B: "the amount of the federal excess business loss
 *   adjustment included on line 8p, column A"; column C: "the amount from form
 *   FTB 3461, line 16 or line 17, whichever applies"
 *   (ca-540-sched-ca-inst-2025::sec::line-8-other-income::b04).
 * - Line 8z column B: the excess business loss carryover used this year, with
 *   "excess business losses carryover from prior years" written on line 8z
 *   (::line-8-other-income::b13; ca-3461-inst-2025::sec::line-14b::b01,
 *   ::line-15::b01).
 * - Line 9a column C adds line 8p column C.
 * Each is figured from FTB 3461's lines (state/ca/3461/figures.ts), so the
 * schedule and the form cannot disagree.
 */

import type { BindingFn, FormAccessor } from "../../../defineForm.js";
import { numberOrBlank, sumOrBlank } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import { form3461Lines, type Info as Form3461Info } from "../3461/figures.js";
import { carryoverUsed, line8pAdjustment } from "../3461/lines.js";
import { isUnsupportedResult } from "../3801/context.js";
import { childIncomeBindings, OTHER_INCOME_ADDITIONS } from "./childIncome.js";
import type { ScheduleCaFilingInfo } from "./filingInfo.js";
import type { ScheduleCa } from "./types.js";

type Info = ScheduleCaFilingInfo & Form3461Info;
type Bindings = Partial<{ [K in keyof ScheduleCa]: BindingFn<ScheduleCa, Info, K> }>;
type Form = FormAccessor<ScheduleCa>;

const NOT_FILED_GAP =
  "Schedule 1 line 8p holds a federal excess business loss adjustment and FTB 3461 does not file (decisions.scope.must_file_3461), so the California adjustment is not known.";
/* The label FTB asks for on line 8z (::line-8-other-income::b13). */
export const CARRYOVER_LABEL = "excess business losses carryover from prior years";

const files3461 = (info: Info) => info.mustFile?.["form-3461"]?.value === true;
const federalLine8p = (form: Form) => {
  const amount = numberOrBlank(form["schedule-1.0.line.8p"]);
  return amount === 0 ? undefined : amount;
};

/* Line 8p column C: FTB 3461 line 16 or 17; the gap, or undefined for no adjustment or while it waits. */
export function line8pColumnC(form: Form, info: Info): number | Unsupported | undefined {
  if (!files3461(info))
    return federalLine8p(form) === undefined ? undefined : unsupported(NOT_FILED_GAP);
  const lines = form3461Lines(form, info);
  if (lines === undefined || isUnsupportedResult(lines)) return lines;
  if (!lines.carryoverKnown || lines.line17Waits) return undefined;
  const figures = info.form3461;
  return line8pAdjustment(lines.line16, figures?.carryover ?? 0, figures?.priorAdjustments ?? 0);
}

/* Line 8p column B: column A, which prints only with column C (alone it would drop the add-back). */
function line8pColumnB(form: Form, info: Info) {
  const federal = federalLine8p(form);
  if (federal === undefined) return undefined;
  const columnC = line8pColumnC(form, info);
  if (isUnsupportedResult(columnC)) {
    return unsupported(`Column B prints only with column C, which is unknown: ${columnC.reason}`);
  }
  return federal;
}

/* The carryover used on line 8z column B; 0 with none, the gap, or undefined while it waits. */
function carryoverDeduction(form: Form, info: Info): number | Unsupported | undefined {
  const figures = info.form3461;
  if (!files3461(info) || (figures?.carryover ?? 0) <= 0) return 0;
  const lines = form3461Lines(form, info);
  if (lines === undefined || isUnsupportedResult(lines)) return lines;
  return carryoverUsed(lines.line14a, figures?.carryover ?? 0, lines.line15);
}

/*
 * Line 8z column B: the child's amount (childIncome.ts) plus the carryover
 * used. With no child's amount and no other line 8z item, the carryover alone.
 */
function line8zColumnB(form: Form, info: Info) {
  const used = carryoverDeduction(form, info);
  const base = childIncomeBindings["1.line.b8z_subtractions"]!(form, info);
  if (used === 0) return base;
  if (used === undefined || isUnsupportedResult(used)) return used;
  if (typeof base === "number") return base + used;
  const alone = info.childIncomeLine8z === undefined && !numberOrBlank(form["1.line.b8z_federal"]);
  if (isUnsupportedResult(base) && !alone) return base;
  return used;
}

export const excessBusinessLossBindings: Bindings = {
  "1.line.b8p_subtractions": line8pColumnB,
  "1.line.b8p_additions": line8pColumnC,
  "1.line.b8z_subtractions": line8zColumnB,
  "1.line.b8z_income_type": (form, info) => {
    const base = childIncomeBindings["1.line.b8z_income_type"]!(form, info);
    const used = carryoverDeduction(form, info);
    if (typeof used !== "number" || used === 0) return base;
    return typeof base === "string" ? `${base}, ${CARRYOVER_LABEL}` : CARRYOVER_LABEL;
  },
  /*
   * Line 9a column C: with a line 8p column C amount, the column's rows added (a gap row counts 0, as in column B).
   * MANUAL EDIT: the same with a line 8d column C amount, the federal Form 2555 exclusion (foreignExclusion.ts).
   */
  "2.line.b9a_additions": (form, info) => {
    const base = childIncomeBindings["2.line.b9a_additions"]!(form, info);
    const rowAmounts = [form["1.line.b8p_additions"], form["1.line.b8d_additions"]];
    if (rowAmounts.every((row) => numberOrBlank(row) === undefined)) return base;
    return sumOrBlank(...OTHER_INCOME_ADDITIONS.map((id) => form[id]));
  },
};
