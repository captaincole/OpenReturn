/*
 * Form 540 lines 40, 43, 44, 47 and 48: the special credits. Line 40 is FTB
 * 3506. Lines 43 and 44 hold the other credits the engine figures: the credit
 * for prior year AMT (FTB 3510) and the other state tax credit (Schedule S).
 * They are unsupported when neither form files. Lines 45 and 46 stay
 * unsupported in bindings.ts and read as blank.
 */

import { atLeast, numberOrBlank, sum, sumOrBlank } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import { files3510, priorYearAmtCreditUsed, priorYearAmtCreditWaits } from "../3510/creditUsed.js";
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

type OtherCredit = { name: string; code: string; amount: number };

/*
 * The credit for prior year AMT, code 188 (the Credit Table,
 * ca-540-sched-p-inst-2025::sec::credit-table::b01). The Credit Table's name,
 * "Prior Year Alternative Minimum Tax", does not fit the printed box, so the
 * name is shortened; the code names the credit.
 */
const PRIOR_YEAR_AMT_CREDIT_NAME = "Prior Year AMT";
const PRIOR_YEAR_AMT_CREDIT_CODE = "188";

/*
 * The other state tax credit: the total of every Schedule S line 12
 * (ca-540-sched-s-inst-2025::sec::specific-line-instructions::b01). With
 * Schedule P (540) completed, the credit it allows: Section B3 line 20 column
 * (b). Undefined while it waits; 0 with no Schedule S.
 */
function otherStateCreditUsed(form: Form540Form, info: Form540FilingInfo) {
  if (!filesScheduleS(info)) return 0;
  const total = otherStateCreditTotal((fieldId) => form[fieldId], info);
  if (typeof total !== "number") return total;
  if (total === 0 || info.mustFile?.["schedule-p"]?.value !== true) return total;
  return numberOrBlank(form["schedule-p.3.part3.20_other_state_tax_credit_used_col_b"]);
}

/*
 * The other credits taken, each from Schedule P (540) column (b) when it is
 * completed (ca-540-sched-p-inst-2025::sec::how-to-claim-your-credits::b01),
 * in Part III order: line 10 (prior year AMT) before line 20 (other state
 * tax). Neither text gives an order (QUESTIONS.md). A credit of 0 is not
 * taken. Undefined while either credit waits.
 */
function otherCredits(
  form: Form540Form,
  info: Form540FilingInfo,
): OtherCredit[] | Unsupported | undefined {
  const read = (fieldId: string) => form[fieldId];
  if (priorYearAmtCreditWaits(read, info)) return undefined;
  const otherState = otherStateCreditUsed(form, info);
  if (typeof otherState !== "number") return otherState;
  const priorYearAmt = files3510(info) ? (priorYearAmtCreditUsed(read) ?? 0) : 0;
  return [
    { name: PRIOR_YEAR_AMT_CREDIT_NAME, code: PRIOR_YEAR_AMT_CREDIT_CODE, amount: priorYearAmt },
    { name: OTHER_STATE_CREDIT_NAME, code: OTHER_STATE_CREDIT_CODE, amount: otherState },
  ].filter((credit) => credit.amount > 0);
}

/*
 * "To claim only one or two credits, enter the credit name, code, and amount of
 * the credit on line 43 and line 44. To claim more than two credits, use
 * Schedule P (540), Part III" (ca-540-inst-2025::sec::line-43-through-line-45-additional-special-credits::b01);
 * then lines 43 and 44 stay blank and line 45 holds the total
 * (ca-540-sched-p-inst-2025::sec::how-to-claim-your-credits::b01). A third
 * other credit has no rules yet. With neither form filed, no other special
 * credit has facts, and the line is unsupported. With a form filed and fewer
 * credits than the slot, the line is blank.
 */
function otherCreditField<T>(slot: 0 | 1, pick: (credit: OtherCredit) => T, noFacts: Unsupported) {
  return (form: Form540Form, info: Form540FilingInfo): T | Unsupported | undefined => {
    if (!files3510(info) && !filesScheduleS(info)) return noFacts;
    const credits = otherCredits(form, info);
    if (credits === undefined || !Array.isArray(credits)) return credits;
    const credit = credits.length > 2 ? undefined : credits[slot];
    return credit === undefined ? undefined : pick(credit);
  };
}

/* With neither form filed: main's reasons, word for word. */
const LINE_43_NAME_UNSUPPORTED = unsupported(
  "Free-text credit name for an additional special credit on line 43. No ingestion path for user-supplied special credits (e.g., CA Competes, PTE, etc.) exists yet.",
);
const LINE_43_CODE_UNSUPPORTED = unsupported(
  "Credit code for additional special credit on line 43. No ingestion path for user-supplied special credits exists yet.",
);
const LINE_43_AMOUNT_UNSUPPORTED = unsupported(
  "Credit amount for additional special credit on line 43. No ingestion path for user-supplied special credits (requires supporting schedules/FTB forms) exists yet.",
);
const LINE_44_NAME_UNSUPPORTED = unsupported(
  "Free-text credit name for an additional special credit on line 44. No ingestion path for user-supplied special credits exists yet.",
);
const LINE_44_CODE_UNSUPPORTED = unsupported(
  "Credit code for additional special credit on line 44. No ingestion path for user-supplied special credits exists yet.",
);
const LINE_44_AMOUNT_UNSUPPORTED = unsupported(
  "Credit amount for additional special credit on line 44. No ingestion path for user-supplied special credits (requires supporting schedules/FTB forms) exists yet.",
);

const nameOf = (credit: OtherCredit) => credit.name;
const codeOf = (credit: OtherCredit) => credit.code;
const amountOf = (credit: OtherCredit) => credit.amount;

export const line43CreditName: Form540Line<"line.43_credit_name"> = otherCreditField(
  0,
  nameOf,
  LINE_43_NAME_UNSUPPORTED,
);
export const line43CreditCode: Form540Line<"line.43_credit_code"> = otherCreditField(
  0,
  codeOf,
  LINE_43_CODE_UNSUPPORTED,
);
export const line43CreditAmount: Form540Line<"line.43_credit_amount"> = otherCreditField(
  0,
  amountOf,
  LINE_43_AMOUNT_UNSUPPORTED,
);
export const line44CreditName: Form540Line<"line.44_credit_name"> = otherCreditField(
  1,
  nameOf,
  LINE_44_NAME_UNSUPPORTED,
);
export const line44CreditCode: Form540Line<"line.44_credit_code"> = otherCreditField(
  1,
  codeOf,
  LINE_44_CODE_UNSUPPORTED,
);
export const line44CreditAmount: Form540Line<"line.44_credit_amount"> = otherCreditField(
  1,
  amountOf,
  LINE_44_AMOUNT_UNSUPPORTED,
);

/*
 * "Add line 40 through line 46" (the form). With FTB 3506 filed, the total
 * waits while its credit, or Schedule P's share of it, waits; it also waits
 * while the credit for prior year AMT or the other state tax credit waits.
 */
export const line47TotalCredits: Form540Line<"line.47_total_credits"> = (form, info) => {
  const credits = CREDIT_LINES.map((id) => form[id]);
  if (otherCredits(form, info) === undefined) return undefined;
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
  if (otherCredits(form, info) === undefined) return undefined;
  return atLeast(0, sum(tax, credits === undefined ? 0 : -credits));
};
