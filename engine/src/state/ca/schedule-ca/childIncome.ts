/*
 * MANUAL EDIT: line 8z columns B and C, and line 9a column C, for a child's
 * interest and dividends that the parents report on one return and not the
 * other, or in different amounts (FTB 3803 line 6 against Form 8814 line 6;
 * ca-3803-inst-2025::sec::line-6::b01,
 * ca-540-sched-ca-inst-2025::sec::line-8-other-income::b16). With no child's
 * income on either return the lines keep their earlier reasons. So does a
 * return whose Schedule 1 line 8z holds another item: columns B and C are
 * "the total of all individual items" (::line-8-other-income::b05), and the
 * other items' California rules are not modeled.
 */

import type { BindingFn, FormAccessor } from "../../../defineForm.js";
import { numberOrBlank, sum, sumOrBlank } from "../../../money.js";
import { unsupported } from "../../../types.js";
import type { ScheduleCaFilingInfo } from "./filingInfo.js";
import type { ScheduleCa } from "./types.js";

type Bindings = Partial<{
  [K in keyof ScheduleCa]: BindingFn<ScheduleCa, ScheduleCaFilingInfo, K>;
}>;

const LINE_8Z_SUBTRACTIONS_GAP =
  "Line 8z 'Other income' CA subtractions are catch-all adjustments (e.g. Native American earned income, state income tax refunds reclassified, etc.) that require per-item CA guidance and no structured fact path exists for the general 8z bucket.";
const LINE_8Z_ADDITIONS_GAP =
  "Line 8z 'Other income' CA additions are catch-all adjustments (e.g. expanded IRC 529 use, tribal income differences) requiring per-item CA guidance; no structured fact path exists for this bucket.";
const LINE_9A_ADDITIONS_GAP =
  "Section B line 9a col C — aggregates other-income additions we don't model yet.";
/* ::line-6::b01, last paragraph: "part or all" of the child's capital gain distributions go on Schedule D (540) instead. */
const SCHEDULE_D_GAP =
  "Schedule D (540) files and a child's capital gain distributions reach line 6 of FTB 3803 or Form 8814: the instructions move part or all of them to Schedule D (540) and do not say how much.";
/* The label FTB asks for on line 8z (ca-540-sched-ca-inst-2025::sec::line-8-other-income::b16). */
const FTB_3803_LABEL = "FTB 3803";

/*
 * Column A (Schedule 1 line 8z) holds more than the Form 8814 line 12 total: a
 * 1099-MISC box 3 amount or an item the taxpayer lists, whose column B or C
 * rule the engine does not model.
 */
const otherLine8zItems = (form: FormAccessor<ScheduleCa>, federalLine12: number) =>
  sum(numberOrBlank(form["1.line.b8z_federal"])) !== federalLine12;

/*
 * The child's line 8z adjustment, or why the line cannot print it: the
 * earlier reason with no child or with another line 8z item, "waits" while an
 * answer is missing.
 */
function childLine8z(form: FormAccessor<ScheduleCa>, info: ScheduleCaFilingInfo, noChild: string) {
  const line8z = info.childIncomeLine8z;
  if (line8z === undefined) return { gap: noChild };
  if (line8z.kind === "waits") return "waits";
  if (line8z.kind === "unsupported") return { gap: line8z.reason };
  if (line8z.childCapitalGainDistributions && info.mustFile?.["schedule-d-ca"]?.value === true) {
    return { gap: SCHEDULE_D_GAP };
  }
  if (otherLine8zItems(form, line8z.federalLine12)) return { gap: noChild };
  return line8z;
}

/* Line 8z column B or C: the child's amount, blank while it waits, or the reason it cannot print. */
function childColumn(pick: "subtraction" | "addition", noChild: string) {
  return (form: FormAccessor<ScheduleCa>, info: ScheduleCaFilingInfo) => {
    const line8z = childLine8z(form, info, noChild);
    if (line8z === "waits") return undefined;
    if ("gap" in line8z) return unsupported(line8z.gap);
    return line8z[pick];
  };
}

/* Line 9a col C: lines 8a through 8z, column C. Only line 8z has a column C rule. */
export const OTHER_INCOME_ADDITIONS = [
  "1.line.b8a_additions",
  "1.line.b8c_additions",
  "1.line.b8d_additions",
  "1.line.b8e_additions",
  "1.line.b8k_additions",
  "1.line.b8p_additions",
  "1.line.b8v_additions",
  "1.line.b8z_additions",
] as const;

/* A figured child adjustment that prints in either column. */
const childAdjustmentPrints = (info: ScheduleCaFilingInfo) => {
  const line8z = info.childIncomeLine8z;
  return line8z?.kind === "figured" && (line8z.subtraction ?? line8z.addition) !== undefined;
};

export const childIncomeBindings: Bindings = {
  "1.line.b8z_subtractions": childColumn("subtraction", LINE_8Z_SUBTRACTIONS_GAP),
  "1.line.b8z_additions": childColumn("addition", LINE_8Z_ADDITIONS_GAP),
  "2.line.b9a_additions": (form, info) => {
    const line8z = childLine8z(form, info, LINE_9A_ADDITIONS_GAP);
    if (line8z !== "waits" && "gap" in line8z) return unsupported(LINE_9A_ADDITIONS_GAP);
    return sumOrBlank(...OTHER_INCOME_ADDITIONS.map((id) => form[id]));
  },
  /*
   * Column A's description copies Schedule 1 line 8z; with a child's
   * adjustment, "write 'FTB 3803' on line 8z" (::line-8-other-income::b16).
   */
  "1.line.b8z_income_type": (form, info) => {
    const federal = form["schedule-1.0.line.8z_type"];
    const federalType = typeof federal === "string" ? federal : undefined;
    if (!childAdjustmentPrints(info)) return federalType;
    return federalType === undefined ? FTB_3803_LABEL : `${federalType}, ${FTB_3803_LABEL}`;
  },
};
