/* Form 540 other taxes: lines 61 to 64. */

import { roundDollars, sum, sumOrBlank } from "../../../money.js";
import type { Form540Line } from "./form540Binding.js";

/* Line 62: taxable income over this amount is taxed at this rate (2025). */
const BEHAVIORAL_HEALTH_TAX_FLOOR = 1_000_000;
const BEHAVIORAL_HEALTH_TAX_RATE = 0.01;

/*
 * MANUAL EDIT: Schedule P (540) Part II line 26: "If more than zero, enter
 * here and on Form 540, line 61" (ca-540-sched-p-inst-2025, the form text;
 * ca-540-inst-2025::sec::line-61-alternative-minimum-tax-amt::b01). Blank
 * when the schedule is not completed or owes nothing.
 */
export const line61AlternativeMinimumTax: Form540Line<"line.61_alternative_minimum_tax"> = (
  form,
) => {
  const amt = form["schedule-p.1.line.26_alternative_minimum_tax"];
  return typeof amt === "number" && amt > 0 ? amt : undefined;
};

/*
 * MANUAL EDIT: ca-540-inst-2025::sec::line-62-behavioral-health-services-tax::b01:
 * 1% of taxable income over $1,000,000, whole dollars.
 */
export const line62BehavioralHealthServicesTax: Form540Line<
  "line.62_behavioral_health_services_tax"
> = (form) => {
  const taxable = form["line.19_taxable_income"];
  if (typeof taxable !== "number" || taxable <= BEHAVIORAL_HEALTH_TAX_FLOOR) return undefined;
  return roundDollars((taxable - BEHAVIORAL_HEALTH_TAX_FLOOR) * BEHAVIORAL_HEALTH_TAX_RATE);
};

/*
 * MANUAL EDIT: ca-540-inst-2025::sec::line-63-other-taxes-and-credit-recapture::b01:
 * the additional tax on early distributions from form FTB 3805P (its lines
 * 4, 8, 10b and 11). NQDC income, IRC 453A interest and credit recapture
 * (::b02) have no facts. Blank when FTB 3805P is not filed.
 */
export const line63OtherTaxesCreditRecapture: Form540Line<
  "line.63_other_taxes_credit_recapture"
> = (form) =>
  sumOrBlank(
    form["form-3805p.0.part1.line_4_early_distribution_tax_due"],
    form["form-3805p.0.part2.line_8_education_able_tax_due"],
    form["form-3805p.0.part3.line_10b_archer_msa_tax_due"],
    form["form-3805p.0.part3.line_11_medicare_advantage_msa_tax_due"],
  );

export const line64TotalTax: Form540Line<"line.64_total_tax"> = (form, info) => {
  /*
   * MANUAL EDIT: FTB 3805P files but its tax is still unknown (an
   * undetermined taxable amount, or two spouses who need two forms):
   * the total waits, because sum() would read the blank line 63 as 0.
   */
  const earlyTaxUnknown =
    info.mustFile?.["form-3805p"]?.value === true &&
    form["line.63_other_taxes_credit_recapture"] === undefined;
  // Schedule P completed with its AMT still unknown (Part I line 7 waiting): the same.
  const amtUnknown =
    info.mustFile?.["schedule-p"]?.value === true &&
    form["schedule-p.1.line.26_alternative_minimum_tax"] === undefined;
  if (earlyTaxUnknown || amtUnknown) return undefined;
  if (typeof form["line.48_tax_after_credits"] !== "number") return undefined;
  return sum(
    form["line.48_tax_after_credits"],
    form["line.61_alternative_minimum_tax"],
    form["line.62_behavioral_health_services_tax"],
    form["line.63_other_taxes_credit_recapture"],
  );
};
