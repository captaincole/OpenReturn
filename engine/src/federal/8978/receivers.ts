/*
 * Where line 14 goes, the total of every Form 8978's line 14
 * (::example-2-completing-form-8978-and-schedule-a-for::b05, b06). Block ids
 * are in irs-1040-inst-2025::sec unless named.
 * - Above 0: Form 1040 line 16, box 3, "Form 8978" and the amount (::line-16::b02).
 * - Below 0: Schedule 3 line 6l up to Form 1040 line 18; the rest, up to the
 *   chapter 1 taxes of Schedule 2 Part II, on Schedule 2 line 17z as "Form
 *   8978 ADJ" (::line-6l::b01, ::line-9-3::b01, ::line-19-2::b01, b02), and
 *   Form 6251 line 10 and Form 1116 line 20 are lower by it.
 * Penalties and interest (lines 16 and 18) are paid with the return but are
 * not on it (irs-8978-inst-2025::sec::line-17::b02).
 */

import { formatDollars, numberOrBlank, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Form8978FilingInfo } from "./filingInfo.js";

type Accessor = { readonly [fieldId: string]: unknown };

export type ReportingYearTax =
  | { kind: "none" }
  | { kind: "gap"; reason: string }
  | { kind: "waits" }
  | { kind: "amount"; value: number };

/* The total of line 14 over the forms, or why it is not known. "none": Form 8978 does not file. */
export function reportingYearTax(info: Form8978FilingInfo): ReportingYearTax {
  const plan = info.form8978;
  if (info.mustFile?.["form-8978"]?.value !== true || plan === undefined) return { kind: "none" };
  if (plan.gap !== undefined) return { kind: "gap", reason: plan.gap };
  const totals = plan.copies.map((copy) => copy.totals);
  if (totals.some((each) => each === undefined)) return { kind: "waits" };
  return { kind: "amount", value: sum(...totals.map((each) => each?.line14)) };
}

/* The text after Form 1040 line 16 box 3 (::line-16::b02). */
export const FORM_8978_BOX_TEXT = "Form 8978";

/* Form 1040 line 16 with a positive line 14 added; the tax as it was otherwise. */
export function line16WithForm8978(
  info: Form8978FilingInfo,
  tax: number,
): number | Unsupported | undefined {
  const total = reportingYearTax(info);
  if (total.kind === "gap") return unsupported(total.reason);
  if (total.kind === "waits") return undefined;
  return total.kind === "amount" && total.value > 0 ? tax + total.value : tax;
}

/* The box 3 entry for Form 8978: "Form 8978" and the amount; undefined with none above 0. */
export function line16BoxEntry(info: Form8978FilingInfo): string | Unsupported | undefined {
  const total = reportingYearTax(info);
  if (total.kind === "gap") return unsupported(total.reason);
  if (total.kind !== "amount" || total.value <= 0) return undefined;
  return `${FORM_8978_BOX_TEXT} ${formatDollars(total.value)}`;
}

/* A negative line 14 as a positive number; 0 when it is not negative. */
const negativeAmount = (total: ReportingYearTax): number =>
  total.kind === "amount" && total.value < 0 ? -total.value : 0;

/*
 * Schedule 3 line 6l, the Negative Form 8978 Adjustment Worksheet (::line-9-3::b01):
 * line 1 is Form 1040 line 18, line 2 the negative amount; line 6l is line 2
 * when line 1 is at least line 2, else line 1. "none" when Form 8978 does not file.
 */
export function line6lFrom8978(
  form: Accessor,
  info: Form8978FilingInfo,
): number | Unsupported | undefined | "none" {
  const total = reportingYearTax(info);
  if (total.kind === "none") return "none";
  if (total.kind === "gap") return unsupported(total.reason);
  const negative = negativeAmount(total);
  if (negative === 0) return undefined;
  const line18 = numberOrBlank(form["form-1040.line.18"]);
  if (line18 === undefined) return undefined;
  return line18 >= negative ? negative : line18;
}

