/*
 * Schedule CA (540) lines that take FTB 3913 results, for a non-military move:
 * line 14 column C (line 5 on Yes) and line 1h column C (line 4 − line 3 on No)
 * (ca-540-sched-ca-inst-2025::sec::line-11-through-line-25::b02;
 * ca-3913-inst-2025::sec::line-5::b01). A military move has "no California
 * adjustment". Line 26 column C adds the Section C column C lines.
 *
 * With no FTB 3913, each line keeps its earlier reason: the other items of line
 * 1h column C and of line 26 column C have no facts yet.
 */

import type { FormAccessor, FormSpec } from "../../../defineForm.js";
import { sumOrBlank } from "../../../money.js";
import { unsupported } from "../../../types.js";
import type { ScheduleCaFilingInfo } from "./filingInfo.js";
import type { ScheduleCa } from "./types.js";

type Bindings = FormSpec<ScheduleCa, ScheduleCaFilingInfo>["bindings"];

const LINE_1H_ADDITIONS_GAP =
  "CA additions for 'other earned income' (line 1h) depend on taxpayer-specific scenarios (e.g. employer HSA contributions) that have no ingested fact path yet.";
const LINE_14_ADDITIONS_GAP =
  "CA moving expense addition (for non-military taxpayers who can deduct under CA but not federal) requires FTB 3913 data — no FTB 3913 ingestion path exists yet.";
const LINE_26_ADDITIONS_GAP =
  "Line 26 col C — aggregates 11-23+25 col C; all upstream rows are unsupported.";

/* Line 1h: "Identify the type of other earned income" (ca-540-sched-ca-inst-2025::sec::h-other-earned-income::b01). */
const MOVING_EXCESS_TYPE = "FTB 3913 excess reimbursement";

/* Line 26 column C: "Add line 11 through line 23 and line 25" (line-11-through-line-25::b08). */
const SECTION_C_ADDITIONS = [
  "2.line.c12_additions",
  "2.line.c14_additions",
  "2.line.c19a_additions",
  "2.line.c20_additions",
  "2.line.c21_additions",
  "3.line.c25_additions",
] as const;

const files3913 = (info: ScheduleCaFilingInfo) => info.mustFile?.["form-3913"]?.value === true;

/* An FTB 3913 amount: unsupported with a gap, blank while a move waits for an answer. */
function fromForm3913(info: ScheduleCaFilingInfo, amount: number | undefined) {
  if (info.caMovingTotalsGap) return unsupported(info.caMovingTotalsGap);
  return info.caMovingWaits ? undefined : amount;
}

/* Line 1h type: the federal type, then the FTB 3913 excess when there is one. */
function line1hIncomeType(form: FormAccessor<ScheduleCa>, info: ScheduleCaFilingInfo) {
  const federal = form["form-1040.line.1h_type"];
  const types = [
    typeof federal === "string" ? federal : undefined,
    files3913(info) && info.caMovingReimbursementExcess !== undefined
      ? MOVING_EXCESS_TYPE
      : undefined,
  ].filter((type) => type !== undefined);
  return types.length === 0 ? undefined : types.join(", ");
}

export const movingExpenseBindings: Bindings = {
  "0.line.1h_income_type": line1hIncomeType,
  /*
   * Line 1h column C: the excess reimbursement of a non-military FTB 3913. Other
   * line 1h items have no facts, so with no excess the line keeps its reason.
   */
  "0.line.1h_additions": (_, info) => {
    if (!files3913(info)) return unsupported(LINE_1H_ADDITIONS_GAP);
    const excess = fromForm3913(info, info.caMovingReimbursementExcess);
    return excess === undefined && !info.caMovingWaits
      ? unsupported(LINE_1H_ADDITIONS_GAP)
      : excess;
  },
  // Line 14 column C holds only the FTB 3913 deduction: blank for a military move.
  "2.line.c14_additions": (_, info) =>
    files3913(info)
      ? fromForm3913(info, info.caMovingExpenseDeduction)
      : unsupported(LINE_14_ADDITIONS_GAP),
  /*
   * Line 26 column C with an FTB 3913: the column C lines the engine figures
   * (line 14, line 21); the others have no facts and read as blank, as in column B.
   */
  "3.line.c26_additions": (form, info) =>
    files3913(info)
      ? sumOrBlank(...SECTION_C_ADDITIONS.map((id) => form[id]))
      : unsupported(LINE_26_ADDITIONS_GAP),
};
