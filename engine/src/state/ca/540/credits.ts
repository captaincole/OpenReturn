/*
 * Form 540 lines 40, 43, 47 and 48: the special credits. Only line 40 (FTB
 * 3506) and line 43 (FTB 3510) have rules; lines 44 to 46 stay unsupported in
 * bindings.ts and read as blank.
 */

import { atLeast, numberOrBlank, sum, sumOrBlank } from "../../../money.js";
import type { Form540FilingInfo } from "./filingInfo.js";
import type { Form540Form, Form540Line } from "./form540Binding.js";

const files3506 = (info: Form540FilingInfo) => info.mustFile?.["form-3506"]?.value === true;
const ftb3506Credit = (form: Form540Form) =>
  numberOrBlank(form["form-3506.0.line.12_child_dependent_care_credit"]);

const CREDIT_LINES = [
  "line.40_child_dependent_care_credit",
  "line.43_credit_amount",
  "line.44_credit_amount",
  "line.45_schedule_p_credits",
  "line.46_renters_credit",
] as const;

/*
 * FTB 3506 line 12 (ca-540-inst-2025::sec::line-40-nonrefundable-child-and-dependent-care-expenses-credit-code-232::b01).
 * With Schedule P (540) completed, the credit it allows: Section A1 line 5
 * column (b) (ca-540-sched-p-inst-2025::sec::how-to-claim-your-credits::b01).
 * Blank with no credit.
 */
export const line40ChildDependentCareCredit: Form540Line<"line.40_child_dependent_care_credit"> = (
  form,
  info,
) => {
  const credit = ftb3506Credit(form);
  if (credit === undefined || credit <= 0) return undefined;
  if (info.mustFile?.["schedule-p"]?.value !== true) return credit;
  return numberOrBlank(form["schedule-p.1.part3.5_child_dependent_care_credit_col_b"]);
};

/*
 * Line 43, the credit for prior year AMT, code 188 (the Credit Table,
 * ca-540-sched-p-inst-2025::sec::credit-table::b01): the amount from Schedule
 * P (540) line 10 column (b), "If you claim one or two other credits"
 * (ca-540-sched-p-inst-2025::sec::how-to-claim-your-credits::b01). It is the
 * only other credit the engine figures, so it takes line 43. Blank with none used.
 * The Credit Table's name, "Prior Year Alternative Minimum Tax", does not fit the
 * printed box, so the name is shortened; the code names the credit.
 */
const PRIOR_YEAR_AMT_CREDIT_NAME = "Prior Year AMT";
const PRIOR_YEAR_AMT_CREDIT_CODE = "188";

const priorYearAmtCreditUsed = (form: Form540Form) =>
  numberOrBlank(form["schedule-p.2.part3.10_prior_year_amt_credit_used_col_b"]);

function claimsPriorYearAmtCredit(form: Form540Form): boolean {
  const used = priorYearAmtCreditUsed(form);
  return used !== undefined && used > 0;
}

export const line43CreditName: Form540Line<"line.43_credit_name"> = (form) =>
  claimsPriorYearAmtCredit(form) ? PRIOR_YEAR_AMT_CREDIT_NAME : undefined;
export const line43CreditCode: Form540Line<"line.43_credit_code"> = (form) =>
  claimsPriorYearAmtCredit(form) ? PRIOR_YEAR_AMT_CREDIT_CODE : undefined;
export const line43CreditAmount: Form540Line<"line.43_credit_amount"> = (form) =>
  claimsPriorYearAmtCredit(form) ? priorYearAmtCreditUsed(form) : undefined;

/*
 * With FTB 3510 filed, its credit waits while line 32 waits, or while a line
 * 32 above 0 has no Schedule P column (b) yet.
 */
function priorYearAmtCreditWaits(form: Form540Form, info: Form540FilingInfo): boolean {
  if (info.mustFile?.["form-3510"]?.value !== true) return false;
  const available = numberOrBlank(form["form-3510.0.line.32_combine_lines_30_and_31"]);
  if (available === undefined) return true;
  return available > 0 && priorYearAmtCreditUsed(form) === undefined;
}

/*
 * "Add line 40 through line 46" (the form). With FTB 3506 filed, the total
 * waits while its credit, or Schedule P's share of it, waits; so with FTB 3510.
 */
export const line47TotalCredits: Form540Line<"line.47_total_credits"> = (form, info) => {
  const credits = CREDIT_LINES.map((id) => form[id]);
  if (priorYearAmtCreditWaits(form, info)) return undefined;
  if (!files3506(info)) return sumOrBlank(...credits);
  const credit = ftb3506Credit(form);
  if (credit === undefined) return undefined;
  if (credit > 0 && form["line.40_child_dependent_care_credit"] === undefined) return undefined;
  return sum(...credits);
};

// ca-540-inst-2025::sec::line-48::b01: line 35 less line 47, not less than 0.
export const line48TaxAfterCredits: Form540Line<"line.48_tax_after_credits"> = (form, info) => {
  const tax = form["line.35_total_tax_after_credits"];
  if (typeof tax !== "number") return undefined;
  const credits = form["line.47_total_credits"];
  if (files3506(info) && credits === undefined) return undefined;
  if (priorYearAmtCreditWaits(form, info)) return undefined;
  return atLeast(0, sum(tax, credits === undefined ? 0 : -credits));
};
