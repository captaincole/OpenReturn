/* Form 540NR other taxes: lines 71 to 74. */

import { sum } from "../../../money.js";
import { gapFor, type Form540NRLine } from "./form540NRBinding.js";
import { behavioralHealthServicesTax } from "./lines.js";

/*
 * Line 71: the alternative minimum tax from Schedule P (540NR)
 * (ca-540nr-booklet-2025::sec::line-71-alternative-minimum-tax-amt::b01).
 * Schedule P (540NR) has no rules yet: a named gap when the return needs the
 * schedule (an ISO exercise, itemized deductions, a prior year AMT credit or
 * more than two credits, the tests Schedule P (540) files on); blank otherwise.
 */
export const line71AlternativeMinimumTax: Form540NRLine<"2.line.71_alternative_minimum_tax"> = (
  _,
  info,
) => gapFor(info, "schedule-p");

/*
 * Line 72: 1% of California taxable income (line 35) over $1,000,000
 * (ca-540nr-booklet-2025::sec::line-72-behavioral-health-services-tax::b01),
 * plus FTB 5870A Part III, which is a gap when needed. Blank under the floor.
 */
export const line72BehavioralHealthServicesTax: Form540NRLine<
  "2.line.72_behavioral_health_services_tax"
> = (form, info) => {
  const gap = gapFor(info, "form-5870a");
  if (gap) return gap;
  const californiaIncome = form["1.line.35_ca_taxable_income"];
  return typeof californiaIncome === "number"
    ? behavioralHealthServicesTax(californiaIncome)
    : undefined;
};

/*
 * Line 73: the additional tax on an early distribution from FTB 3805P, and
 * the other taxes the line lists (::line-73-other-taxes-and-credit-recapture::b01).
 * FTB 3805P is figured for Form 540 only: a named gap when needed. NQDC tax,
 * IRC 453A interest and credit recapture have no facts, as on Form 540 line 63.
 */
export const line73OtherTaxes: Form540NRLine<"2.line.73_other_taxes_credit_recapture"> = (
  _,
  info,
) => gapFor(info, "form-3805p");

const OTHER_TAX_FORMS = ["schedule-p", "form-5870a", "form-3805p"];

// Line 74: "Add line 63, line 71, line 72, and line 73. This is your total tax" (the form).
export const line74TotalTax: Form540NRLine<"2.line.74_total_tax"> = (form, info) => {
  const gap = gapFor(info, ...OTHER_TAX_FORMS);
  if (gap) return gap;
  const tax = form["2.line.63_tax_after_credits"];
  if (typeof tax !== "number") return undefined;
  return sum(
    tax,
    form["2.line.71_alternative_minimum_tax"],
    form["2.line.72_behavioral_health_services_tax"],
    form["2.line.73_other_taxes_credit_recapture"],
  );
};
