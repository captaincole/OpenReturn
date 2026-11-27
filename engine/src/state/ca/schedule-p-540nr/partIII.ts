/*
 * Schedule P (540NR) Part III, credits that reduce tax. The balance lines 3,
 * 11 and 25 and every credit row are Schedule P (540)'s rules (bindings.ts,
 * fromScheduleP.ts): the Part III instructions are the resident's, with Form
 * 540NR in place of Form 540 (ca-540nr-sched-p-inst-2025::sec::how-to-compute-the-limitation::b02,
 * ::column-a-through-column-d-instructions::b01). Lines 1, 2 and 22 read other
 * lines than the resident's and are here.
 *
 * Each credit form a row takes (FTB 3506, 3507, 3510, 3541, 3801-CR,
 * 3804-CR, Schedule S) is figured for Form 540 only (540nr/californiaForms.ts),
 * so a row whose form this return needs is that form's gap; with none needed
 * the row is Schedule P (540)'s: blank, or the reason it has no facts.
 */

import { numberOrBlank } from "../../../money.js";
import type { Bind } from "./fromScheduleP.js";

// Line 1: "Enter the amount from Form 540NR, line 42" (the form).
const line1: Bind = (form) =>
  numberOrBlank(form["form-540nr.1.line.42_tax_before_special_credits"]);

// Line 2: "Enter the tentative minimum tax from Side 2, Part II, line 43" (the form).
const line2: Bind = (form) => numberOrBlank(form["1.line.43_california_tmt"]);

// Line 22: "Enter your alternative minimum tax from Side 2, Part II, line 45" (the form).
const line22: Bind = (form) => numberOrBlank(form["1.line.45_alternative_minimum_tax"]);

export const PART_III_BINDINGS: Readonly<Record<string, Bind>> = {
  "2.part3.1_tax_from_form_540nr_line_42": line1,
  "2.part3.2_tentative_minimum_tax": line2,
  "2.part3.22_alternative_minimum_tax_col_c": line22,
};

/* The credit form each Part III row takes (the Credit Table, ca-540nr-sched-p-inst-2025::sec::credit-table::b01 to b03). */
const ROW_FORMS: Readonly<Record<number, readonly string[]>> = {
  4: ["form-3507"],
  5: ["form-3506"],
  6: ["form-3541"],
  7: ["form-3541"],
  10: ["form-3510"],
  16: ["form-3541", "form-3801-cr"],
  17: ["form-3541", "form-3801-cr"],
  18: ["form-3541", "form-3801-cr"],
  20: ["schedule-s"],
  21: ["form-3804-cr"],
};

const PART_III = ".part3.";

/* "2.part3.16_credit_code" → 16; undefined for a field outside Part III. */
function rowOf(field: string): number | undefined {
  const start = field.indexOf(PART_III);
  if (start < 0) return undefined;
  const rest = field.slice(start + PART_III.length);
  return Number(rest.slice(0, rest.indexOf("_")));
}

/* The credit forms a Part III field takes: a gap first when the return needs one. */
export function creditFormsOf(field: string): readonly string[] {
  const row = rowOf(field);
  return row === undefined ? [] : (ROW_FORMS[row] ?? []);
}

const HOH_CREDITS =
  "Section B1 lines 12 to 14 take the joint custody head of household, dependent parent and senior head of household credits from Form 540NR lines 51 to 53 and the line 54 percentage; no fact asks whether the taxpayer qualifies (Form 540NR lines 51 to 55).";

/*
 * The Schedule P (540NR) fields Schedule P (540) does not have: the credit
 * from Form 540NR and its percentage on lines 12 to 14, and the blank after
 * line 10's name.
 */
export const PART_III_UNSUPPORTED: Readonly<Record<string, string>> = {
  "2.part3.10_prior_year_amt_entry":
    "The form prints a blank after the line 10 credit name; the instructions do not say what it holds (the credit amount is column (a)).",
  "2.part3.12_joint_custody_hoh_credit_from_540nr": HOH_CREDITS,
  "2.part3.12_joint_custody_hoh_credit_percentage": HOH_CREDITS,
  "2.part3.13_dependent_parent_credit_from_540nr": HOH_CREDITS,
  "2.part3.13_dependent_parent_credit_percentage": HOH_CREDITS,
  "2.part3.14_senior_hoh_credit_from_540nr": HOH_CREDITS,
  "2.part3.14_senior_hoh_credit_percentage": HOH_CREDITS,
};
