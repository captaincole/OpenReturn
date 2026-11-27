/*
 * MANUAL EDIT: Schedule CA (540) line 8z column C for income a U.S. treaty
 * exempts. California does not follow the treaty: "If a tax treaty exemption is
 * claimed on federal Schedule 1 (Form 1040), Additional Income and Adjustments
 * to Income, line 8z, enter that amount on Schedule CA (540), Part I or
 * Schedule CA (540NR), Part II, line 8z, column C as a positive number, unless
 * that amount is specifically exempted for California purposes"
 * (ftb-pub-1001-2025::sec::enter-on-schedule-ca-540-part-i-or-12::b04).
 *
 * A treaty exemption is a Schedule 1 line 8z item below 0: Pub. 519 puts exempt
 * income "in parentheses, on Schedule 1 (Form 1040), line 8z"
 * (irs-pub-519-2025::sec::general-rule-for-resident-aliens::b02), and the
 * engine expects no other line 8z item below 0 (federal/8833/QUESTIONS.md,
 * item 10). The engine does not
 * test the "specifically exempted for California purposes" exception.
 *
 * Column C prints the amount only when the treaty items are all of line 8z
 * column A; with another line 8z item, whose California rule is not modeled,
 * the line is a gap. Line 9a column C then adds the rows, as for a trust
 * amount (trustDistribution.ts).
 */

import type { BindingFn, FormAccessor } from "../../../defineForm.js";
import type { Schedule1FilingInfo } from "../../../federal/schedule-1/filingInfo.js";
import { numberOrBlank, roundDollars, sum, sumOrBlank } from "../../../money.js";
import { unsupported } from "../../../types.js";
import type { Info as Form3461Info } from "../3461/figures.js";
import { OTHER_INCOME_ADDITIONS } from "./childIncome.js";
import type { ScheduleCaFilingInfo } from "./filingInfo.js";
import { trustDistributionBindings } from "./trustDistribution.js";
import type { ScheduleCa } from "./types.js";

type Info = ScheduleCaFilingInfo & Form3461Info & Pick<Schedule1FilingInfo, "otherIncomeItems">;
type Bindings = Partial<{ [K in keyof ScheduleCa]: BindingFn<ScheduleCa, Info, K> }>;
type Form = FormAccessor<ScheduleCa>;

const MIXED_LINE_8Z_GAP =
  "Schedule 1 line 8z holds a treaty exemption (an item below 0) and another item: California adds the treaty exemption back in column C, and the other item's California rule is not modeled.";

/* The treaty exemptions on Schedule 1 line 8z, as one positive amount; undefined when there are none. */
export function treatyExemptionAddBack(info: Pick<Info, "otherIncomeItems">): number | undefined {
  const exempt = (info.otherIncomeItems ?? []).filter((item) => item.amount < 0);
  if (exempt.length === 0) return undefined;
  return roundDollars(-sum(...exempt.map((item) => item.amount)));
}

/* Line 8z column C: the treaty add-back when the treaty items are all of column A, else a gap. */
function line8zColumnC(form: Form, info: Info) {
  const base = trustDistributionBindings["1.line.b8z_additions"]!(form, info);
  const addBack = treatyExemptionAddBack(info);
  if (addBack === undefined) return base;
  const columnA = sum(numberOrBlank(form["1.line.b8z_federal"]));
  const onlyTreatyItems =
    columnA === -addBack &&
    info.childIncomeLine8z === undefined &&
    info.form5870AScheduleCaAddition === undefined;
  return onlyTreatyItems ? addBack : unsupported(MIXED_LINE_8Z_GAP);
}

export const treatyExemptionBindings: Bindings = {
  "1.line.b8z_additions": line8zColumnC,
  // Line 9a column C: with a treaty add-back on line 8z, the column's rows added (a gap row counts 0, as in trustDistribution.ts).
  "2.line.b9a_additions": (form, info) => {
    const base = trustDistributionBindings["2.line.b9a_additions"]!(form, info);
    if (treatyExemptionAddBack(info) === undefined) return base;
    if (numberOrBlank(form["1.line.b8z_additions"]) === undefined) return base;
    return sumOrBlank(...OTHER_INCOME_ADDITIONS.map((id) => form[id]));
  },
};
