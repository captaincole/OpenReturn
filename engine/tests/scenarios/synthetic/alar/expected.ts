/*
 * alar — LOCKED expected values, drafted from the engine's
 * output on 2026-11-27 (scripts/draftExpected.ts).
 *
 * UNVERIFIED: no CPA return or filed-return check stands behind these
 * values. They are engine output, checked by hand, so a failure means
 * "the engine changed", not "the engine is wrong".
 *
 * Edit by hand. Change a value only after you verify it against the form
 * instructions or a filed return (scripts/compareFiled).
 */

import type { ExpectedResults } from "../../../types.js";

const EXPECTED: Record<string, Partial<ExpectedResults>> = {
  "form-8609-a": {
    engineFields: {
      // Line 1 — Eligible basis of building
      "form-8609-a.0.line.1_eligible_basis_building": 900000,
      // Line 3 — Qualified basis of low-income building. Multiply line 1 by line 2
      "form-8609-a.0.line.3_qualified_basis_building": 720000,
      // Line 6 — Multiply line 3 or line 4 by the percentage on line 5
      "form-8609-a.0.line.6_multiply_3_or_4_by_5": 64800,
      // Line 13 — Credit for building before line 14 reduction. Subtract line 12 from line 6
      "form-8609-a.0.line.13_credit_before_line_14_reduction": 64800,
      // Line 15 — Credit allowed for building for tax year. Subtract line 14 from line 13, but do
      "form-8609-a.0.line.15_credit_allowed_for_building": 64800,
      // Line 16 — Taxpayer's proportionate share of credit for the year
      "form-8609-a.0.line.16_proportionate_share_of_credit": 64800,
      // Line 18 — Taxpayer's credit. Combine lines 16 and 17
      "form-8609-a.0.line.18_taxpayers_credit": 64800,
    },
  },
  "form-8586": {
    engineFields: {
      // Line 1 — Number of Forms 8609-A attached
      "form-8586.0.line.1_forms_8609a_attached": 1,
      // Line 3 — Current year credit from attached Form(s) 8609-A
      "form-8586.0.line.3_current_year_credit_8609a": 64800,
      // Line 4 — Low-income housing credit from partnerships, S corporations, estates, and trusts
      "form-8586.0.line.4_credit_from_pass_through": 4350,
      // Line 5 — Add lines 3 and 4
      "form-8586.0.line.5_add_lines": 69150,
    },
    renderedText: {
      // Line 2 (i) — the BIN of Sagebrush Terrace, whose basis decreased (item E "Yes", added by hand)
      "form-8586.0.line.2_i_decreased_basis_bin": "NV-19-00412",
    },
    renderedChecked: [
      // Line 2 — Yes: a building on line 1 had a decreased basis (added by hand)
      "form-8586.0.line.2_yes",
    ],
    renderedBlank: [
      // Line 2 No, row (ii), lines 6 and 7: an individual stops at line 5 (added by hand)
      "form-8586.0.line.2_no",
      "form-8586.0.line.2_ii_decreased_basis_bin",
      "form-8586.0.line.6_allocated_to_beneficiaries",
      "form-8586.0.line.7_subtract_6_from_5",
    ],
  },
  "form-8582-cr": {
    engineFields: {
      // Line 3a — Credits from Worksheet 3, column (a)
      "form-8582-cr.0.line.3a_low_income_post_1989_credits": 69150,
      // Line 3c — Add lines 3a and 3b
      "form-8582-cr.0.line.3c_low_income_post_1989_total": 69150,
      // Line 5 — Add lines 1c, 2c, 3c, and 4c
      "form-8582-cr.0.line.5_total_passive_credits": 69150,
      // Line 7 — Subtract line 6 from line 5. If line 6 is more than or equal to line 5, enter -0-
      "form-8582-cr.0.line.7_credits_over_passive_tax": 69150,
      // Line 31 — If you completed Part III, enter the amount from line 19. Otherwise, subtract li
      "form-8582-cr.1.line.31_line_19_or_7_minus_16": 69150,
      // Line 33 — Subtract line 32 from line 31
      "form-8582-cr.1.line.33_line_31_minus_line_32": 69150,
      // Line 34 — Enter the smaller of line 3c or line 33
      "form-8582-cr.1.line.34_smaller_of_3c_or_33": 69150,
      // Line 35 — Tax attributable to the remaining special allowance (see instructions)
      "form-8582-cr.1.line.35_tax_remaining_special_allowance": 7356,
      // Line 36 — Enter the smaller of line 34 or line 35
      "form-8582-cr.1.line.36_smaller_of_34_or_35": 7356,
      // Line 37 — Passive Activity Credit Allowed. Add lines 6, 16, 30, and 36
      "form-8582-cr.1.line.37_passive_activity_credit_allowed": 7356,
    },
  },
  "form-3800": {
    engineFields: {
      // Line 7 — Regular tax before credits
      "form-3800.0.line.7_regular_tax_before_credits": 45623,
      // Line 9 — Add lines 7 and 8
      "form-3800.0.line.9_regular_tax_plus_amt": 45623,
      // Line 11 — Net income tax. Subtract line 10c from line 9
      "form-3800.0.line.11_net_income_tax": 45623,
      // Line 12 — Net regular tax. Subtract line 10c from line 7. If zero or less, enter -0-
      "form-3800.0.line.12_net_regular_tax": 45623,
      // Line 13 — Enter 25% (0.25) of the excess, if any, of line 12 (line 11 for corporations) ov
      "form-3800.0.line.13_25_percent_of_excess": 5156,
      // Line 27 — Subtract line 13 from line 11. If zero or less, enter -0-
      "form-3800.1.line.27_subtract_line_13_from_11": 40467,
      // Line 29 — Subtract line 28 from line 27. If zero or less, enter -0-
      "form-3800.1.line.29_subtract_line_28_from_27": 40467,
      // Line 32 — Passive activity credits from line 5 of Part III: combine column (d) with passiv
      "form-3800.1.line.32_specified_passive_activity_credits": 69150,
      // Line 33 — Enter the applicable passive activity credits allowed for 2025
      "form-3800.1.line.33_specified_passive_credits_allowed": 7356,
      // Line 36 — Add lines 30, 33, 34, and 35
      "form-3800.1.line.36_add_lines_30_33_34_35": 7356,
      // Line 37 — Enter the smaller of line 29 or line 36. This is the amount allowed for specifie
      "form-3800.1.line.37_specified_credits_allowed": 7356,
      // Line 38 — Credit allowed for the current year. Add lines 28 and 37
      "form-3800.1.line.38_credit_allowed_current_year": 7356,
      // Line 4d — Form 8586: (a) No. of items
      "form-3800.3.part3.4d_form_8586_col_a": 2,
      // Line 4d — Form 8586: (d) Credits subject to the passive activity limit, before application
      "form-3800.3.part3.4d_form_8586_col_d": 69150,
      // Line 4d — Form 8586: (g) Combine columns (e) and (f) with the credit from column (d) allow
      "form-3800.3.part3.4d_form_8586_col_g": 7356,
      // Line 5 — Add lines 4a–4z: (d) Credits subject to the passive activity limit, before applic
      "form-3800.3.part3.5_add_lines_4a_4z_col_d": 69150,
      // Line 5 — Add lines 4a–4z: (g) Combine columns (e) and (f) with the credit from column (d)
      "form-3800.3.part3.5_add_lines_4a_4z_col_g": 7356,
      // Line 6 — Add lines 2, 3, and 5: (d) Credits subject to the passive activity limit, before
      "form-3800.3.part3.6_add_lines_2_3_5_col_d": 69150,
      // Line 6 — Add lines 2, 3, and 5: (g) Combine columns (e) and (f) with the credit from colum
      "form-3800.3.part3.6_add_lines_2_3_5_col_g": 7356,
      // Part V, line 1, column (d)(1) — Credits subject to the passive activity limit, before appl
      "form-3800.7.part5.1_breakdown_col_d1": 64800,
      // Part V, line 1, column (d)(4) — Credits from columns (d)(1) (less column (d)(2)) and (d)(3
      "form-3800.7.part5.1_breakdown_col_d4": 6893,
      // Part V, line 2, column (d)(1) — Credits subject to the passive activity limit, before appl
      "form-3800.7.part5.2_breakdown_col_d1": 4350,
      // Part V, line 2, column (d)(4) — Credits from columns (d)(1) (less column (d)(2)) and (d)(3
      "form-3800.7.part5.2_breakdown_col_d4": 463,
      // Line 1 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.1_breakdown_col_g": 6893,
      // Line 1 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.1_breakdown_col_h2": 6893,
      // Line 1 — (i)(1) Amount of column (h)(2) applied against tax in Part II
      "form-3800.7.part5.1_breakdown_col_i1": 6893,
      // Line 2 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.2_breakdown_col_g": 463,
      // Line 2 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.2_breakdown_col_h2": 463,
      // Line 2 — (i)(1) Amount of column (h)(2) applied against tax in Part II
      "form-3800.7.part5.2_breakdown_col_i1": 463,
    },
  },
  "form-8959": {
    engineFields: {
      // Line 1 — Medicare wages and tips from Form W-2, box 5
      "form-8959.0.line.1_medicare_wages_tips": 230000,
      // Line 4 — Add lines 1 through 3
      "form-8959.0.line.4_total_medicare_wages": 230000,
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 200000,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-8959.0.line.6_excess_medicare_wages": 30000,
      // Line 7 — Additional Medicare Tax on Medicare wages. Multiply line 6 by 0.9% (0.009)
      "form-8959.0.line.7_additional_medicare_tax_wages": 270,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 270,
      // Line 19 — Medicare tax withheld from Form W-2, box 6
      "form-8959.0.line.19_medicare_tax_withheld": 3605,
      // Line 20 — Enter the amount from line 1
      "form-8959.0.line.20_medicare_wages_from_line1": 230000,
      // Line 21 — Multiply line 20 by 1.45% (0.0145). Regular Medicare tax withholding on Medicare
      "form-8959.0.line.21_regular_medicare_tax_on_wages": 3335,
      // Line 22 — Subtract line 21 from line 19. If zero or less, enter -0-. Additional Medicare T
      "form-8959.0.line.22_additional_medicare_tax_withholding_wages": 270,
      // Line 24 — Total Additional Medicare Tax withholding. Add lines 22 and 23
      "form-8959.0.line.24_total_additional_medicare_tax_withholding": 270,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 270,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 270,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 6a — General business credit. Attach Form 3800
      "schedule-3.0.line.6a": 7356,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 7356,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 7356,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 230000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 230000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 230000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 230000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 230000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 214250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 45623,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 45623,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 7356,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 7356,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 38267,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 270,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 38537,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 46000,
      // Line 25c — Federal income tax withheld from other forms (see instructions)
      "form-1040.line.25c": 270,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 46270,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 46270,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 7733,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 7733,
    },
  },
};

export function alarExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
