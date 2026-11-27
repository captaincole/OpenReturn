/*
 * Form 540NR California taxable income and tax: lines 31 to 42. "You
 * determine your California tax by multiplying your California taxable income
 * by an effective tax rate. The effective tax rate is the tax on total taxable
 * income, taken from the tax table, divided by total taxable income"
 * (ca-540nr-booklet-2025::sec::how-nonresidents-and-part-year-residents-are-taxed::b01).
 */

import { numberOrBlank, sum } from "../../../money.js";
import {
  line32ExemptionCredits as form540ExemptionCreditsAfterLimit,
  line31TaxAmount as form540Line31Tax,
  line31TaxFromRateSchedule as form540RateScheduleBox,
  line31TaxFromTaxTable as form540TaxTableBox,
} from "../540/tax.js";
import { gapFor, type Form540NRForm, type Form540NRLine } from "./form540NRBinding.js";
import { fromForm540 } from "./fromForm540.js";
import { caShare, caTaxRate, prorated, ratioDigits, regularTaxBeforeCredits } from "./lines.js";

/*
 * Line 31: the tax on line 19 from the Tax Table or the Tax Rate Schedules
 * (ca-540nr-booklet-2025::sec::line-31-tax::b01), Form 540's rule. FTB 3800
 * (a child's tax) and FTB 3803 (a child's income on the parent's return) are
 * figured for Form 540 only: with either needed, the line is a named gap.
 */
const CHILD_TAX_FORMS = ["form-3800-ca", "form-3803"];

export const line31TaxFromTaxTable = fromForm540<
  "1.line.31_tax_from_tax_table",
  "line.31_tax_from_tax_table"
>(form540TaxTableBox);
export const line31TaxFromRateSchedule = fromForm540<
  "1.line.31_tax_from_rate_schedule",
  "line.31_tax_from_rate_schedule"
>(form540RateScheduleBox);
export const line31TaxFromFtb3800: Form540NRLine<"1.line.31_tax_from_ftb_3800"> = (_, info) =>
  gapFor(info, "form-3800-ca");
export const line31TaxFromFtb3803: Form540NRLine<"1.line.31_tax_from_ftb_3803"> = (_, info) =>
  gapFor(info, "form-3803");

const form540Tax = fromForm540<"1.line.31_tax_amount", "line.31_tax_amount">(form540Line31Tax);
export const line31TaxAmount: Form540NRLine<"1.line.31_tax_amount"> = (form, info) =>
  gapFor(info, ...CHILD_TAX_FORMS) ?? form540Tax(form, info);

/* Line 32: "California adjusted gross income from Schedule CA (540NR), Part IV, line 1" (the form). */
export const line32CaAgi: Form540NRLine<"1.line.32_ca_agi"> = (form) =>
  numberOrBlank(form["schedule-ca-540nr.4.part4.1_california_agi"]);

/* Line 35: "California Taxable Income from Schedule CA (540NR), Part IV, line 5" (the form). */
export const line35CaTaxableIncome: Form540NRLine<"1.line.35_ca_taxable_income"> = (form) =>
  numberOrBlank(form["schedule-ca-540nr.4.part4.5_california_taxable_income"]);

/* Line 36: "Divide line 31 by line 19", four places (ca-540nr-booklet-2025::sec::line-36-ca-tax-rate::b01). */
function taxRate(form: Form540NRForm): number | undefined {
  const tax = form["1.line.31_tax_amount"];
  const total = form["1.line.19_total_taxable_income"];
  if (typeof tax !== "number" || typeof total !== "number") return undefined;
  return caTaxRate(tax, total);
}

export const line36RateWholeDigit: Form540NRLine<"1.line.36_ca_tax_rate_whole_digit"> = (form) => {
  const rate = taxRate(form);
  return rate === undefined ? undefined : ratioDigits(rate).whole;
};
export const line36RateDecimalDigits: Form540NRLine<"1.line.36_ca_tax_rate_decimal_digits"> = (
  form,
) => {
  const rate = taxRate(form);
  return rate === undefined ? undefined : ratioDigits(rate).decimals;
};

// Line 37: "Multiply line 35 by line 36" (the form), the rate as entered.
export const line37TaxBeforeExemptionCredits: Form540NRLine<
  "1.line.37_ca_tax_before_exemption_credits"
