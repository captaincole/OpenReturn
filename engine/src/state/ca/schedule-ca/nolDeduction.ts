/*
 * MANUAL EDIT: Schedule CA (540) lines that take FTB 3805V's deductions.
 * - Line 9b1 column B: "the total amount of disaster loss carryover deduction
 *   from your 2025 form FTB 3805V, Part III, line 2, column (f), as a positive
 *   number" (ca-540-sched-ca-inst-2025::sec::line-9b1-disaster-loss-deduction-from-form-ftb-3805v::b01).
 * - Line 9b2 column B: "the total allowable California NOL carryover deduction
 *   for the current year from form FTB 3805V, Part III, line 2, column (f)"
 *   (::line-9b2-nol-deduction-from-form-ftb-3805v::b01).
 * Each is figured from FTB 3805V's Part III (state/ca/3805v/figures.ts), so the
 * schedule and the form cannot disagree. Blank when FTB 3805V does not file or
 * no carryover is used.
 */

import type { BindingFn } from "../../../defineForm.js";
import { isUnsupportedResult } from "../3801/context.js";
import { carryoverDeductions, type Info as Form3805VInfo } from "../3805v/figures.js";
import type { PriorYearLines } from "../3805v/partIII.js";
import type { ScheduleCaFilingInfo } from "./filingInfo.js";
import type { ScheduleCa } from "./types.js";

type Info = ScheduleCaFilingInfo & Form3805VInfo;
type Bindings = Partial<{ [K in keyof ScheduleCa]: BindingFn<ScheduleCa, Info, K> }>;

function deduction(pick: (lines: PriorYearLines) => number) {
  return (form: Record<string, unknown>, info: Info) => {
    const lines = carryoverDeductions(form, info);
    if (lines === undefined || isUnsupportedResult(lines)) return lines;
    const used = pick(lines);
    return used > 0 ? used : undefined;
  };
}

export const nolDeductionBindings: Bindings = {
  "2.line.b9b1_subtractions": deduction((lines) => lines.disasterUsed),
  "2.line.b9b2_subtractions": deduction((lines) => lines.nolUsed),
};
