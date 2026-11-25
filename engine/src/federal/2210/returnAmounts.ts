/*
 * The amounts Form 2210 takes from the rest of the return: Part I lines 1, 2,
 * 3 and 6, and Schedule AI column (d), the whole year. Every read is a full
 * field id, so any form's accessor works.
 */

import { atLeast, numberOrBlank, sum } from "../../money.js";
import type { Form1040FilingInfo } from "../1040/filingInfo.js";
import { netLongTermGain } from "../1040/qdcgInputs.js";
import { figuredForm8814 } from "../8814/totals.js";

export type ReturnAccessor = { readonly [fieldId: string]: unknown };

/* Part I line 2: the Schedule 2 lines irs-2210-inst-2025::sec::line-2::b01 lists, except line 9. */
export const LINE_2_SCHEDULE_2_LINES = [
  "schedule-2.0.line.4_self_employment_tax",
  /* "Line 8 (additional tax on distributions only)": the engine's line 8 is Form 5329 Part I. */
  "schedule-2.0.line.8_additional_tax_iras_tax_favored_accounts",
  "schedule-2.0.line.11_additional_medicare_tax",
  "schedule-2.0.line.12_net_investment_income_tax",
  "schedule-2.0.line.14_interest_tax_installment_residential_lots",
  "schedule-2.0.line.15_interest_deferred_tax_installment_sales",
  "schedule-2.0.line.16_recapture_low_income_housing_credit",
  "schedule-2.1.line.17a_recapture_other_credits_amount",
  "schedule-2.1.line.17c_additional_tax_hsa_distributions",
  "schedule-2.1.line.17d_additional_tax_hsa_ineligible_individual",
  "schedule-2.1.line.17e_additional_tax_archer_msa_distributions",
  "schedule-2.1.line.17f_additional_tax_medicare_advantage_msa_distributions",
  "schedule-2.1.line.17g_recapture_charitable_contribution_fractional_interest",
  "schedule-2.1.line.17h_income_nonqualified_deferred_compensation_409a",
  "schedule-2.1.line.17i_compensation_nonqualified_deferred_compensation_457a",
  "schedule-2.1.line.17j_section_72m5_excess_benefits_tax",
  "schedule-2.1.line.17l_tax_accumulation_distribution_trusts",
  "schedule-2.1.line.17z_other_taxes_amount",
  "schedule-2.1.line.19_recapture_net_epe_form4255_line1d",
] as const;

export const HOUSEHOLD_EMPLOYMENT_TAXES = "schedule-2.0.line.9_household_employment_taxes";
export const SELF_EMPLOYMENT_TAX = "schedule-2.0.line.4_self_employment_tax";

/*
 * Part I line 3 (irs-2210-inst-2025::sec::line-3::b01): EIC, the additional
 * child tax credit, the refundable American opportunity credit, the refundable
 * adoption credit, the premium tax credit, the credit for tax on fuels and the
 * section 1341 credit.
 */
export const LINE_3_REFUNDABLE_CREDITS = [
  "form-1040.line.27a",
  "form-1040.line.28",
  "form-1040.line.29",
  "form-1040.line.30",
  "schedule-3.0.line.9",
  "schedule-3.0.line.12",
  "schedule-3.0.line.13b",
] as const;

/* Schedule 3 lines 13a, 13c, 13d and 13z: the line 3 list neither names nor excludes them. */
export const LINE_3_UNNAMED_PAYMENTS = [
  "schedule-3.0.line.13a",
  "schedule-3.0.line.13c",
  "schedule-3.0.line.13d",
  "schedule-3.0.line.13z_amount",
] as const;

const hasAmount = (form: ReturnAccessor, id: string) => (numberOrBlank(form[id]) ?? 0) !== 0;

/* What Part I needs from the return; undefined while Form 1040 line 22 or 25d waits. */
export interface PartIReturnAmounts {
  taxAfterCredits: number;
  otherTaxesWithoutHousehold: number;
  householdEmploymentTaxes: number;
  refundableCredits: number;
  incomeTaxWithheld: number;
  withholding: number;
}

export function partIReturnAmounts(form: ReturnAccessor): PartIReturnAmounts | undefined {
  const line22 = numberOrBlank(form["form-1040.line.22"]);
  const line25d = numberOrBlank(form["form-1040.line.25d"]);
  if (line22 === undefined || line25d === undefined) return undefined;
  return {
    taxAfterCredits: line22,
    otherTaxesWithoutHousehold: sum(...LINE_2_SCHEDULE_2_LINES.map((id) => form[id])),
    householdEmploymentTaxes: sum(form[HOUSEHOLD_EMPLOYMENT_TAXES]),
    refundableCredits: sum(...LINE_3_REFUNDABLE_CREDITS.map((id) => form[id])),
    incomeTaxWithheld: line25d,
    /* Line 6: Form 1040 line 25d and Schedule 3 line 11 (irs-2210-inst-2025::sec::line-6::b01). */
    withholding: line25d + sum(form["schedule-3.0.line.11"]),
  };
}

