/*
 * Form 540 lines 40, 43, 47 and 48: the special credits. Line 40 is FTB 3506;
 * line 43 is the other state tax credit (Schedule S) when it files, and is
 * unsupported otherwise. Lines 44 to 46 stay unsupported in bindings.ts and
 * read as blank.
 */

import { atLeast, numberOrBlank, sum, sumOrBlank } from "../../../money.js";
import { unsupported } from "../../../types.js";
import { OTHER_STATE_CREDIT_CODE, OTHER_STATE_CREDIT_NAME } from "../schedule-s/lines.js";
import { filesScheduleS, otherStateCreditTotal } from "../schedule-s/returnAmounts.js";
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

/* Line 43 with no Schedule S: no other special credit has facts. */
const LINE_43_NAME_UNSUPPORTED = unsupported(
  "Free-text credit name for an additional special credit on line 43. No ingestion path for user-supplied special credits (e.g., CA Competes, PTE, etc.) exists yet.",
);
const LINE_43_CODE_UNSUPPORTED = unsupported(
  "Credit code for additional special credit on line 43. No ingestion path for user-supplied special credits exists yet.",
);
const LINE_43_AMOUNT_UNSUPPORTED = unsupported(
  "Credit amount for additional special credit on line 43. No ingestion path for user-supplied special credits (requires supporting schedules/FTB forms) exists yet.",
);

/*
 * "To claim only one or two credits, enter the credit name, code, and amount of
 * the credit on line 43 and line 44" (ca-540-inst-2025::sec::line-43-through-line-45-additional-special-credits::b01).
 * The other state tax credit is the one such credit the engine figures: the
 * Credit Table's name and code 187 (ca-540-sched-p-inst-2025::sec::credit-table::b02).
 */
export const line43CreditName: Form540Line<"line.43_credit_name"> = (_, info) =>
  filesScheduleS(info) ? OTHER_STATE_CREDIT_NAME : LINE_43_NAME_UNSUPPORTED;

export const line43CreditCode: Form540Line<"line.43_credit_code"> = (_, info) =>
  filesScheduleS(info) ? OTHER_STATE_CREDIT_CODE : LINE_43_CODE_UNSUPPORTED;

/*
 * The total of every Schedule S line 12
 * (ca-540-sched-s-inst-2025::sec::specific-line-instructions::b01). With
 * Schedule P (540) completed, the credit it allows: Section B3 line 20 column (b)
 * (ca-540-sched-p-inst-2025::sec::how-to-claim-your-credits::b01). Always a
 * number once figured, so line 47 can wait for it.
 */
export const line43CreditAmount: Form540Line<"line.43_credit_amount"> = (form, info) => {
  if (!filesScheduleS(info)) return LINE_43_AMOUNT_UNSUPPORTED;
  const total = otherStateCreditTotal((fieldId) => form[fieldId], info);
  if (typeof total !== "number") return total;
  if (total === 0 || info.mustFile?.["schedule-p"]?.value !== true) return total;
  return numberOrBlank(form["schedule-p.3.part3.20_other_state_tax_credit_used_col_b"]);
};

/*
 * "Add line 40 through line 46" (the form). With FTB 3506 filed, the total
 * waits while its credit, or Schedule P's share of it, waits; with Schedule S
 * filed, while line 43 waits.
 */
export const line47TotalCredits: Form540Line<"line.47_total_credits"> = (form, info) => {
  const credits = CREDIT_LINES.map((id) => form[id]);
  if (filesScheduleS(info) && form["line.43_credit_amount"] === undefined) return undefined;
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
  if ((files3506(info) || filesScheduleS(info)) && credits === undefined) return undefined;
  return atLeast(0, sum(tax, credits === undefined ? 0 : -credits));
};
