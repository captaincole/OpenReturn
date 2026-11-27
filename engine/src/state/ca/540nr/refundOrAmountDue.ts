/*
 * Form 540NR lines 91 to 125: the health coverage penalty, overpaid tax or
 * tax due, the amount you owe, penalties and the refund. Form 540NR has no
 * use tax line; where the arithmetic is Form 540's, the line is Form 540's
 * rule on the Form 540NR lines (fromForm540.ts).
 */

import { atLeast, numberOrBlank } from "../../../money.js";
import {
  line100TaxDue,
  line111AmountYouOwe,
  line114TotalAmountDue,
  line115RefundOrNoAmountDue,
  line92FullYearHealthCoverage,
  line97OverpaidTax,
  line99OverpaidTaxAvailable,
} from "../540/refundOrAmountDue.js";
import { gapFor, type Form540NRLine } from "./form540NRBinding.js";
import { fromForm540 } from "./fromForm540.js";

export const line91FullYearHealthCoverage = fromForm540<
  "2.line.91_full_year_health_coverage",
  "line.92_full_year_health_coverage"
>(line92FullYearHealthCoverage);

/*
 * Line 91: the penalty "from form FTB 3853, Part IV, line 1"
 * (ca-540nr-booklet-2025::sec::isr-penalty::b01). FTB 3853 is figured for
 * Form 540 only: a named gap when the household lacked coverage and the
 * return needs the form; blank otherwise.
 */
export const line91IsrPenalty: Form540NRLine<"2.line.91_isr_penalty"> = (_, info) =>
  gapFor(info, "form-3853");

/* Line 92: "If line 88 is more than line 91, subtract line 91 from line 88" (the form), 0 when not. */
export const line92PaymentsAfterIsrPenalty: Form540NRLine<
  "2.line.92_payments_after_isr_penalty"
> = (form) => {
  const payments = numberOrBlank(form["2.line.88_total_payments"]);
  if (payments === undefined) return undefined;
  return atLeast(0, payments - (numberOrBlank(form["2.line.91_isr_penalty"]) ?? 0));
};

/* Line 93: "If line 91 is more than line 88, subtract line 88 from line 91" (the form); blank otherwise. */
export const line93IsrPenaltyBalance: Form540NRLine<"2.line.93_isr_penalty_balance"> = (form) => {
  const penalty = numberOrBlank(form["2.line.91_isr_penalty"]);
  if (penalty === undefined) return undefined;
  const balance = penalty - atLeast(0, form["2.line.88_total_payments"]);
  return balance > 0 ? balance : undefined;
};

// Lines 101 to 104 (::line-101-overpaid-tax::b01, ::line-103-overpaid-tax-available-this-year::b01, ::line-104-tax-due::b01).
export const line101OverpaidTax = fromForm540<"2.line.101_overpaid_tax", "line.97_overpaid_tax">(
  line97OverpaidTax,
);
export const line103OverpaidTaxAvailable = fromForm540<
  "2.line.103_overpaid_tax_available",
  "line.99_overpaid_tax_available"
>(line99OverpaidTaxAvailable);
export const line104TaxDue = fromForm540<"3.line.104_tax_due", "line.100_tax_due">(line100TaxDue);

// Line 121: "Add line 93, line 104, and line 120" (the form), Form 540 line 111's rule.
export const line121AmountYouOwe = fromForm540<
  "4.line.121_amount_you_owe",
  "line.111_amount_you_owe"
>(line111AmountYouOwe);

/*
 * Line 123: the penalty from FTB 5805 or FTB 5805F
 * (ca-540nr-booklet-2025::sec::line-123-underpayment-of-estimated-tax::b02).
 * Both are figured for Form 540 only: a named gap when the return needs one,
 * blank otherwise (the FTB figures the penalty and sends a bill, ::b01).
 */
export const line123UnderpaymentEstimatedTax: Form540NRLine<
  "4.line.123_underpayment_estimated_tax"
> = (_, info) => gapFor(info, "form-5805", "form-5805f");
export const line123Ftb5805Attached: Form540NRLine<"4.line.123_ftb_5805_attached"> = (_, info) =>
  gapFor(info, "form-5805");
export const line123Ftb5805FAttached: Form540NRLine<"4.line.123_ftb_5805f_attached"> = (_, info) =>
  gapFor(info, "form-5805f");

// Lines 124 and 125 (::line-124-total-amount-due::b01, ::refund-and-direct-deposit::b01): Form 540 lines 114 and 115.
export const line124TotalAmountDue = fromForm540<
  "4.line.124_total_amount_due",
  "line.114_total_amount_due"
>(line114TotalAmountDue);
export const line125RefundOrNoAmountDue = fromForm540<
  "4.line.125_refund_or_no_amount_due",
  "line.115_refund_or_no_amount_due"
>(line115RefundOrNoAmountDue);