> = (form) => {
  const rate = taxRate(form);
  const californiaIncome = form["1.line.35_ca_taxable_income"];
  if (rate === undefined || typeof californiaIncome !== "number") return undefined;
  return prorated(californiaIncome, rate);
};

/*
 * Line 38: "Divide line 35 by line 19. If more than 1, enter 1.0000" (the
 * form; ca-540nr-booklet-2025::sec::line-38-ca-exemption-credit-percentage::b01).
 */
export function exemptionCreditPercentage(form: Form540NRForm): number | undefined {
  const californiaIncome = form["1.line.35_ca_taxable_income"];
  const total = form["1.line.19_total_taxable_income"];
  if (typeof californiaIncome !== "number" || typeof total !== "number") return undefined;
  return caShare(californiaIncome, total);
}

export const line38PercentageWholeDigit: Form540NRLine<
  "1.line.38_exemption_credit_percentage_whole_digit"
> = (form) => {
  const share = exemptionCreditPercentage(form);
  return share === undefined ? undefined : ratioDigits(share).whole;
};
export const line38PercentageDecimalDigits: Form540NRLine<
  "1.line.38_exemption_credit_percentage_decimal_digits"
> = (form) => {
  const share = exemptionCreditPercentage(form);
  return share === undefined ? undefined : ratioDigits(share).decimals;
};

/*
 * Line 39: "Multiply line 11 by line 38. If the amount on line 13 is more than
 * $252,203, see instructions": over the filing status's amount, the AGI
 * Limitation Worksheet line n times line 38 (line o)
 * (ca-540nr-booklet-2025::sec::line-39-ca-prorated-exemption-credits::b01,
 * ::agi-limitation-worksheet::b02). Line n is Form 540's line 32 rule, the same
 * worksheet on the same lines 7 to 13.
 */
const exemptionCreditsAfterLimit = fromForm540<
  "1.line.39_ca_prorated_exemption_credits",
  "line.32_exemption_credits"
>(form540ExemptionCreditsAfterLimit);

export const line39ProratedExemptionCredits: Form540NRLine<
  "1.line.39_ca_prorated_exemption_credits"
> = (form, info) => {
  const share = exemptionCreditPercentage(form);
  const credits = exemptionCreditsAfterLimit(form, info);
  if (share === undefined || typeof credits !== "number") return undefined;
  return prorated(credits, share);
};

export const line40RegularTaxBeforeCredits: Form540NRLine<
  "1.line.40_ca_regular_tax_before_credits"
> = (form) => {
  const tax = form["1.line.37_ca_tax_before_exemption_credits"];
  const credits = form["1.line.39_ca_prorated_exemption_credits"];
  if (typeof tax !== "number" || typeof credits !== "number") return undefined;
  return regularTaxBeforeCredits(tax, credits);
};

/*
 * Line 41: the tax from Schedule G-1 (a lump-sum distribution) and FTB 5870A
 * (a trust's accumulation distribution)
 * (ca-540nr-booklet-2025::sec::line-41-tax-from-schedule-g-1-and-form-ftb-5870a::b01).
 * Both are figured for Form 540 only: a named gap when the return needs one,
 * blank otherwise.
 */
const LINE_41_FORMS = ["schedule-g-1", "form-5870a"];

export const line41TaxFromScheduleG1: Form540NRLine<"1.line.41_tax_from_schedule_g1"> = (_, info) =>
  gapFor(info, "schedule-g-1");
export const line41TaxFromFtb5870A: Form540NRLine<"1.line.41_tax_from_ftb_5870a"> = (_, info) =>
  gapFor(info, "form-5870a");
export const line41TaxAmount: Form540NRLine<"1.line.41_tax_amount"> = (_, info) =>
  gapFor(info, ...LINE_41_FORMS);

// Line 42: "Add line 40 and line 41" (the form).
export const line42TaxBeforeSpecialCredits: Form540NRLine<
  "1.line.42_tax_before_special_credits"
> = (form, info) => {
  const gap = gapFor(info, ...LINE_41_FORMS);
  if (gap) return gap;
  const tax = form["1.line.40_ca_regular_tax_before_credits"];
  return typeof tax === "number" ? sum(tax, form["1.line.41_tax_amount"]) : undefined;
};
