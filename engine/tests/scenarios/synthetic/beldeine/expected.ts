/*
 * beldeine — LOCKED expected values, drafted from the engine's
 * output on 2026-11-26 (scripts/draftExpected.ts).
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
  "schedule-e": {
    engineFields: {
      // Line 28 row A — (h) Passive income from Schedule K-1
      "schedule-e.1.line.28_row_a_col_h_passive_income": 10000,
      // Line 29a — Totals, column (h) passive income
      "schedule-e.1.line.29a_totals_col_h": 10000,
      // Line 30 — Add columns (h) and (k) of line 29a
      "schedule-e.1.line.30_add_income_columns": 10000,
      // Line 32 — Total partnership and S corporation income or (loss). Combine lines 30 and 31
      "schedule-e.1.line.32_total_partnership_s_corp_income": 10000,
      // Line 41 — Total income or (loss). Combine lines 26, 32, 37, 39, and 40
      "schedule-e.1.line.41_total_income_or_loss": 10000,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 5 — Rental real estate, royalties, partnerships, S corporations, trusts, etc. Attach
      "schedule-1.0.line.5": 10000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 10000,
    },
  },
  "form-8582-cr": {
    engineFields: {
      // Line 3a — Credits from Worksheet 3, column (a)
      "form-8582-cr.0.line.3a_low_income_post_1989_credits": 9000,
      // Line 3b — Prior year unallowed credits from Worksheet 3, column (b)
      "form-8582-cr.0.line.3b_low_income_post_1989_prior_unallowed": 2000,
      // Line 3c — Add lines 3a and 3b
      "form-8582-cr.0.line.3c_low_income_post_1989_total": 11000,
      // Line 4a — Credits from Worksheet 4, column (a)
      "form-8582-cr.0.line.4a_other_passive_credits": 4500,
      // Line 4b — Prior year unallowed credits from Worksheet 4, column (b)
      "form-8582-cr.0.line.4b_other_passive_prior_unallowed": 600,
      // Line 4c — Add lines 4a and 4b
      "form-8582-cr.0.line.4c_other_passive_total": 5100,
      // Line 5 — Add lines 1c, 2c, 3c, and 4c
      "form-8582-cr.0.line.5_total_passive_credits": 16100,
      // Line 6 — Enter the tax attributable to net passive income
      "form-8582-cr.0.line.6_tax_net_passive_income": 3500,
      // Line 7 — Subtract line 6 from line 5. If line 6 is more than or equal to line 5, enter -0-
      "form-8582-cr.0.line.7_credits_over_passive_tax": 12600,
      // Line 31 — If you completed Part III, enter the amount from line 19. Otherwise, subtract li
      "form-8582-cr.1.line.31_line_19_or_7_minus_16": 12600,
      // Line 33 — Subtract line 32 from line 31
      "form-8582-cr.1.line.33_line_31_minus_line_32": 12600,
      // Line 34 — Enter the smaller of line 3c or line 33
      "form-8582-cr.1.line.34_smaller_of_3c_or_33": 11000,
      // Line 35 — Tax attributable to the remaining special allowance (see instructions)
      "form-8582-cr.1.line.35_tax_remaining_special_allowance": 8750,
      // Line 36 — Enter the smaller of line 34 or line 35
      "form-8582-cr.1.line.36_smaller_of_34_or_35": 8750,
      // Line 37 — Passive Activity Credit Allowed. Add lines 6, 16, 30, and 36
      "form-8582-cr.1.line.37_passive_activity_credit_allowed": 12250,
    },
  },
  "form-3800": {
    engineFields: {
      // Line 7 — Regular tax before credits
      "form-3800.0.line.7_regular_tax_before_credits": 100535,
      // Line 9 — Add lines 7 and 8
      "form-3800.0.line.9_regular_tax_plus_amt": 100535,
      // Line 11 — Net income tax. Subtract line 10c from line 9
      "form-3800.0.line.11_net_income_tax": 100535,
      // Line 12 — Net regular tax. Subtract line 10c from line 7. If zero or less, enter -0-
      "form-3800.0.line.12_net_regular_tax": 100535,
      // Line 13 — Enter 25% (0.25) of the excess, if any, of line 12 (line 11 for corporations) ov
      "form-3800.0.line.13_25_percent_of_excess": 18884,
      // Line 14 — Tentative minimum tax
      "form-3800.0.line.14_tentative_minimum_tax": 79750,
      // Line 15 — Enter the greater of line 13 or line 14
      "form-3800.0.line.15_greater_of_line_13_or_14": 79750,
      // Line 16 — Subtract line 15 from line 11. If zero or less, enter -0-
      "form-3800.0.line.16_net_income_tax_less_line_15": 20785,
      // Line 18 — Multiply line 14 by 75% (0.75)
      "form-3800.1.line.18_multiply_line_14_by_75_percent": 59813,
      // Line 19 — Enter the greater of line 13 or line 18
      "form-3800.1.line.19_greater_of_line_13_or_18": 59813,
      // Line 20 — Subtract line 19 from line 11. If zero or less, enter -0-
      "form-3800.1.line.20_subtract_line_19_from_11": 40722,
      // Line 21 — Subtract line 17 from line 20. If zero or less, enter -0-
      "form-3800.1.line.21_subtract_line_17_from_20": 40722,
      // Line 23 — Passive activity credit from Part III, line 3, column (d), plus the amount from
      "form-3800.1.line.23_empowerment_zone_passive_credit": 1500,
      // Line 24 — Enter the applicable passive activity credit allowed for 2025
      "form-3800.1.line.24_empowerment_zone_passive_credit_allowed": 714,
      // Line 25 — Add lines 22 and 24
      "form-3800.1.line.25_add_lines_22_and_24": 714,
      // Line 26 — Empowerment zone and renewal community employment credit allowed. Enter the smal
      "form-3800.1.line.26_empowerment_zone_credit_allowed": 714,
      // Line 27 — Subtract line 13 from line 11. If zero or less, enter -0-
      "form-3800.1.line.27_subtract_line_13_from_11": 81651,
      // Line 28 — Add lines 17 and 26
      "form-3800.1.line.28_add_lines_17_and_26": 714,
      // Line 29 — Subtract line 28 from line 27. If zero or less, enter -0-
      "form-3800.1.line.29_subtract_line_28_from_27": 80937,
      // Line 32 — Passive activity credits from line 5 of Part III: combine column (d) with passiv
      "form-3800.1.line.32_specified_passive_activity_credits": 14600,
      // Line 33 — Enter the applicable passive activity credits allowed for 2025
      "form-3800.1.line.33_specified_passive_credits_allowed": 11536,
      // Line 36 — Add lines 30, 33, 34, and 35
      "form-3800.1.line.36_add_lines_30_33_34_35": 11536,
      // Line 37 — Enter the smaller of line 29 or line 36. This is the amount allowed for specifie
      "form-3800.1.line.37_specified_credits_allowed": 11536,
      // Line 38 — Credit allowed for the current year. Add lines 28 and 37
      "form-3800.1.line.38_credit_allowed_current_year": 12250,
      // Line 3 — Form 8844: (d) Credits subject to the passive activity limit, before application
      "form-3800.3.part3.3_form_8844_col_d": 1500,
      // Line 3 — Form 8844: (g) Combine columns (e) and (f) with the credit from column (d) allowe
      "form-3800.3.part3.3_form_8844_col_g": 714,
      // Line 4b — Form 5884: (d) Credits subject to the passive activity limit, before application
      "form-3800.3.part3.4b_form_5884_col_d": 3000,
      // Line 4b — Form 5884: (g) Combine columns (e) and (f) with the credit from column (d) allow
      "form-3800.3.part3.4b_form_5884_col_g": 1429,
      // Line 4d — Form 8586: (d) Credits subject to the passive activity limit, before application
      "form-3800.3.part3.4d_form_8586_col_d": 9000,
      // Line 4d — Form 8586: (g) Combine columns (e) and (f) with the credit from column (d) allow
      "form-3800.3.part3.4d_form_8586_col_g": 8036,
      // Line 5 — Add lines 4a–4z: (d) Credits subject to the passive activity limit, before applic
      "form-3800.3.part3.5_add_lines_4a_4z_col_d": 12000,
      // Line 5 — Add lines 4a–4z: (g) Combine columns (e) and (f) with the credit from column (d)
      "form-3800.3.part3.5_add_lines_4a_4z_col_g": 9465,
      // Line 6 — Add lines 2, 3, and 5: (d) Credits subject to the passive activity limit, before
      "form-3800.3.part3.6_add_lines_2_3_5_col_d": 13500,
      // Line 6 — Add lines 2, 3, and 5: (g) Combine columns (e) and (f) with the credit from colum
      "form-3800.3.part3.6_add_lines_2_3_5_col_g": 10179,
      // Line 4b — Form 5884: (d) Carryover subject to the passive activity limits, before the pass
      "form-3800.6.part4.4b_form_5884_col_d": 600,
      // Line 4b — Form 5884: (e) Carryover subject to the passive activity limits, after the passi
      "form-3800.6.part4.4b_form_5884_col_e": 286,
      // Line 4b — Form 5884: (g) Amount of columns (e) and (f) applied against tax in Part II
      "form-3800.6.part4.4b_form_5884_col_g": 286,
      // Line 4d — Form 8586 (post-2007): (d) Carryover subject to the passive activity limits, bef
      "form-3800.6.part4.4d_form_8586_post_2007_col_d": 2000,
      // Line 4d — Form 8586 (post-2007): (e) Carryover subject to the passive activity limits, aft
      "form-3800.6.part4.4d_form_8586_post_2007_col_e": 1785,
      // Line 4d — Form 8586 (post-2007): (g) Amount of columns (e) and (f) applied against tax in
      "form-3800.6.part4.4d_form_8586_post_2007_col_g": 1785,
      // Line 5 — Add lines 4a–4z: (d) Carryover subject to the passive activity limits, before the
      "form-3800.6.part4.5_add_lines_4a_4z_col_d": 2600,
      // Line 5 — Add lines 4a–4z: (e) Carryover subject to the passive activity limits, after the
      "form-3800.6.part4.5_add_lines_4a_4z_col_e": 2071,
      // Line 5 — Add lines 4a–4z: (g) Amount of columns (e) and (f) applied against tax in Part II
      "form-3800.6.part4.5_add_lines_4a_4z_col_g": 2071,
      // Line 7 — Add lines 3, 5, and 6: (d) Carryover subject to the passive activity limits, befo
      "form-3800.6.part4.7_add_lines_3_5_6_col_d": 2600,
      // Line 7 — Add lines 3, 5, and 6: (e) Carryover subject to the passive activity limits, afte
      "form-3800.6.part4.7_add_lines_3_5_6_col_e": 2071,
      // Line 7 — Add lines 3, 5, and 6: (g) Amount of columns (e) and (f) applied against tax in P
      "form-3800.6.part4.7_add_lines_3_5_6_col_g": 2071,
    },
  },
  "form-6251": {
    engineFields: {
      // Line 1a — Subtract Schedule 1-A (Form 1040), line 37, from Form 1040, 1040-SR, or 1040-NR,
      "form-6251.0.line.1a_deductions_less_schedule_1a": 15750,
      // Line 1b — Subtract line 1a from Form 1040, 1040-SR, or 1040-NR, line 11b (if less than zer
      "form-6251.0.line.1b_taxable_income_start": 374250,
      // Line 2a — If filing Schedule A (Form 1040), enter the taxes from Schedule A, line 7; other
      "form-6251.0.line.2a_taxes_or_standard_deduction": 15750,
      // Line 4 — Alternative minimum taxable income. Combine lines 1b through 3
      "form-6251.0.line.4_alternative_minimum_taxable_income": 390000,
      // Line 5 — Exemption
      "form-6251.0.line.5_exemption": 88100,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-6251.0.line.6_amti_less_exemption": 301900,
      // Line 7 — Tax on line 6: complete Part III and enter line 40 if you have capital gain distr
      "form-6251.0.line.7_tax_on_line_6": 79750,
      // Line 9 — Tentative minimum tax. Subtract line 8 from line 7
      "form-6251.0.line.9_tentative_minimum_tax": 79750,
      // Line 10 — Add Form 1040 or 1040-SR, line 16 (minus any tax from Form 4972), and Schedule 2
      "form-6251.0.line.10_regular_tax_less_credits": 100535,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 1620,
      // Line 12 — Net investment income tax. Attach Form 8960
      "schedule-2.0.line.12_net_investment_income_tax": 380,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 2000,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 6a — General business credit. Attach Form 3800
      "schedule-3.0.line.6a": 12250,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 12250,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 12250,
    },
  },
  "form-8959": {
    engineFields: {
      // Line 1 — Medicare wages and tips from Form W-2, box 5
      "form-8959.0.line.1_medicare_wages_tips": 380000,
      // Line 4 — Add lines 1 through 3
      "form-8959.0.line.4_total_medicare_wages": 380000,
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 200000,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-8959.0.line.6_excess_medicare_wages": 180000,
      // Line 7 — Additional Medicare Tax on Medicare wages. Multiply line 6 by 0.9% (0.009)
      "form-8959.0.line.7_additional_medicare_tax_wages": 1620,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 1620,
      // Line 19 — Medicare tax withheld from Form W-2, box 6
      "form-8959.0.line.19_medicare_tax_withheld": 7130,
      // Line 20 — Enter the amount from line 1
      "form-8959.0.line.20_medicare_wages_from_line1": 380000,
      // Line 21 — Multiply line 20 by 1.45% (0.0145). Regular Medicare tax withholding on Medicare
      "form-8959.0.line.21_regular_medicare_tax_on_wages": 5510,
      // Line 22 — Subtract line 21 from line 19. If zero or less, enter -0-. Additional Medicare T
      "form-8959.0.line.22_additional_medicare_tax_withholding_wages": 1620,
      // Line 24 — Total Additional Medicare Tax withholding. Add lines 22 and 23
      "form-8959.0.line.24_total_additional_medicare_tax_withholding": 1620,
    },
  },
  "form-8960": {
    engineFields: {
      // Line 4a — Rental real estate, royalties, partnerships, S corporations, trusts, trades or b
      "form-8960.0.line.4a": 10000,
      // Line 4c — Combine lines 4a and 4b
      "form-8960.0.line.4c": 10000,
      // Line 8 — Total investment income. Combine lines 1, 2, 3, 4c, 5d, 6, and 7
      "form-8960.0.line.8": 10000,
      // Line 12 — Net investment income. Subtract Part II, line 11, from Part I, line 8. If zero o
      "form-8960.0.line.12": 10000,
      // Line 13 — Modified adjusted gross income (see instructions)
      "form-8960.0.line.13": 390000,
      // Line 14 — Threshold based on filing status (see instructions)
      "form-8960.0.line.14": 200000,
      // Line 15 — Subtract line 14 from line 13. If zero or less, enter -0-
      "form-8960.0.line.15": 190000,
      // Line 16 — Enter the smaller of line 12 or line 15
      "form-8960.0.line.16": 10000,
      // Line 17 — Net investment income tax for individuals. Multiply line 16 by 3.8% (0.038)
      "form-8960.0.line.17": 380,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 380000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 380000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 10000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 390000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 390000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 390000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 374250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 100535,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 100535,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 12250,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 12250,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 88285,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 2000,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 90285,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 88000,
      // Line 25c — Federal income tax withheld from other forms (see instructions)
      "form-1040.line.25c": 1620,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 89620,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 89620,
      // Line 37 — Amount you owe
      "form-1040.line.37": 665,
    },
  },
};

export function beldeineExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
