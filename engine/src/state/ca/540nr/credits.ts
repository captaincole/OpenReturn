/*
 * Form 540NR special credits: lines 50 to 63. The credit forms are figured
 * for Form 540 only (californiaForms.ts), so a line that takes one is a named
 * gap when the return needs it. Lines 51 to 55 and 61 are unsupported in
 * bindings.ts: no fact asks whether the taxpayer qualifies.
 */

import { atLeast, sum, sumOrBlank } from "../../../money.js";
import { unsupported } from "../../../types.js";
import { gapFor, type Form540NRLine } from "./form540NRBinding.js";

/*
 * Line 50: FTB 3506's credit (ca-540nr-booklet-2025::sec::line-50-nonrefundable-child-and-dependent-care::b01).
 * A gap when the return needs FTB 3506; blank otherwise.
 */
export const line50ChildDependentCareCredit: Form540NRLine<
  "1.line.50_child_dependent_care_credit"
> = (_, info) => gapFor(info, "form-3506");

/*
 * Lines 58 to 60: the other special credits, by name and code, or Schedule P
 * (540NR) for more than two (ca-540nr-booklet-2025::sec::part-ii::b02). The
 * credit forms the engine has (FTB 3507, FTB 3510, FTB 3541, FTB 3801-CR, FTB
 * 3804-CR, Schedule S) file with Form 540 only; the others have no facts. As
 * on Form 540 lines 43 to 45, the lines are a gap: a blank could hide a
 * credit. Schedule P (540NR) has rules, but each of its credit rows takes one
 * of these forms (schedule-p-540nr/partIII.ts), so line 60 stays a gap.
 */
const OTHER_CREDIT_FORMS = [
  "form-3507",
  "form-3510",
  "form-3541",
  "form-3801-cr",
  "form-3804-cr",
  "schedule-s",
];
const OTHER_CREDITS_GAP =
  "Lines 58 to 60 take the other special credits of the Credit Chart; the engine figures none of them on Form 540NR yet.";

function otherCreditsGap(info: Parameters<typeof gapFor>[0]) {
  return gapFor(info, ...OTHER_CREDIT_FORMS) ?? unsupported(OTHER_CREDITS_GAP);
}

export const line58CreditName: Form540NRLine<"2.line.58_credit_name"> = (_, info) =>
  otherCreditsGap(info);
export const line58CreditCode: Form540NRLine<"2.line.58_credit_code"> = (_, info) =>
  otherCreditsGap(info);
export const line58CreditAmount: Form540NRLine<"2.line.58_credit_amount"> = (_, info) =>
  otherCreditsGap(info);
export const line59CreditName: Form540NRLine<"2.line.59_credit_name"> = (_, info) =>
  otherCreditsGap(info);
export const line59CreditCode: Form540NRLine<"2.line.59_credit_code"> = (_, info) =>
  otherCreditsGap(info);
export const line59CreditAmount: Form540NRLine<"2.line.59_credit_amount"> = (_, info) =>
  otherCreditsGap(info);
export const line60SchedulePCredits: Form540NRLine<"2.line.60_schedule_p_credits"> = (_, info) =>
  gapFor(info, ...OTHER_CREDIT_FORMS) ?? unsupported(OTHER_CREDITS_GAP);

/*
 * The credit forms a credit line takes. With one of them needed the credits
 * are not known, so lines 62 and 63 carry its gap.
 */
const CREDIT_FORMS = ["form-3506", ...OTHER_CREDIT_FORMS];

const CREDIT_LINES = [
  "1.line.50_child_dependent_care_credit",
  "1.line.55_credit_amount",
  "2.line.58_credit_amount",
  "2.line.59_credit_amount",
  "2.line.60_schedule_p_credits",
  "2.line.61_renters_credit",
] as const;

// Line 62: "Add line 50 and line 55 through line 61. These are your total credits" (the form).
export const line62TotalCredits: Form540NRLine<"2.line.62_total_credits"> = (form, info) =>
  gapFor(info, ...CREDIT_FORMS) ?? sumOrBlank(...CREDIT_LINES.map((line) => form[line]));

// Line 63: "Subtract line 62 from line 42. If less than zero, enter 0" (::line-63::b01).
export const line63TaxAfterCredits: Form540NRLine<"2.line.63_tax_after_credits"> = (form, info) => {
  const gap = gapFor(info, ...CREDIT_FORMS);
  if (gap) return gap;
  const tax = form["1.line.42_tax_before_special_credits"];
  if (typeof tax !== "number") return undefined;
  return atLeast(0, tax - sum(form["2.line.62_total_credits"]));
};
