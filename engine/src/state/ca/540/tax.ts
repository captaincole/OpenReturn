/* Form 540 tax: lines 31 to 35. */

import { lookupCaRateSchedule } from "../../../data/caRateSchedule.js";
import { lookupTax } from "../../../data/taxTable.js";
import { atLeast, numberOrBlank, roundDollars, sum } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import { caExemptionCreditsAfterLimit } from "../../../worksheets/caAgiLimitation.js";
import { childTaxOnLine31 } from "../3800-ca/form.js";
import type { Form540FilingInfo } from "./filingInfo.js";
import type { Form540Form, Form540Line } from "./form540Binding.js";

const isUnsupported = (value: unknown): value is Unsupported =>
  typeof value === "object" && value !== null && "unsupported" in value;

// MANUAL EDIT: FTB sends line 19 over $100,000 to the Tax Rate Schedules.
function usesRateSchedule(taxableIncome: number | undefined): boolean | undefined {
  return typeof taxableIncome === "number" ? taxableIncome > 100000 : undefined;
}

// MANUAL EDIT: line 31 source checkbox: Tax Table up to $100,000, else Tax Rate Schedule.
export const line31TaxFromTaxTable: Form540Line<"line.31_tax_from_tax_table"> = (form) =>
  usesRateSchedule(form["line.19_taxable_income"]) === false;
export const line31TaxFromRateSchedule: Form540Line<"line.31_tax_from_rate_schedule"> = (form) =>
  usesRateSchedule(form["line.19_taxable_income"]);

// MANUAL EDIT: Tax Table ("ca-2025") up to $100,000 of line 19; above it, Tax Rate Schedules X/Y/Z.
function taxOnTaxableIncome(form: Form540Form, info: Form540FilingInfo): number | undefined {
  if (!info.filingStatus) return undefined;
  const income = form["line.19_taxable_income"];
  if (typeof income !== "number") return undefined;
  if (income === 0) return 0; // the table starts at $1
  if (usesRateSchedule(income)) {
    return roundDollars(lookupCaRateSchedule(2025, info.filingStatus, income));
  }
  const lookup = lookupTax("ca-2025", income, info.filingStatus);
  return lookup.ok ? lookup.tax : undefined;
}

/*
 * MANUAL EDIT: a child's tax is FTB 3800 line 18 when that form figures it
 * (ca-540-inst-2025::sec::line-31-tax::b01, ca-3800-inst-2025::sec::part-iii-child-s-tax::b03);
 * otherwise the table or schedules. Blank while FTB 3800 waits, unsupported with its gap.
 */
function taxOnLine31(form: Form540Form, info: Form540FilingInfo) {
  const child = childTaxOnLine31(form, info);
  return child === "regular" ? taxOnTaxableIncome(form, info) : child;
}

/*
 * MANUAL EDIT: plus the tax "from each form FTB 3803, line 9"
 * (ca-540-inst-2025::sec::line-31-tax::b02). Blank while an FTB 3803 waits,
 * unsupported with its gap.
 */
export const line31TaxAmount: Form540Line<"line.31_tax_amount"> = (form, info) => {
  const tax = taxOnLine31(form, info);
  if (isUnsupported(tax)) return tax;
  const ftb3803 = info.form3803Totals;
  if (info.mustFile?.["form-3803"]?.value !== true || ftb3803 === undefined) return tax;
  if (ftb3803.kind === "waits") return undefined;
  if (ftb3803.kind === "unsupported") return unsupported(ftb3803.reason);
  return tax === undefined ? undefined : tax + ftb3803.line9;
};

// MANUAL EDIT: the FTB 3800 box (ca-3800-inst-2025::sec::part-iii-child-s-tax::b03) when line 31 holds FTB 3800 line 18.
export const line31TaxFromFtb3800: Form540Line<"line.31_tax_from_ftb_3800"> = (form, info) => {
  const child = childTaxOnLine31(form, info);
  if (child === undefined || isUnsupported(child)) return child;
  return typeof child === "number" ? true : undefined;
};

// MANUAL EDIT: the FTB 3803 box (ca-540-inst-2025::sec::line-31-tax::b01) when the parents attach one.
export const line31TaxFromFtb3803: Form540Line<"line.31_tax_from_ftb_3803"> = (_, info) =>
  info.mustFile?.["form-3803"]?.value === true && info.form3803Totals !== undefined
    ? true
    : undefined;

/*
 * MANUAL EDIT: line 11, limited by the AGI Limitation Worksheet.
 */