/* Why Part I cannot be figured, or undefined. */
export function partIGap(form: ReturnAccessor, info: Form1040FilingInfo): string | undefined {
  if (LINE_3_UNNAMED_PAYMENTS.some((id) => hasAmount(form, id))) {
    return "Schedule 3 line 13a, 13c, 13d or 13z has an amount, and the Form 2210 line 3 instructions do not say whether it counts as a refundable credit.";
  }
  /*
   * Line 2 includes household employment taxes (irs-2210-inst-2025::sec::line-2::b01),
   * but Schedule 2 line 9 is blank when Schedule H line 9 is Yes (FUTA not
   * modeled), so the amount is not known. Form 1040 line 24 is blank then too.
   */
  if (form["schedule-h.0.line.9_yes"] === true) {
    return "Schedule H line 9 is Yes: the engine does not figure FUTA tax (Schedule H Part II), so the household employment taxes on Form 2210 line 2 (irs-2210-inst-2025::sec::line-2::b01) are not known.";
  }
  const farming = ["schedule-f", "form-4835"].some((id) => info.mustFile?.[id]?.value === true);
  if (farming) {
    return "Farm income is on the return: a filer whose gross income is at least two-thirds from farming or fishing uses 66 2/3% and Form 2210-F (irs-2210-inst-2025::sec::who-must-pay-the-underpayment::b01), and the engine does not figure that share.";
  }
  return undefined;
}

/* Schedule AI column (d): the year on the return (line 1 AGI through line 30). */
export interface YearColumnAmounts {
  adjustedGrossIncome: number;
  itemizedDeductions: number;
  qbiDeduction: number;
  qualifiedDividends: number;
  netCapitalGain: number;
  /* Line 16 without the Part I line 2 taxes: AMT, Form 4972 and Form 8814 tax. */
  taxesBeyondLine2: number;
  /* Line 18 without Part I line 3: the nonrefundable credits Form 1040 line 22 used. */
  nonrefundableCredits: number;
  selfEmploymentNetEarnings: number;
  socialSecurityWages: number;
}

/* Undefined while a Form 1040 line it needs waits. */
export function yearColumnAmounts(
  form: ReturnAccessor,
  info: Form1040FilingInfo,
): YearColumnAmounts | undefined {
  const agi = numberOrBlank(form["form-1040.line.11a"]);
  const line18 = numberOrBlank(form["form-1040.line.18"]);
  const line22 = numberOrBlank(form["form-1040.line.22"]);
  if (agi === undefined || line18 === undefined || line22 === undefined) return undefined;
  return {
    adjustedGrossIncome: agi,
    itemizedDeductions: sum(form["schedule-a.0.line.17_total_itemized_deductions"]),
    qbiDeduction: sum(form["form-1040.line.13a"]),
    qualifiedDividends: sum(form["form-1040.line.3a"]),
    netCapitalGain: netLongTermGain(form),
    taxesBeyondLine2: sum(
      form["schedule-2.0.line.2_alternative_minimum_tax"],
      info.form4972Tax,
      figuredForm8814(info.form8814Totals)?.line15,
    ),
    nonrefundableCredits: atLeast(0, line18 - line22),
    selfEmploymentNetEarnings: sum(form["schedule-se.0.line.6"]),
    socialSecurityWages: sum(form["schedule-se.0.line.8d"]),
  };
}

/*
 * Why Schedule AI cannot be figured from the return, or undefined: the line 14
 * instructions allow other tax computations (Form 8615, a Schedule 1-A
 * deduction, a Form 4952 election), and line 16 names no Schedule 2 line 1 tax.
 */
export function scheduleAIGap(form: ReturnAccessor, info: Form1040FilingInfo): string | undefined {
  if (info.mustFile?.["form-8615"]?.value === true) {
    return "Schedule AI line 14 with Form 8615 (tax for a child's unearned income) is not figured by period.";
  }
  if (hasAmount(form, "form-1040.line.13b")) {
    return "Schedule AI line 14 lets the filer adjust for Schedule 1-A deductions (irs-2210-inst-2025::sec::line-14::b01) without saying how by period.";
  }
  if (hasAmount(form, "form-4952.0.line.4g_elected_investment_income")) {
    return "Schedule AI line 14 with a Form 4952 line 4g election is not figured by period.";
  }
  if (hasAmount(form, "schedule-2.0.line.1z_total_lines_1a_through_1y")) {
    return "Schedule 2 line 1z (an excess advance premium tax credit or a credit repayment) is in Part I line 1, but Schedule AI line 16 (irs-2210-inst-2025::sec::line-16::b01) does not name it.";
  }
  return undefined;
}
