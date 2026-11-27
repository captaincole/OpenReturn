/*
 * MANUAL EDIT: Schedule CA (540) line 8z column C for income a U.S. treaty
 * exempts. California does not follow the treaty: "If a tax treaty exemption is
 * claimed on federal Schedule 1 (Form 1040), Additional Income and Adjustments
 * to Income, line 8z, enter that amount on Schedule CA (540), Part I or
 * Schedule CA (540NR), Part II, line 8z, column C as a positive number, unless
 * that amount is specifically exempted for California purposes"
 * (ftb-pub-1001-2025::sec::enter-on-schedule-ca-540-part-i-or-12::b04).
 *
 * A treaty exemption is a Schedule 1 line 8z item with the treatyExempt mark
 * (facts/kinds/otherIncome.ts), entered below 0: Pub. 519 puts exempt income
 * "in parentheses, on Schedule 1 (Form 1040), line 8z"
 * (irs-pub-519-2025::sec::general-rule-for-resident-aliens::b02). The sign
 * alone does not make an item a treaty exemption, so an unmarked item below 0
 * makes column C a gap: its California rule is not modeled. A marked item above
 * 0 is a gap too: the add-back cannot come from an exemption entered as income.
 * A marked item of 0 changes no line and is left out. The engine does not test
 * the "specifically exempted for California purposes" exception.
 *
 * Column C prints the amount only when the treaty items are all of line 8z
 * column A; with another line 8z item, whose California rule is not modeled,
 * the line is a gap. Line 9a column C then adds the rows, as for a trust
 * amount (trustDistribution.ts), and is a gap with column C's reason.
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
type Line8zItems = Pick<Info, "otherIncomeItems">;

const MIXED_LINE_8Z_GAP =
  "Schedule 1 line 8z holds a treaty exemption (an item marked as one) and another item: California adds the treaty exemption back in column C, and the other item's California rule is not modeled.";
const UNMARKED_NEGATIVE_GAP =
  "Schedule 1 line 8z holds an item below 0 that is not marked as a treaty exemption, and California's rule for such an item is not modeled.";
const MARKED_POSITIVE_GAP =
  "Schedule 1 line 8z holds an item marked as a treaty exemption with an amount above 0, and California's add-back for it is not modeled (an exemption is entered below 0).";

/* The treaty exemptions on Schedule 1 line 8z (marked, below 0), as one positive amount; undefined when there are none. */
export function treatyExemptionAddBack(info: Line8zItems): number | undefined {
  const exempt = (info.otherIncomeItems ?? []).filter(
    (item) => item.treatyExempt === true && item.amount < 0,
  );
  if (exempt.length === 0) return undefined;
  return roundDollars(-sum(...exempt.map((item) => item.amount)));
}

/* Why line 8z column C cannot print: an unmarked item below 0, or a marked item above 0. */
export function line8zSignGap(info: Line8zItems): string | undefined {
  const items = info.otherIncomeItems ?? [];
  if (items.some((item) => item.treatyExempt !== true && item.amount < 0)) {
    return UNMARKED_NEGATIVE_GAP;
  }
  if (items.some((item) => item.treatyExempt === true && item.amount > 0)) {
    return MARKED_POSITIVE_GAP;
  }
  return undefined;
}

/* Line 8z column C: the treaty add-back when the treaty items are all of column A, else a gap. */
function line8zColumnC(form: Form, info: Info) {
  const signGap = line8zSignGap(info);
  if (signGap !== undefined) return unsupported(signGap);
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
    const signGap = line8zSignGap(info);
    if (signGap !== undefined) return unsupported(signGap);
    const base = trustDistributionBindings["2.line.b9a_additions"]!(form, info);
    if (treatyExemptionAddBack(info) === undefined) return base;
    if (numberOrBlank(form["1.line.b8z_additions"]) === undefined) return base;
    return sumOrBlank(...OTHER_INCOME_ADDITIONS.map((id) => form[id]));
  },
};
