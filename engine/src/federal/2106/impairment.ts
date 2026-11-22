/*
 * Schedule A line 16, impairment-related work expenses: "enter the part of the
 * line 10 amount attributable to impairment-related work expenses on Schedule A
 * (Form 1040), line 16" (irs-2106-inst-2025::sec::line-10::b04;
 * irs-pub-463-2025::sec::impairment-related-work-expenses-of::b01). The amount
 * the taxpayer states with no Form 2106 (other_itemized.impairment_related_work_expenses)
 * is added to every Form 2106's part (QUESTIONS.md).
 */

import { getEmployeeBusinessExpensesFacts } from "../../facts/index.js";
import { sumOrBlank } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { resolve2106Info } from "./resolveInfo.js";

const hasImpairmentPart = (inputs: ResolverInputs) =>
  getEmployeeBusinessExpensesFacts(inputs.facts).some(
    ({ value }) =>
      value.qualification === "impairment_related_work_expenses" ||
      (value.impairmentRelatedWorkExpenses ?? 0) > 0,
  );

export function impairmentRelatedWorkExpenses(
  inputs: ResolverInputs,
  stated: number | undefined,
): { impairmentRelatedWorkExpenses?: number; impairmentGap?: string } {
  const form2106 = resolve2106Info(inputs);
  if (form2106.form2106TotalsGap && hasImpairmentPart(inputs)) {
    return { impairmentGap: form2106.form2106TotalsGap };
  }
  const fromForms = form2106.form2106Totals?.impairment;
  return { impairmentRelatedWorkExpenses: sumOrBlank(stated, fromForms ? fromForms : undefined) };
}
