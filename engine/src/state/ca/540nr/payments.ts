/* Form 540NR payments: lines 81 to 88. */

import { roundDollars, sum } from "../../../money.js";
import { line72CaEstimatedTaxPayments as form540EstimatedPayments } from "../540/payments.js";
import { gapFor, type Form540NRLine } from "./form540NRBinding.js";
import { fromForm540 } from "./fromForm540.js";

/*
 * Line 81: California tax withheld on W-2 box 17 and the other forms the line
 * lists, not "tax withheld by other states"
 * (ca-540nr-booklet-2025::sec::line-81-california-income-tax-withheld::b01).
 */
export const line81CaIncomeTaxWithheld: Form540NRLine<"2.line.81_ca_income_tax_withheld"> = (
  _,
  info,
) => roundDollars(info.californiaTaxWithheld);

// Line 82: the stated California payments, Form 540 line 72's rule (the same list of payments).
export const line82CaEstimatedTaxPayments = fromForm540<
  "2.line.82_ca_estimated_tax_payments",
  "line.72_ca_estimated_tax_payments"
>(form540EstimatedPayments);

/*
 * Lines 85 to 87: FTB 3514's credits (::line-85-earned-income-tax-credit-eitc::b01,
 * ::line-86-young-child-tax-credit-yctc::b01, ::line-87-foster-youth-tax-credit-fytc::b01).
 * FTB 3514 is figured for Form 540 only: a named gap when the return needs it.
 */
export const line85Eitc: Form540NRLine<"2.line.85_eitc"> = (_, info) => gapFor(info, "form-3514");
export const line86YoungChildTaxCredit: Form540NRLine<"2.line.86_young_child_tax_credit"> = (
  _,
  info,
) => gapFor(info, "form-3514");
export const line87FosterYouthTaxCredit: Form540NRLine<"2.line.87_foster_youth_tax_credit"> = (
  _,
  info,
) => gapFor(info, "form-3514");

const PAYMENT_LINES = [
  "2.line.81_ca_income_tax_withheld",
  "2.line.82_ca_estimated_tax_payments",
  "2.line.83_withholding_592b_593",
  "2.line.84_motion_picture_production_credit",
  "2.line.85_eitc",
  "2.line.86_young_child_tax_credit",
  "2.line.87_foster_youth_tax_credit",
] as const;

// Line 88: "Add line 81 through line 87. These are your total payments" (the form).
export const line88TotalPayments: Form540NRLine<"2.line.88_total_payments"> = (form, info) =>
  gapFor(info, "form-3514") ?? sum(...PAYMENT_LINES.map((line) => form[line]));
