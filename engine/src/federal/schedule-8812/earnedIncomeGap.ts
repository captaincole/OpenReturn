/*
 * MANUAL EDIT: Schedule 8812 line 18a's self-employment gap, for every form that
 * needs it: line 18a itself, and Form 1040 line 32, which must tell "line 27
 * waits for an answer" from "line 27 is an engine gap". Lines are read by full
 * field id, so any form's accessor works.
 */

import type { FormAccessor } from "../../defineForm.js";
import { numberOrBlank, sum } from "../../money.js";
import type { EicLineSlot } from "../schedule-eic/eicAnswers.js";

type Lines = FormAccessor<object>;

// Line 18a, the Earned Income Chart (irs-1040s8-inst-2025::sec::earned-income-chart-line-18a::b01).
export const SELF_EMPLOYED_EARNED_INCOME =
  "With self-employment, line 18a needs the Earned Income Worksheet, which is not modeled, or EIC Worksheet B line 4b, which this line does not read.";

// A business, or Schedule SE: the chart sends the filer to a worksheet that is not drafted.
export function selfEmployedForLine18a(form: Lines, info: EicLineSlot): boolean {
  return (
    info.earnedIncomeCredit?.selfEmployed === true ||
    numberOrBlank(form["schedule-c.0.line.31"]) !== undefined ||
    numberOrBlank(form["schedule-se.0.line.3"]) !== undefined
  );
}

// Line 18a's gap once Part II-A is open (line 16b more than zero); undefined otherwise.
export function schedule8812Line18aGap(form: Lines, info: EicLineSlot): string | undefined {
  if (sum(form["schedule-8812.1.line.16b_qualifying_children_times_1700"]) <= 0) return undefined;
  return selfEmployedForLine18a(form, info) ? SELF_EMPLOYED_EARNED_INCOME : undefined;
}
