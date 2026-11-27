/*
 * Form 6765, Credit for Increasing Research Activities, for an individual with
 * research in a Schedule C business. Every line but 35 and 36 reads only facts
 * (resolveInfo.ts, figures.ts); line 28 goes to Form 3800 Part III line 1c or
 * 4i (form3800.ts), and without the section 280C election it comes off the
 * business's deduction (reduction.ts). Lines 2 to 4, 15 to 17 and 46 are a
 * corporation's basic research payments, and lines 31 and 32 an estate's or a
 * trust's: blank on an individual's return.
 */

import { defineForm, type FormAccessor } from "../../defineForm.js";
import type { Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { addCells, isGap } from "../3800/cells.js";
import { namesOnReturn } from "../returnNames.js";
import { asCell } from "./cells.js";
import type { ResearchFigures } from "./figures.js";
import type { Form6765FilingInfo } from "./filingInfo.js";
import { percentageText, type RegularCredit, type SimplifiedCredit } from "./lines.js";
import { line35Value, line36Value, payrollBox, payrollOf } from "./payroll.js";
import type { SectionF } from "./qualifiedExpenses.js";
import { sectionGBindings } from "./sectionG.js";
import type { Form6765 } from "./types.js";

type Info = Form6765FilingInfo;
type Value = number | string | Unsupported | undefined;

const figuresOf = (info: Info): ResearchFigures | undefined => info.researchCredit?.figures;

/* A Section A line; Section A's gap (line 6) stands for every line; blank when Section A is skipped. */
function regular(info: Info, pick: (lines: RegularCredit) => Value): Value {
  const lines = asCell(figuresOf(info)?.regular);
  return lines === undefined || isGap(lines) ? lines : pick(lines);
}

function simplified(info: Info, pick: (lines: SimplifiedCredit) => Value): Value {
  const lines = figuresOf(info)?.simplified;
  return lines === undefined ? undefined : pick(lines);
}

const sectionF = (info: Info, pick: (lines: SectionF) => number | undefined) => {
  const lines = figuresOf(info)?.sectionF;
  return lines === undefined ? undefined : pick(lines);
};

/* A yes or no box from the fact; blank while the form files with no fact. */
function answer(info: Info, read: (fact: NonNullable<Info["researchCredit"]>["fact"]) => boolean) {
  const fact = info.researchCredit?.fact;
  return fact === undefined ? undefined : read(fact);
}

/* Line 30: "Add lines 28 and 29"; blank with no credit figured. */
function line30Value(info: Info): Value {
  const research = info.researchCredit;
  if (research?.figures.line28 === undefined) return undefined;
  return addCells(asCell(research.figures.line28), research.line29);
}

const filed = (info: Info) => info.researchCredit !== undefined;

const HEADER_AND_SECTION_A = {
  "0.header.taxpayer_name": (_: unknown, info: Info) => namesOnReturn(info),
  // A joint return shows the SSN listed first on Form 1040, the taxpayer's.
  "0.header.identifying_number": (_: unknown, info: Info) => info.taxpayerSSN,
  // Item A: "Check 'Yes' to elect or 'No' to not elect" (irs-6765-inst-2025::sec::item-a-section-280c-election::b01).
  "0.header.a_reduced_credit_280c_yes": (_: unknown, info: Info) =>
    answer(info, (fact) => fact.reducedCreditElection),
  "0.header.a_reduced_credit_280c_no": (_: unknown, info: Info) =>
    answer(info, (fact) => !fact.reducedCreditElection),
  // Item B (item-b-controlled-group-common::b01).
  "0.header.b_controlled_group_yes": (_: unknown, info: Info) =>
    answer(info, (fact) => fact.controlledGroup),
  "0.header.b_controlled_group_no": (_: unknown, info: Info) =>
    answer(info, (fact) => !fact.controlledGroup),
  "0.line.1_energy_consortia_amounts": (_: unknown, info: Info) =>
    regular(info, (lines) => lines.line1),
  // Lines 2 to 4: "Enter the amounts the corporation (not to include S corporations ...) paid" (line-2::b01).
  "0.line.2_basic_research_payments": () => undefined,
  "0.line.3_qualified_organization_base_amount": () => undefined,
  "0.line.4_subtract_3_from_2": () => undefined,
  "0.line.5_total_qres_from_line_48": (_: unknown, info: Info) =>
    regular(info, (lines) => lines.line5),
  "0.line.6_percentage": (_: unknown, info: Info) =>
    regular(info, (lines) => percentageText(lines.line6)),
  "0.line.7_average_annual_gross_receipts": (_: unknown, info: Info) =>
    regular(info, (lines) => lines.line7),
  "0.line.8_multiply_7_by_6": (_: unknown, info: Info) => regular(info, (lines) => lines.line8),
  "0.line.9_subtract_8_from_5": (_: unknown, info: Info) => regular(info, (lines) => lines.line9),
  "0.line.10_multiply_5_by_50": (_: unknown, info: Info) => regular(info, (lines) => lines.line10),
  "0.line.11_smaller_of_9_or_10": (_: unknown, info: Info) =>
    regular(info, (lines) => lines.line11),
  "0.line.12_add_lines": (_: unknown, info: Info) => regular(info, (lines) => lines.line12),
  "0.line.13_regular_credit": (_: unknown, info: Info) =>
    regular(info, (lines) => asCell(figuresOf(info)?.creditGap) ?? lines.line13),
};

const SECTIONS_B_AND_C = {
  "0.line.14_energy_consortia_amounts": (_: unknown, info: Info) =>
    simplified(info, (lines) => lines.line14),
  // Lines 15 to 17: the line 2 and line 3 instructions, a corporation's payments.
  "0.line.15_basic_research_payments": () => undefined,
  "0.line.16_qualified_organization_base_amount": () => undefined,
  "0.line.17_subtract_16_from_15": () => undefined,
  "0.line.18_add_lines": (_: unknown, info: Info) => simplified(info, (lines) => lines.line18),
  "0.line.19_multiply_18_by_20": (_: unknown, info: Info) =>
    simplified(info, (lines) => lines.line19),
  "0.line.20_total_qres_from_line_48": (_: unknown, info: Info) =>
    simplified(info, (lines) => lines.line20),
  "0.line.21_prior_3_years_qres": (_: unknown, info: Info) =>
    simplified(info, (lines) => lines.line21),
  "0.line.22_divide_21_by_6": (_: unknown, info: Info) => simplified(info, (lines) => lines.line22),
  "0.line.23_subtract_22_from_20": (_: unknown, info: Info) =>
    simplified(info, (lines) => lines.line23),
  "0.line.24_multiply_23_by_14": (_: unknown, info: Info) =>
    simplified(info, (lines) => lines.line24),
  "0.line.25_add_lines": (_: unknown, info: Info) => simplified(info, (lines) => lines.line25),
  // Line 26, and line 13 above: a controlled group member enters its share of the group's credit (figures.ts).
  "0.line.26_alternative_simplified_credit": (_: unknown, info: Info) =>
    simplified(info, (lines) => asCell(figuresOf(info)?.creditGap) ?? lines.line26),
  "1.line.27_form_8932_wage_portion": (_: unknown, info: Info) =>
    figuresOf(info)?.line28 === undefined ? undefined : figuresOf(info)?.line27,
  "1.line.28_subtract_27_from_13_or_26": (_: unknown, info: Info) =>
    asCell(figuresOf(info)?.line28),
  "1.line.29_pass_through_research_credit": (_: unknown, info: Info) => info.researchCredit?.line29,
  "1.line.30_total_current_year_credit": (_: unknown, info: Info) => line30Value(info),
  // Lines 31 and 32: "Estates and trusts" (line-31::b01).
  "1.line.31_allocated_to_beneficiaries": () => undefined,
  "1.line.32_subtract_31_from_30": () => undefined,
};

const SECTIONS_D_E_F = {
  // Line 33a: "Check the box ... if you are a qualified small business electing" (line-33a::b01).
  "1.line.33a_qsb_payroll_tax_election": (_: unknown, info: Info) => payrollBox(info, () => true),
  "1.line.33b_payroll_tax_different_ein": (_: unknown, info: Info) =>
    payrollBox(info, (lines) => lines.differentEin),
  "1.line.34_elected_payroll_tax_credit": (_: unknown, info: Info) => {
    const payroll = payrollOf(info);
    return payroll === undefined || isGap(payroll) ? payroll : payroll.line34;
  },
  "1.line.35_gbc_carryforward_current_year": (form: FormAccessor<Form6765>, info: Info) =>
    line35Value(form, info),
  "1.line.36_payroll_tax_credit_amount": (form: FormAccessor<Form6765>, info: Info) =>
    line36Value(form, info),
  // Line 37: every business component, "not just the limited number ... in Section G" (line-37::b01).
  "1.line.37_business_components_count": (_: unknown, info: Info) =>
    info.researchCredit?.fact.businessComponentCount,
  // Line 38: officers' wages; a sole proprietorship has no officers (line-38::b01), so it is blank.
  "1.line.38_officers_wages_in_42": () => undefined,
  "1.line.39_acquire_dispose_business_yes": (_: unknown, info: Info) =>
    answer(info, (fact) => fact.acquiredOrDisposed),
  "1.line.39_acquire_dispose_business_no": (_: unknown, info: Info) =>
    answer(info, (fact) => !fact.acquiredOrDisposed),
  "1.line.40_new_qre_categories_yes": (_: unknown, info: Info) =>
    answer(info, (fact) => fact.newExpenseCategories),
  "1.line.40_new_qre_categories_no": (_: unknown, info: Info) =>
    answer(info, (fact) => !fact.newExpenseCategories),
  /*
   * Line 41: the ASC 730 Directive "does not apply to any taxpayer unless the
   * taxpayer uses these same U.S. GAAP financial statements to reconcile book
   * income to federal tax income on Schedule M-3" (line-41::b01), which an
   * individual does not file: No, and no amount.
   */
  "1.line.41_asc_730_directive_yes": (_: unknown, info: Info) => (filed(info) ? false : undefined),
  "1.line.41_asc_730_directive_no": (_: unknown, info: Info) => (filed(info) ? true : undefined),
  "1.line.41_appendix_c_line_19_amount": () => undefined,
  // Section F item A: "Section G will be optional for all filers for tax years beginning before 2026" (section-g-business-component::b01).
  "1.line.section_f_a_complete_section_g_yes": (_: unknown, info: Info) =>
    filed(info) ? false : undefined,
  "1.line.section_f_a_complete_section_g_no": (_: unknown, info: Info) =>
    filed(info) ? true : undefined,
  "1.line.42_total_qualified_wages": (_: unknown, info: Info) =>
    sectionF(info, (lines) => lines.line42),
  "1.line.43_total_supplies_cost": (_: unknown, info: Info) =>
    sectionF(info, (lines) => lines.line43),
  "1.line.44_total_computer_rental_cost": (_: unknown, info: Info) =>
    sectionF(info, (lines) => lines.line44),
  "1.line.45_contract_research_amount": (_: unknown, info: Info) =>
    sectionF(info, (lines) => lines.line45),
  // Line 46: "basic research payments from line 2", a corporation's (line-46::b01).
  "1.line.46_basic_research_payments": () => undefined,
  "1.line.47_add_lines": (_: unknown, info: Info) => sectionF(info, (lines) => lines.line47),
  "1.line.48_total_qres": (_: unknown, info: Info) => sectionF(info, (lines) => lines.line48),
};

export function register(): void {
  defineForm<Form6765, Info>("form-6765", {
    bindings: {
      ...HEADER_AND_SECTION_A,
      ...SECTIONS_B_AND_C,
      ...SECTIONS_D_E_F,
      ...sectionGBindings(),
    } as Parameters<typeof defineForm<Form6765, Info>>[1]["bindings"],

    // The SSN widget keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
