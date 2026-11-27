/*
 * Schedule CA (540NR) Part IV, California Taxable Income: the deductions in
 * the ratio of California AGI to total AGI
 * (ftb-pub-1100-2025::sec::california-itemized-or-standard-deductions::b01).
 */

import type { BindingFn, FormAccessor } from "../../../defineForm.js";
import { numberOrBlank, wholePart } from "../../../money.js";
import { caShare, californiaTaxableIncome, prorated, ratioDigits } from "../540nr/lines.js";
import { partIIUnsupported } from "../schedule-ca/increasedStandard.js";
import { columnDOf, columnEOf, columnEValue } from "./columns.js";
import type { ScheduleCa540NRFilingInfo } from "./filingInfo.js";
import type { ScheduleCa540NR } from "./types.js";

type Info = ScheduleCa540NRFilingInfo;
type Line<K extends keyof ScheduleCa540NR> = BindingFn<ScheduleCa540NR, Info, K>;

// Line 1: "Enter your California AGI from Part II, line 27, column E" (::line-1-california-agi::b01).
export const line1CaliforniaAgi: Line<"4.part4.1_california_agi"> = (form, info) =>
  columnEValue(columnEOf(form, info, "c27"));

// Line 2: "Enter the amount from Part III, line 30" (the form); Part III's gap carries.
export const line2Deductions: Line<"4.part4.2_deductions_from_line_30"> = (form, info) =>
  numberOrBlank(form["4.part3.30_itemized_or_standard_deduction"]) ?? partIIUnsupported(info);

/*
 * Line 3: "Divide Part II, line 27, column E by Part II, line 27, column D.
 * Carry the decimal to four places. This number may not be greater than
 * 1.0000" (::line-3-deduction-percentage::b01).
 */
function deductionPercentage(form: FormAccessor<ScheduleCa540NR>): number | undefined {
  const californiaAgi = numberOrBlank(form["4.part4.1_california_agi"]);
  const totalAgi = columnDOf(form, "c27");
  if (californiaAgi === undefined || totalAgi === undefined) return undefined;
  return caShare(californiaAgi, totalAgi);
}

export const line3PercentageWholeDigit: Line<"4.part4.3_deduction_percentage_whole_digit"> = (
  form,
) => {
  const share = deductionPercentage(form);
  return share === undefined ? undefined : wholePart(share);
};
export const line3PercentageDecimalDigits: Line<"4.part4.3_deduction_percentage_decimal_digits"> = (
  form,
) => {
  const share = deductionPercentage(form);
  return share === undefined ? undefined : ratioDigits(share).decimals;
};

// Line 4: "Multiply line 2 by line 3" (the form).
export const line4ProratedDeductions: Line<"4.part4.4_california_deductions_prorated"> = (form) => {
  const share = deductionPercentage(form);
  const deductions = numberOrBlank(form["4.part4.2_deductions_from_line_30"]);
  if (share === undefined || deductions === undefined) return undefined;
  return prorated(deductions, share);
};

// Line 5: line 1 less line 4, not less than 0; Form 540NR line 35 (::line-5-california-taxable-income::b01).
export const line5CaliforniaTaxableIncome: Line<"4.part4.5_california_taxable_income"> = (form) => {
  const californiaAgi = numberOrBlank(form["4.part4.1_california_agi"]);
  const deductions = numberOrBlank(form["4.part4.4_california_deductions_prorated"]);
  if (californiaAgi === undefined || deductions === undefined) return undefined;
  return californiaTaxableIncome(californiaAgi, deductions);
};
