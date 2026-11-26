/*
 * Form 540 lines 91 to 115: use tax, health coverage, overpaid tax or tax
 * due, contributions, the amount you owe, penalties and the refund.
 */

import { atLeast, numberOrBlank, sum } from "../../../money.js";
import { isrPenalty } from "../3853/isrPenalty.js";
import type { Form540Form, Form540Line } from "./form540Binding.js";

export const line91UseTax: Form540Line<"line.91_use_tax"> = (_, info) => info.useTaxOwed;

// MANUAL EDIT: bound by hand; the generator emitted a TODO here.
export const line91NoUseTaxOwed: Form540Line<"line.91_no_use_tax_owed"> = (_, info) =>
  info.useTaxZeroReason;

export const line92FullYearHealthCoverage: Form540Line<"line.92_full_year_health_coverage"> = (
  _,
  info,
) => info.fullYearMEC;

/*
 * Line 92: "Enter your individual shared responsibility penalty from form FTB
 * 3853, Part IV, line 1" (ca-540-inst-2025::sec::line-92-individual-shared-responsibility-isr-penalty::b01).
 * Blank with no FTB 3853 or no penalty; the same rule as FTB 3853 line 1.
 */
export const line92IsrPenalty: Form540Line<"line.92_isr_penalty"> = (form, info) =>
  isrPenalty((id) => form[id], info);

/* Line 96, as the form prints it: "If line 92 is more than line 93, subtract line 93 from line 92"; blank otherwise. */
export const line96IsrPenaltyBalance: Form540Line<"line.96_isr_penalty_balance"> = (form) => {
  const penalty = numberOrBlank(form["line.92_isr_penalty"]);
  if (penalty === undefined) return undefined;
  const balance = penalty - atLeast(0, form["line.93_payments_balance"]);
  return balance > 0 ? balance : undefined;
};

export const line93PaymentsBalance: Form540Line<"line.93_payments_balance"> = (form) =>
  atLeast(
    0,
    sum(
      form["line.78_total_payments"],
      form["line.91_use_tax"] === undefined ? 0 : -form["line.91_use_tax"],
    ),
  );

export const line95PaymentsAfterIsrPenalty: Form540Line<"line.95_payments_after_isr_penalty"> = (
  form,
) =>
  atLeast(
    0,
    sum(
      form["line.93_payments_balance"],
      form["line.92_isr_penalty"] === undefined ? 0 : -form["line.92_isr_penalty"],
    ),
  );

export const line97OverpaidTax: Form540Line<"line.97_overpaid_tax"> = (form) => {
  const totalTax = form["line.64_total_tax"];
  if (typeof totalTax !== "number") return undefined;
  return atLeast(0, sum(form["line.95_payments_after_isr_penalty"], -totalTax));
};

export const line99OverpaidTaxAvailable: Form540Line<"line.99_overpaid_tax_available"> = (form) => {
  const overpaid = form["line.97_overpaid_tax"];
  if (typeof overpaid !== "number") return undefined;
  return atLeast(
    0,
    sum(
      overpaid,
      form["line.98_applied_to_2026_estimated_tax"] === undefined
        ? 0
        : -form["line.98_applied_to_2026_estimated_tax"],
    ),
  );
};

export const line100TaxDue: Form540Line<"line.100_tax_due"> = (form) => {
  if (typeof form["line.64_total_tax"] !== "number") return undefined;
  const taxDue = sum(
    form["line.64_total_tax"],
    form["line.95_payments_after_isr_penalty"] === undefined
      ? 0
      : -form["line.95_payments_after_isr_penalty"],
  );
  return taxDue > 0 ? taxDue : undefined;
};

// 540 inst.: with no amount on line 99, amount owed = lines 94 + 96 + 100 + 110.
export const line111AmountYouOwe: Form540Line<"line.111_amount_you_owe"> = (form) => {
  const owed = sum(
    form["line.94_use_tax_balance"],
    form["line.96_isr_penalty_balance"],
    form["line.100_tax_due"],
    form["line.110_total_contributions"],
  );
  return owed > 0 ? owed : undefined;
};

/*
 * FTB 5805F's penalty: line 16 with a waiver request (its box checked), else
 * line 15 (ca-5805f-face-2025::sec::face-part-ii::b01,
 * ca-5805f-inst-2025::sec::e-waiver-of-the-penalty::b01: "Enter the amount, if
 * any, from line 16"). Undefined when the form owes no penalty or is not filed.
 */
function farmerPenalty(form: Form540Form): number | undefined {
  const waiver = form["form-5805f.0.line.16_waiver_request_checkbox"];
  if (waiver === undefined) return undefined;
  const penalty =
    form[waiver === true ? "form-5805f.0.line.16_waiver_amount" : "form-5805f.0.line.15_penalty"];
  return typeof penalty === "number" && penalty > 0 ? penalty : undefined;
}

// MANUAL EDIT: FTB 5805 line 13, or FTB 5805F's penalty; blank when neither is filed.
export const line113UnderpaymentEstimatedTax: Form540Line<"line.113_underpayment_estimated_tax"> = (
  form,
) => {
  const farmer = farmerPenalty(form);
  if (farmer !== undefined) return farmer;
  const value = form["form-5805.1.part2.line_13"];
  return typeof value === "number" ? value : undefined;
};

/*
 * Line 113's FTB 5805F box: checked whenever the form files, "Even if you do
 * not owe a penalty" (ca-5805f-inst-2025::sec::f-amended-tax-returns::b01).
 */
export const line113Ftb5805FAttached: Form540Line<"line.112_ftb_5805f_attached"> = (_, info) =>
  info.mustFile?.["form-5805f"]?.value === true ? true : undefined;

/*
 * Line 114: "Add line 111, line 112, and line 113"
 * (ca-540-inst-2025::sec::line-114-total-amount-due::b01). Line 111 adds lines
 * 94, 96, 100 and 110, so the penalty balance (line 96) is in the total.
 */
export const line114TotalAmountDue: Form540Line<"line.114_total_amount_due"> = (form) => {
  const due = atLeast(
    0,
    sum(
      form["line.94_use_tax_balance"],
      form["line.96_isr_penalty_balance"],
      form["line.100_tax_due"],
      form["line.110_total_contributions"],
      form["line.112_interest_and_late_penalties"],
      form["line.113_underpayment_estimated_tax"],
    ),
  );
  return due > 0 ? due : undefined;
};

export const line115RefundOrNoAmountDue: Form540Line<"line.115_refund_or_no_amount_due"> = (
  form,
) => {
  const available = form["line.99_overpaid_tax_available"];
  if (typeof available !== "number") return undefined;
  return atLeast(
    0,
    sum(
      available,
      form["line.110_total_contributions"] === undefined
        ? 0
        : -form["line.110_total_contributions"],
      form["line.112_interest_and_late_penalties"] === undefined
        ? 0
        : -form["line.112_interest_and_late_penalties"],
      form["line.113_underpayment_estimated_tax"] === undefined
        ? 0
        : -form["line.113_underpayment_estimated_tax"],
    ),
  );
};