/*
 * Chapter 1 taxes in Part II of Schedule 2: every line but 4, 7, 9, 11–13,
 * 17k–17m and 17z, which hold other taxes (::line-19-2::b02). Line 10 has no
 * field. Line 17z's section 1294 deferred tax (Form 8621) is a chapter 1 tax
 * and is added by the caller.
 */
const CHAPTER_1_LINES = [
  "schedule-2.0.line.8_additional_tax_iras_tax_favored_accounts",
  "schedule-2.0.line.14_interest_tax_installment_residential_lots",
  "schedule-2.0.line.15_interest_deferred_tax_installment_sales",
  "schedule-2.0.line.16_recapture_low_income_housing_credit",
  "schedule-2.1.line.17a_recapture_other_credits_amount",
  "schedule-2.1.line.17b_recapture_federal_mortgage_subsidy",
  "schedule-2.1.line.17c_additional_tax_hsa_distributions",
  "schedule-2.1.line.17d_additional_tax_hsa_ineligible_individual",
  "schedule-2.1.line.17e_additional_tax_archer_msa_distributions",
  "schedule-2.1.line.17f_additional_tax_medicare_advantage_msa_distributions",
  "schedule-2.1.line.17g_recapture_charitable_contribution_fractional_interest",
  "schedule-2.1.line.17h_income_nonqualified_deferred_compensation_409a",
  "schedule-2.1.line.17i_compensation_nonqualified_deferred_compensation_457a",
  "schedule-2.1.line.17j_section_72m5_excess_benefits_tax",
  "schedule-2.1.line.17n_lookback_interest_section_167g_460b",
  "schedule-2.1.line.17o_tax_non_effectively_connected_income_nonresident_alien",
  "schedule-2.1.line.17p_interest_form8621_line16f_section_1291_fund",
  "schedule-2.1.line.17q_interest_form8621_line24",
  "schedule-2.1.line.19_recapture_net_epe_form4255_line1d",
] as const;

/* The type Schedule 2 line 17z lists for the adjustment (::line-19-2::b01). */
export const FORM_8978_ADJUSTMENT_TYPE = "Form 8978 ADJ";

/*
 * The Negative Form 8978 Adjustment Worksheet for Schedule 2 line 17z
 * (::line-19-2::b01): line 1 the chapter 1 taxes of Part II, line 2 what
 * line 6l could not take. The adjustment is minus line 2 when line 1 is more,
 * else minus line 1. Undefined when there is none.
 */
export function line17zAdjustment(
  form: Accessor,
  info: Form8978FilingInfo,
  otherChapter1Tax: number,
): number | Unsupported | undefined {
  const total = reportingYearTax(info);
  if (total.kind === "gap") return unsupported(total.reason);
  const negative = negativeAmount(total);
  const line18 = numberOrBlank(form["form-1040.line.18"]);
  if (negative === 0 || line18 === undefined || line18 >= negative) return undefined;
  const line2 = negative - line18;
  const line1 = sum(...CHAPTER_1_LINES.map((id) => form[id]), otherChapter1Tax);
  const adjustment = line1 > line2 ? line2 : line1;
  return adjustment > 0 ? -adjustment : undefined;
}

/*
 * A negative line 14 "(treated as a positive number)", 0 when it is not
 * negative or Form 8978 does not file: Form 6251 line 10
 * (irs-6251-inst-2025::sec::line-10::b01) and Form 1116 line 20
 * (irs-1116-inst-2025::sec::line-20::b02, "a positive Form 8978 adjustment is
 * already included in the tax reported on Form 1040, line 16, while a
 * negative tax adjustment is not") are lower by it.
 */
export function negativeReportingYearTax(
  info: Form8978FilingInfo,
): number | Unsupported | undefined {
  const total = reportingYearTax(info);
  if (total.kind === "gap") return unsupported(total.reason);
  if (total.kind === "waits") return undefined;
  return negativeAmount(total);
}

/* Why Schedule 3 line 6l is an engine gap, for the credit worksheets that add it; undefined otherwise. */
export function line6lGap(info: Form8978FilingInfo): string | undefined {
  const total = reportingYearTax(info);
  return total.kind === "gap" ? `Schedule 3 line 6l (Form 8978): ${total.reason}` : undefined;
}
