/*
 * Where Form 8864 line 9 goes besides Form 3800: the producing business's
 * Schedule C line 6 (added from the facts in facts/kinds/activitiesOnReturn.ts,
 * the DECISION below), and back out of alternative minimum taxable income on
 * Form 6251 line 3.
 *
 * DECISION (2026-11-27, by the author): which amount is income, and where.
 * Text A, the form: "9 Add lines 7 and 8. Include this amount in income for
 * your tax year" (irs-8864-face-2025::sec::face-page-1::b01), "under 'other
 * income' on the applicable line of your income tax return"
 * (irs-8864-inst-2025::sec::line-9::b01). Text B, Schedule C line 6: "Any
 * amount of credit for biodiesel, renewable diesel, and sustainable aviation
 * fuel claimed on line 11 of Form 8864" (irs-1040sc-inst-2025::sec::line-6::b01);
 * Schedule F line 8 names "line 10 of Form 8864" (irs-1040sf-inst-2025::sec::line-8::b01).
 * The engine includes line 9, the form's own line and arithmetic: lines 10 and
 * 11 add a pass-through credit that the entity's line 9 already put in its
 * income. It goes on Schedule C line 6 of the business that produced the fuel,
 * Schedule C's own instruction for its line and the "other income" line of the
 * business's return. A credit with line 10 of $500 would add $500 more to
 * Schedule C line 6 under text B.
 */

import type { BaseFilingInfo } from "../../filingInfo.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Form8864FilingInfo } from "./filingInfo.js";

const INCOME_GAP =
  "Form 8864 line 9, this business's agri-biodiesel credit, is other income here (irs-1040sc-inst-2025::sec::line-6::b01), and the engine cannot figure line 9 (see Form 8864).";

/* Schedule C line 6 of a business whose line 9 the engine cannot figure: the reason; undefined otherwise. */
export function biodieselIncomeGap(
  info: BaseFilingInfo,
  businessKey: string | undefined,
): Unsupported | undefined {
  const keys = (info as Form8864FilingInfo).form8864IncomeGapBusinessKeys;
  return businessKey !== undefined && keys?.includes(businessKey)
    ? unsupported(INCOME_GAP)
    : undefined;
}

/*
 * Form 6251 line 3, other adjustments: the negative of line 9, "this amount
 * isn't income in figuring AMT and must be subtracted when figuring your
 * alternative minimum taxable income ... on the appropriate line of: • Form
 * 6251" (irs-8864-inst-2025::sec::line-9::b01). Undefined with no line 9 income.
 */
export function amtSubtraction(info: BaseFilingInfo): number | Unsupported | undefined {
  const included = (info as Form8864FilingInfo).form8864IncomeIncluded;
  if (included === undefined) return undefined;
  return "gap" in included ? unsupported(included.gap) : -included.amount;
}
