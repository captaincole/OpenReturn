/*
 * MANUAL EDIT: Schedule CA (540) lines that take FTB 3805V's deductions.
 * - Line 8a: "Enter the amount of the federal NOL included on line 8a, column
 *   A, as a positive number in column C. Get form FTB 3805V to figure the
 *   allowable California NOL" (ca-540-sched-ca-inst-2025::sec::line-8-other-income::b01).
 *   Column A copies Schedule 1 line 8a, which line 9a column A already holds
 *   in Schedule 1 line 9; column C adds it back, so California AGI never
 *   takes the federal NOL deduction and line 9b2 takes California's instead.
 * - Line 9b1 column B: "the total amount of disaster loss carryover deduction
 *   from your 2025 form FTB 3805V, Part III, line 2, column (f), as a positive
 *   number" (ca-540-sched-ca-inst-2025::sec::line-9b1-disaster-loss-deduction-from-form-ftb-3805v::b01).
 * - Line 9b2 column B: "the total allowable California NOL carryover deduction
 *   for the current year from form FTB 3805V, Part III, line 2, column (f)"
 *   (::line-9b2-nol-deduction-from-form-ftb-3805v::b01).
 * Each is figured from FTB 3805V's Part III (state/ca/3805v/figures.ts), so the
 * schedule and the form cannot disagree. Blank when FTB 3805V does not file or
 * no carryover is used.
 * - Line 9b3 column B: FTB 3805Z's EZ NOL deduction (below).
 */

import type { BindingFn } from "../../../defineForm.js";
import { numberOrBlank } from "../../../money.js";
import { unsupported } from "../../../types.js";
import { isUnsupportedResult } from "../3801/context.js";
import { carryoverDeductions, type Info as Form3805VInfo } from "../3805v/figures.js";
import type { PriorYearLines } from "../3805v/partIII.js";
import { files3805Z } from "../3805z/creditUsed.js";
import {
  enterpriseZoneReturnGap,
  nolFiguresOf,
  type Info as Form3805ZInfo,
} from "../3805z/figures.js";
import type { ScheduleCaFilingInfo } from "./filingInfo.js";
import type { ScheduleCa } from "./types.js";

type Info = ScheduleCaFilingInfo & Form3805VInfo & Form3805ZInfo;
type Bindings = Partial<{ [K in keyof ScheduleCa]: BindingFn<ScheduleCa, Info, K> }>;

function deduction(pick: (lines: PriorYearLines) => number) {
  return (form: Record<string, unknown>, info: Info) => {
    const lines = carryoverDeductions(form, info);
    if (lines === undefined || isUnsupportedResult(lines)) return lines;
    const used = pick(lines);
    return used > 0 ? used : undefined;
  };
}

/* Schedule 1 line 8a, the federal NOL deduction; blank when it is blank or 0. */
function federalNol(form: Record<string, unknown>): number | undefined {
  const amount = numberOrBlank(form["schedule-1.0.line.8a"]);
  return amount === 0 ? undefined : amount;
}

/* With no FTB 3805Z: main's reason, word for word (FTB 3807 and FTB 3809 have no rules). */
const LINE_9B3_UNSUPPORTED = unsupported(
  "CA-specific NOL deduction from FTB Forms 3805Z, 3807, or 3809 — no ingestion path for these FTB enterprise-zone NOL forms exists yet.",
);

/*
 * Line 9b3 column B: "Enter this amount [FTB 3805Z line 3b] on Schedule CA
 * (540), Part I, Section B, line 9b3, column B" (the FTB 3805Z form face;
 * ca-3805z-booklet-2025::sec::form-540-and-form-540nr-filers::b04). Read from
 * FTB 3805Z's Worksheet II (3805z/figures.ts); blank when it deducts nothing.
 */
function enterpriseZoneNolDeduction(form: Record<string, unknown>, info: Info) {
  if (!files3805Z(info)) return LINE_9B3_UNSUPPORTED;
  const gap = enterpriseZoneReturnGap(info);
  if (gap !== undefined) return gap;
  const worksheet = nolFiguresOf(form, info);
  if (worksheet === undefined || isUnsupportedResult(worksheet)) return worksheet;
  return worksheet.totalDeducted > 0 ? worksheet.totalDeducted : undefined;
}

export const nolDeductionBindings: Bindings = {
  "1.line.b8a_federal": (form) => federalNol(form),
  "1.line.b8a_additions": (form) => federalNol(form),
  "2.line.b9b1_subtractions": deduction((lines) => lines.disasterUsed),
  "2.line.b9b2_subtractions": deduction((lines) => lines.nolUsed),
  "2.line.b9b3_subtractions": enterpriseZoneNolDeduction,
};
