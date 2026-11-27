/* Form 540NR other taxes: lines 71 to 74. */

import { numberOrBlank, sum } from "../../../money.js";
import { gapFor, type Form540NRLine } from "./form540NRBinding.js";
import { behavioralHealthServicesTax } from "./lines.js";

const SCHEDULE_P_540NR = "schedule-p-540nr";
const ADJUSTED_AMT = "schedule-p-540nr.2.part3.25_adjusted_amt_col_c";

/*
 * Line 71: the alternative minimum tax from Schedule P (540NR)
 * (ca-540nr-booklet-2025::sec::line-71-alternative-minimum-tax-amt::b01):
 * Part III line 25, "Enter the balance from line 24, column (c) here and on
 * Form 540NR, line 71", which is Part II line 45 less the Section C credits;
 * line 45 at zero or less is "-0- here and on Form 540NR, line 71" (the
 * Schedule P (540NR) form). Blank when the schedule does not file. While Part
 * I waits on FTB 3526, which the engine figures for Form 540 only, the line
 * carries that gap.
 */
export const line71AlternativeMinimumTax: Form540NRLine<"2.line.71_alternative_minimum_tax"> = (
  form,
  info,
) => {
  if (info.mustFile?.[SCHEDULE_P_540NR]?.value !== true) return undefined;
  return numberOrBlank(form[ADJUSTED_AMT]) ?? gapFor(info, "form-3526");
};

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

const OTHER_TAX_FORMS = ["form-5870a", "form-3805p"];

// Line 74: "Add line 63, line 71, line 72, and line 73. This is your total tax" (the form).
export const line74TotalTax: Form540NRLine<"2.line.74_total_tax"> = (form, info) => {
  const gap = gapFor(info, ...OTHER_TAX_FORMS);
  if (gap) return gap;
  const tax = form["2.line.63_tax_after_credits"];
  if (typeof tax !== "number") return undefined;
  // With Schedule P (540NR) filed, line 71 always holds an amount: no total without it.
  const amt = form["2.line.71_alternative_minimum_tax"];
  const filesScheduleP = info.mustFile?.[SCHEDULE_P_540NR]?.value === true;
  if (filesScheduleP && typeof amt !== "number") return gapFor(info, "form-3526");
  return sum(
    tax,
    form["2.line.71_alternative_minimum_tax"],
    form["2.line.72_behavioral_health_services_tax"],
    form["2.line.73_other_taxes_credit_recapture"],
  );
};
