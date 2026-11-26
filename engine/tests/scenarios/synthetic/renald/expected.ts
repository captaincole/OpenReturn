/*
 * renald — LOCKED expected values, drafted from the engine's
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
  "form-3800": {
    engineFields: {
      // Line 1 — Credits not subject to the passive activity limit from Part III, line 2: combine
      "form-3800.0.line.1_credits_not_passive_limited": 28041,
      // Line 4 — Enter the portion of Part IV, line 6, column (f), that is from carryforwards to 2
      "form-3800.0.line.4_carryforwards_to_2025": 2000,
      // Line 6 — Add lines 1, 3, 4, and 5
      "form-3800.0.line.6_total_credits_not_allowed_tmt": 30041,
      // Line 7 — Regular tax before credits
      "form-3800.0.line.7_regular_tax_before_credits": 141485,
      // Line 9 — Add lines 7 and 8
      "form-3800.0.line.9_regular_tax_plus_amt": 141485,
      // Line 11 — Net income tax. Subtract line 10c from line 9
      "form-3800.0.line.11_net_income_tax": 141485,
      // Line 12 — Net regular tax. Subtract line 10c from line 7. If zero or less, enter -0-
      "form-3800.0.line.12_net_regular_tax": 141485,
      // Line 13 — Enter 25% (0.25) of the excess, if any, of line 12 (line 11 for corporations) ov
      "form-3800.0.line.13_25_percent_of_excess": 29121,
      // Line 14 — Tentative minimum tax
      "form-3800.0.line.14_tentative_minimum_tax": 112510,
      // Line 15 — Enter the greater of line 13 or line 14
      "form-3800.0.line.15_greater_of_line_13_or_14": 112510,
      // Line 16 — Subtract line 15 from line 11. If zero or less, enter -0-
      "form-3800.0.line.16_net_income_tax_less_line_15": 28975,
      // Line 17 — Enter the smaller of line 6 or line 16. This is the amount of your credit allowe
      "form-3800.0.line.17_credit_allowed_after_38c1_limit": 28975,
      // Line 18 — Multiply line 14 by 75% (0.75)
      "form-3800.1.line.18_multiply_line_14_by_75_percent": 84383,
      // Line 19 — Enter the greater of line 13 or line 18
      "form-3800.1.line.19_greater_of_line_13_or_18": 84383,
      // Line 20 — Subtract line 19 from line 11. If zero or less, enter -0-
      "form-3800.1.line.20_subtract_line_19_from_11": 57102,
      // Line 21 — Subtract line 17 from line 20. If zero or less, enter -0-
      "form-3800.1.line.21_subtract_line_17_from_20": 28127,
      // Line 22 — Combine the amounts from Part III, line 3, column (e), with the amount from Part
      "form-3800.1.line.22_empowerment_zone_credit_combined": 2200,
      // Line 25 — Add lines 22 and 24
      "form-3800.1.line.25_add_lines_22_and_24": 2200,
      // Line 26 — Empowerment zone and renewal community employment credit allowed. Enter the smal
      "form-3800.1.line.26_empowerment_zone_credit_allowed": 2200,
      // Line 27 — Subtract line 13 from line 11. If zero or less, enter -0-
      "form-3800.1.line.27_subtract_line_13_from_11": 112364,
      // Line 28 — Add lines 17 and 26
      "form-3800.1.line.28_add_lines_17_and_26": 31175,
      // Line 29 — Subtract line 28 from line 27. If zero or less, enter -0-
      "form-3800.1.line.29_subtract_line_28_from_27": 81189,
      // Line 30 — Enter the general business credit from line 5 of Part III: combine column (e) wi
      "form-3800.1.line.30_specified_general_business_credit": 4200,
      // Line 34 — Carryforward of business credit to 2025
      "form-3800.1.line.34_specified_credit_carryforward": 1000,
      // Line 36 — Add lines 30, 33, 34, and 35
      "form-3800.1.line.36_add_lines_30_33_34_35": 5200,
      // Line 37 — Enter the smaller of line 29 or line 36. This is the amount allowed for specifie
      "form-3800.1.line.37_specified_credits_allowed": 5200,
      // Line 38 — Credit allowed for the current year. Add lines 28 and 37
      "form-3800.1.line.38_credit_allowed_current_year": 36375,
      // Line 1c — Form 6765 — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.1c_form_6765_col_e": 23041,
      // Line 1c — Form 6765 — (g) Combine columns (e) and (f) with the credit from column (d) allo
      "form-3800.2.part3.1c_form_6765_col_g": 23041,
      // Line 1e — Form 8826 — (a) No. of items
      "form-3800.2.part3.1e_form_8826_col_a": 2,
      // Line 1e — Form 8826 — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.1e_form_8826_col_e": 5000,
      // Line 1e — Form 8826 — (g) Combine columns (e) and (f) with the credit from column (d) allo
      "form-3800.2.part3.1e_form_8826_col_g": 5000,
      // Line 2 — Add lines 1a–1zz — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.2_add_lines_1a_1zz_col_e": 28041,
      // Line 2 — Add lines 1a–1zz — (g) Combine columns (e) and (f) with the credit from column (d
      "form-3800.2.part3.2_add_lines_1a_1zz_col_g": 28041,
      // Line 3 — Form 8844: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.3_form_8844_col_e": 1500,
      // Line 3 — Form 8844: (g) Combine columns (e) and (f) with the credit from column (d) allowe
      "form-3800.3.part3.3_form_8844_col_g": 1500,
      // Line 4b — Form 5884: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.4b_form_5884_col_e": 2400,
      // Line 4b — Form 5884: (g) Combine columns (e) and (f) with the credit from column (d) allow
      "form-3800.3.part3.4b_form_5884_col_g": 2400,
      // Line 4h — Form 8941: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.4h_form_8941_col_e": 1800,
      // Line 4h — Form 8941: (g) Combine columns (e) and (f) with the credit from column (d) allow
      "form-3800.3.part3.4h_form_8941_col_g": 1800,
      // Line 5 — Add lines 4a–4z: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.5_add_lines_4a_4z_col_e": 4200,
      // Line 5 — Add lines 4a–4z: (g) Combine columns (e) and (f) with the credit from column (d)
      "form-3800.3.part3.5_add_lines_4a_4z_col_g": 4200,
      // Line 6 — Add lines 2, 3, and 5: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.6_add_lines_2_3_5_col_e": 33741,
      // Line 6 — Add lines 2, 3, and 5: (g) Combine columns (e) and (f) with the credit from colum
      "form-3800.3.part3.6_add_lines_2_3_5_col_g": 33741,
      // Line 1e, column (a) — Form 8826: No. of items
      "form-3800.4.part4.1e_form_8826_col_a": 2,
      // Line 1e, column (f) — Form 8826: Carryover not subject to passive activity limits
      "form-3800.4.part4.1e_form_8826_col_f": 2000,
      // Line 1e, column (g) — Form 8826: Amount of columns (e) and (f) applied against tax in Part
      "form-3800.4.part4.1e_form_8826_col_g": 2000,
      // Line 3 — Form 8844 — (f) Carryover not subject to passive activity limits
      "form-3800.5.part4.3_form_8844_col_f": 700,
      // Line 3 — Form 8844 — (g) Amount of columns (e) and (f) applied against tax in Part II
      "form-3800.5.part4.3_form_8844_col_g": 700,
      // Line 4b — Form 5884: (f) Carryover not subject to passive activity limits
      "form-3800.6.part4.4b_form_5884_col_f": 1200,
      // Line 4b — Form 5884: (g) Amount of columns (e) and (f) applied against tax in Part II
      "form-3800.6.part4.4b_form_5884_col_g": 1000,
      // Line 4b — Form 5884: (h) Amount of columns (e) and (f) recaptured or otherwise adjusted
      "form-3800.6.part4.4b_form_5884_col_h": 200,
      // Line 5 — Add lines 4a–4z: (f) Carryover not subject to passive activity limits
      "form-3800.6.part4.5_add_lines_4a_4z_col_f": 1200,
      // Line 5 — Add lines 4a–4z: (g) Amount of columns (e) and (f) applied against tax in Part II
      "form-3800.6.part4.5_add_lines_4a_4z_col_g": 1000,
      // Line 5 — Add lines 4a–4z: (h) Amount of columns (e) and (f) recaptured or otherwise adjust
      "form-3800.6.part4.5_add_lines_4a_4z_col_h": 200,
      // Line 6 — Add lines 1a through 2zz: (f) Carryover not subject to passive activity limits
      "form-3800.6.part4.6_add_lines_1a_2zz_col_f": 2000,
      // Line 6 — Add lines 1a through 2zz: (g) Amount of columns (e) and (f) applied against tax i
      "form-3800.6.part4.6_add_lines_1a_2zz_col_g": 2000,
      // Line 7 — Add lines 3, 5, and 6: (f) Carryover not subject to passive activity limits
      "form-3800.6.part4.7_add_lines_3_5_6_col_f": 3900,
      // Line 7 — Add lines 3, 5, and 6: (g) Amount of columns (e) and (f) applied against tax in P
      "form-3800.6.part4.7_add_lines_3_5_6_col_g": 3700,
      // Line 7 — Add lines 3, 5, and 6: (h) Amount of columns (e) and (f) recaptured or otherwise
      "form-3800.6.part4.7_add_lines_3_5_6_col_h": 200,
      // Part V, line 1, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.1_breakdown_col_e": 2143,
      // Part V, line 2, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.2_breakdown_col_e": 2857,
      // Line 1 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.1_breakdown_col_g": 2143,
      // Line 1 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.1_breakdown_col_h2": 2143,
      // Line 1 — (i)(1) Amount of column (h)(2) applied against tax in Part II
      "form-3800.7.part5.1_breakdown_col_i1": 2143,
      // Line 2 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.2_breakdown_col_g": 2857,
      // Line 2 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.2_breakdown_col_h2": 2857,
      // Line 2 — (i)(1) Amount of column (h)(2) applied against tax in Part II
      "form-3800.7.part5.2_breakdown_col_i1": 1791,
      // Line 2 — (k) Carryforward to 2026. Subtract column (i)(1) from column (h)(2)
      "form-3800.7.part5.2_breakdown_col_k": 1066,
      // Line 1 — (f) Carryover not subject to passive activity limits
      "form-3800.8.part6.1_breakdown_col_f": 900,
      // Line 1 — (g) Amount of columns (e) and (f) applied against tax in Part II
      "form-3800.8.part6.1_breakdown_col_g": 900,
      // Line 2 — (f) Carryover not subject to passive activity limits
      "form-3800.8.part6.2_breakdown_col_f": 1100,
      // Line 2 — (g) Amount of columns (e) and (f) applied against tax in Part II
      "form-3800.8.part6.2_breakdown_col_g": 1100,
    },
  },
  "form-6251": {
    engineFields: {
      // Line 1a — Subtract Schedule 1-A (Form 1040), line 37, from Form 1040, 1040-SR, or 1040-NR,
      "form-6251.0.line.1a_deductions_less_schedule_1a": 15750,
      // Line 1b — Subtract line 1a from Form 1040, 1040-SR, or 1040-NR, line 11b (if less than zer
      "form-6251.0.line.1b_taxable_income_start": 491250,
      // Line 2a — If filing Schedule A (Form 1040), enter the taxes from Schedule A, line 7; other
      "form-6251.0.line.2a_taxes_or_standard_deduction": 15750,
      // Line 4 — Alternative minimum taxable income. Combine lines 1b through 3
      "form-6251.0.line.4_alternative_minimum_taxable_income": 507000,
      // Line 5 — Exemption
      "form-6251.0.line.5_exemption": 88100,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-6251.0.line.6_amti_less_exemption": 418900,
      // Line 7 — Tax on line 6: complete Part III and enter line 40 if you have capital gain distr
      "form-6251.0.line.7_tax_on_line_6": 112510,
      // Line 9 — Tentative minimum tax. Subtract line 8 from line 7
      "form-6251.0.line.9_tentative_minimum_tax": 112510,
      // Line 10 — Add Form 1040 or 1040-SR, line 16 (minus any tax from Form 4972), and Schedule 2
      "form-6251.0.line.10_regular_tax_less_credits": 141485,
    },
  },
  "schedule-e": {
    engineFields: {
      // Line 28 row A — (k) Nonpassive income from Schedule K-1
      "schedule-e.1.line.28_row_a_col_k_nonpassive_income": 85000,
      // Line 28 row B — (k) Nonpassive income from Schedule K-1
      "schedule-e.1.line.28_row_b_col_k_nonpassive_income": 24000,
      // Line 28 row C — (k) Nonpassive income from Schedule K-1
      "schedule-e.1.line.28_row_c_col_k_nonpassive_income": 18000,
      // Line 29a — Totals, column (k) nonpassive income
      "schedule-e.1.line.29a_totals_col_k": 127000,
      // Line 30 — Add columns (h) and (k) of line 29a
      "schedule-e.1.line.30_add_income_columns": 127000,
      // Line 32 — Total partnership and S corporation income or (loss). Combine lines 30 and 31
      "schedule-e.1.line.32_total_partnership_s_corp_income": 127000,
      // Line 41 — Total income or (loss). Combine lines 26, 32, 37, 39, and 40
      "schedule-e.1.line.41_total_income_or_loss": 127000,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 5 — Rental real estate, royalties, partnerships, S corporations, trusts, etc. Attach
      "schedule-1.0.line.5": 127000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 127000,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 1620,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 1620,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 6a — General business credit. Attach Form 3800
      "schedule-3.0.line.6a": 36375,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 36375,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 36375,
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
      "form-8959.0.line.19_medicare_tax_withheld": 6440,
      // Line 20 — Enter the amount from line 1
      "form-8959.0.line.20_medicare_wages_from_line1": 380000,
      // Line 21 — Multiply line 20 by 1.45% (0.0145). Regular Medicare tax withholding on Medicare
      "form-8959.0.line.21_regular_medicare_tax_on_wages": 5510,
      // Line 22 — Subtract line 21 from line 19. If zero or less, enter -0-. Additional Medicare T
      "form-8959.0.line.22_additional_medicare_tax_withholding_wages": 930,
      // Line 24 — Total Additional Medicare Tax withholding. Add lines 22 and 23
      "form-8959.0.line.24_total_additional_medicare_tax_withholding": 930,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 380000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 380000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 127000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 507000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 507000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 507000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 491250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 141485,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 141485,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 36375,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 36375,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 105110,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 1620,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 106730,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 92000,
      // Line 25c — Federal income tax withheld from other forms (see instructions)
      "form-1040.line.25c": 930,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 92930,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 92930,
      // Line 37 — Amount you owe
      "form-1040.line.37": 13800,
    },
  },
};

export function renaldExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