export const line32ExemptionCredits: Form540Line<"line.32_exemption_credits"> = (form, info) => {
  const agi = form["line.13_federal_agi"];
  const count = form["line.7_personal_exemption_count"];
  if (!info.filingStatus || typeof agi !== "number" || typeof count !== "number") {
    return sum(form["line.11_total_exemption_amount"]);
  }
  return caExemptionCreditsAfterLimit({
    filingStatus: info.filingStatus,
    federalAgi: agi,
    // Worksheet line f: the exemptions on lines 7, 8, and 9.
    personalCount: sum(
      count,
      form["line.8_blind_exemption_count"],
      form["line.9_senior_exemption_count"],
    ),
    personalAmount: sum(
      form["line.7_personal_exemption_amount"],
      form["line.8_blind_exemption_amount"],
      form["line.9_senior_exemption_amount"],
    ),
    dependentCount: sum(form["line.10_dependent_exemption_count"]),
    dependentAmount: sum(form["line.10_dependent_exemption_amount"]),
  });
};

export const line33TaxAfterExemptionCredits: Form540Line<"line.33_tax_after_exemption_credits"> = (
  form,
) => {
  const tax = form["line.31_tax_amount"];
  if (typeof tax !== "number") return undefined;
  return atLeast(
    0,
    sum(
      tax,
      form["line.32_exemption_credits"] === undefined ? 0 : -form["line.32_exemption_credits"],
    ),
  );
};

const filesScheduleG1 = (info: Form540FilingInfo) =>
  info.mustFile?.["schedule-g-1"]?.value === true;

const files5870A = (info: Form540FilingInfo) => info.mustFile?.["form-5870a"]?.value === true;

/*
 * FTB 5870A's tax: "Enter the amount from line 26 [Part II: line 14, line 16]
 * on Form 540, line 34 ... Check the box labeled 'FTB 5870A'"
 * (ca-5870a-inst-2025::sec::part-i-tax-on-accumulation-distribution::b06,
 * ::section-a::b04, ::section-b::b04). The amount, the form's gap, or
 * undefined while it waits or the form does not file.
 */
function trustTax(info: Form540FilingInfo): number | Unsupported | undefined {
  if (!files5870A(info)) return undefined;
  const carried = info.form5870ATax;
  if (carried === undefined || carried === "waits") return undefined;
  return "gap" in carried ? unsupported(carried.gap) : carried.amount;
}

/*
 * Schedule G-1's tax: line 28, or line 7 when only Part II is used ("Otherwise,
 * enter the amount from line 7 on Form 540, line 34", the blank Schedule G-1).
 * Both lines come from one evaluation of the schedule, so line 7 never stands
 * in for a line 28 that is still to come.
 */
function scheduleG1Tax(form: Form540Form): number | undefined {
  return (
    numberOrBlank(form["schedule-g-1.0.line.28_tax_on_lump_sum_distribution"]) ??
    numberOrBlank(form["schedule-g-1.0.line.7_capital_gain_election_tax"])
  );
}

/*
 * Line 34 (ca-540-inst-2025::sec::line-34-tax-from-schedule-g-1-and-form-ftb-5870a::b01):
 * the tax from Schedule G-1 and from FTB 5870A. Blank when neither files; it
 * waits while a form that files has its tax still to come.
 */
export const line34TaxAmount: Form540Line<"line.34_tax_amount"> = (form, info) => {
  const lumpSumTax = filesScheduleG1(info) ? scheduleG1Tax(form) : undefined;
  if (!files5870A(info)) return lumpSumTax;
  const trusts = trustTax(info);
  if (trusts === undefined || isUnsupported(trusts)) return trusts;
  if (filesScheduleG1(info) && lumpSumTax === undefined) return undefined;
  return trusts === 0 && lumpSumTax === undefined ? undefined : sum(trusts, lumpSumTax);
};

/* Line 34's Schedule G-1 box: checked when the schedule's tax is on the line. */
export const line34TaxFromScheduleG1: Form540Line<"line.34_tax_from_schedule_g1"> = (form, info) =>
  filesScheduleG1(info) && scheduleG1Tax(form) !== undefined ? true : undefined;

/* Line 34's FTB 5870A box: checked when the form's tax above 0 is on the line. */
export const line34TaxFromFtb5870A: Form540Line<"line.34_tax_from_ftb_5870a"> = (_, info) => {
  const trusts = trustTax(info);
  return typeof trusts === "number" && trusts !== 0 ? true : undefined;
};

/* "Add line 33 and line 34" (the form); waits while Schedule G-1 files and line 34 waits. */
export const line35TotalTaxAfterCredits: Form540Line<"line.35_total_tax_after_credits"> = (
  form,
  info,
) => {
  const tax = form["line.33_tax_after_exemption_credits"];
  if (typeof tax !== "number") return undefined;
  const lumpSumTax = form["line.34_tax_amount"];
  if (filesScheduleG1(info) && typeof lumpSumTax !== "number") return undefined;
  // MANUAL EDIT: FTB 5870A files with its tax still unknown (a wait or a gap): the total waits too.
  if (files5870A(info) && typeof trustTax(info) !== "number") return undefined;
  return sum(tax, lumpSumTax);
};
