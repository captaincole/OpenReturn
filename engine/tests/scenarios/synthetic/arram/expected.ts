/*
 * arram — LOCKED expected values, drafted from the engine's
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
      // Line 2 — Fair Rental Days (Property A)
      "schedule-e.0.line.2_fair_rental_days_a": 365,
      // Line 3 — Rents received (Property A)
      "schedule-e.0.line.3_rents_received_a": 24000,
      // Line 9 — Insurance (Property A)
      "schedule-e.0.line.9_insurance_a": 1800,
      // Line 12 — Mortgage interest paid to banks, etc. (Property A)
      "schedule-e.0.line.12_mortgage_interest_a": 14000,
      // Line 14 — Repairs (Property A)
      "schedule-e.0.line.14_repairs_a": 2700,
      // Line 16 — Taxes (Property A)
      "schedule-e.0.line.16_taxes_a": 4500,
      // Line 18 — Depreciation expense or depletion (Property A)
      "schedule-e.0.line.18_depreciation_or_depletion_a": 7000,
      // Line 20 — Total expenses. Add lines 5 through 19 (Property A)
      "schedule-e.0.line.20_total_expenses_a": 30000,
      // Line 21 — Subtract line 20 from line 3 (rents) and/or 4 (royalties) (Property A)
      "schedule-e.0.line.21_income_or_loss_a": -6000,
      // Line 22 — Deductible rental real estate loss after limitation, if any, on Form 8582 (Prope
      "schedule-e.0.line.22_deductible_loss_a": 6000,
      // Line 23a — Total of all amounts reported on line 3 for all rental properties
      "schedule-e.0.line.23a_total_rents": 24000,
      // Line 23c — Total of all amounts reported on line 12 for all properties
      "schedule-e.0.line.23c_total_mortgage_interest": 14000,
      // Line 23d — Total of all amounts reported on line 18 for all properties
      "schedule-e.0.line.23d_total_depreciation": 7000,
      // Line 23e — Total of all amounts reported on line 20 for all properties
      "schedule-e.0.line.23e_total_expenses": 30000,
      // Line 25 — Losses. Add royalty losses from line 21 and rental real estate losses from line
      "schedule-e.0.line.25_losses": 6000,
      // Line 26 — Total rental real estate and royalty income or (loss). Combine lines 24 and 25
      "schedule-e.0.line.26_total_income_or_loss": -6000,
      // Line 41 — Total income or (loss). Combine lines 26, 32, 37, 39, and 40
      "schedule-e.1.line.41_total_income_or_loss": -6000,
    },
  },
  "form-8582": {
    engineFields: {
      // Line 1b — Rental real estate activities with active participation: activities with net los
      "form-8582.0.line.1b_rental_net_loss": 6000,
      // Line 1d — Combine lines 1a, 1b, and 1c
      "form-8582.0.line.1d_rental_combined": -6000,
      // Line 3 — Combine lines 1d and 2d and subtract any prior year unallowed CRD
      "form-8582.0.line.3_combined": -6000,
      // Line 4 — Enter the smaller of the loss on line 1d or the loss on line 3
      "form-8582.0.line.4_smaller_loss_1d_or_3": 6000,
      // Line 5 — Enter $150,000. If married filing separately, see instructions
      "form-8582.0.line.5_allowance_threshold": 150000,
      // Line 6 — Enter modified adjusted gross income, but not less than zero
      "form-8582.0.line.6_modified_agi": 118000,
      // Line 7 — Subtract line 6 from line 5
      "form-8582.0.line.7_line5_minus_line6": 32000,
      // Line 8 — Multiply line 7 by 50% (0.50). Do not enter more than $25,000
      "form-8582.0.line.8_half_of_line7": 16000,
      // Line 9 — Enter the smaller of line 4 or line 8
      "form-8582.0.line.9_special_allowance": 6000,
      // Line 11 — Total losses allowed from all passive activities for 2025. Add lines 9 and 10
      "form-8582.0.line.11_total_losses_allowed": 6000,
      // Part IV Row 1 — (b) Current year net loss (line 1b)
      "form-8582.0.part4.row_1_col_b_net_loss": 6000,
      // Part IV Row 1 — (e) Overall loss
      "form-8582.0.part4.row_1_col_e_loss": 6000,
      // Part IV Total — (b) Current year net loss (line 1b)
      "form-8582.0.part4.total_col_b_net_loss": 6000,
      // Part VI, row 1 — (a) Loss
      "form-8582.1.part6.row_1_col_a_loss": 6000,
      // Part VI, row 1 — (c) Special allowance
      "form-8582.1.part6.row_1_col_c_special_allowance": 6000,
      // Part VI total — (a) Loss
      "form-8582.1.part6.total_col_a_loss": 6000,
      // Part VI total — (c) Special allowance
      "form-8582.1.part6.total_col_c_special_allowance": 6000,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 5 — Rental real estate, royalties, partnerships, S corporations, trusts, etc. Attach
      "schedule-1.0.line.5": -6000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": -6000,
    },
  },
  "form-8582-cr": {
    engineFields: {
      // Line 1a — Credits from Worksheet 1, column (a)
      "form-8582-cr.0.line.1a_rental_active_credits": 3700,
      // Line 1b — Prior year unallowed credits from Worksheet 1, column (b)
      "form-8582-cr.0.line.1b_rental_active_prior_unallowed": 700,
      // Line 1c — Add lines 1a and 1b
      "form-8582-cr.0.line.1c_rental_active_total": 4400,
      // Line 2a — Credits from Worksheet 2, column (a)
      "form-8582-cr.0.line.2a_rehab_pre_1990_credits": 1000,
      // Line 2b — Prior year unallowed credits from Worksheet 2, column (b)
      "form-8582-cr.0.line.2b_rehab_pre_1990_prior_unallowed": 400,
      // Line 2c — Add lines 2a and 2b
      "form-8582-cr.0.line.2c_rehab_pre_1990_total": 1400,
      // Line 3a — Credits from Worksheet 3, column (a)
      "form-8582-cr.0.line.3a_low_income_post_1989_credits": 4000,
      // Line 3b — Prior year unallowed credits from Worksheet 3, column (b)
      "form-8582-cr.0.line.3b_low_income_post_1989_prior_unallowed": 1000,
      // Line 3c — Add lines 3a and 3b
      "form-8582-cr.0.line.3c_low_income_post_1989_total": 5000,
      // Line 5 — Add lines 1c, 2c, 3c, and 4c
      "form-8582-cr.0.line.5_total_passive_credits": 10800,
      // Line 6 — Form 8582 line 3 is a loss: no net passive income, "enter -0-" (hand-added zero)
      "form-8582-cr.0.line.6_tax_net_passive_income": 0,
      // Line 7 — Subtract line 6 from line 5. If line 6 is more than or equal to line 5, enter -0-
      "form-8582-cr.0.line.7_credits_over_passive_tax": 10800,
      // Line 8 — Enter the smaller of line 1c or line 7
      "form-8582-cr.0.line.8_smaller_line_1c_or_7": 4400,
      // Line 9 — Enter $150,000. If married filing separately, see instructions
      "form-8582-cr.0.line.9_150000_threshold": 150000,
      // Line 10 — Enter modified adjusted gross income, but not less than zero
      "form-8582-cr.0.line.10_modified_agi": 118000,
      // Line 11 — Subtract line 10 from line 9
      "form-8582-cr.0.line.11_threshold_less_magi": 32000,
      // Line 12 — Multiply line 11 by 50% (0.50). Do not enter more than $25,000
      "form-8582-cr.0.line.12_half_of_line_11": 16000,
      // Line 13 — Enter the amount, if any, from line 9 of Form 8582
      "form-8582-cr.0.line.13_form_8582_line_9": 6000,
      // Line 14 — Subtract line 13 from line 12
      "form-8582-cr.0.line.14_remaining_special_allowance": 10000,
      // Line 15 — Enter the tax attributable to the amount on line 14
      "form-8582-cr.0.line.15_tax_on_line_14": 2200,
      // Line 16 — Enter the smaller of line 8 or line 15
      "form-8582-cr.0.line.16_smaller_line_8_or_15": 2200,
      // Line 17 — Enter the amount from line 7
      "form-8582-cr.1.line.17_amount_from_line_7": 10800,
      // Line 18 — Enter the amount from line 16
      "form-8582-cr.1.line.18_amount_from_line_16": 2200,
      // Line 19 — Subtract line 18 from line 17
      "form-8582-cr.1.line.19_line_17_minus_line_18": 8600,
      // Line 20 — Enter the smaller of line 2c or line 19
      "form-8582-cr.1.line.20_smaller_of_2c_or_19": 1400,
      // Line 21 — Enter $250,000. If married filing separately, see instructions
      "form-8582-cr.1.line.21_income_limit_250000": 250000,
      // Line 22 — Enter modified adjusted gross income, but not less than zero
      "form-8582-cr.1.line.22_modified_adjusted_gross_income": 118000,
      // Line 23 — Subtract line 22 from line 21
      "form-8582-cr.1.line.23_line_21_minus_line_22": 132000,
      // Line 24 — Multiply line 23 by 50% (0.50). Do not enter more than $25,000. If married filin
      "form-8582-cr.1.line.24_half_of_line_23": 25000,
      // Line 25 — Enter the amount, if any, from line 9 of Form 8582
      "form-8582-cr.1.line.25_form_8582_line_9": 6000,
      // Line 26 — Subtract line 25 from line 24
      "form-8582-cr.1.line.26_line_24_minus_line_25": 19000,
      // Line 27 — Enter the tax attributable to the amount on line 26 (see instructions)
      "form-8582-cr.1.line.27_tax_attributable_to_line_26": 4180,
      // Line 28 — Enter the amount, if any, from line 18
      "form-8582-cr.1.line.28_amount_from_line_18": 2200,
      // Line 29 — Subtract line 28 from line 27
      "form-8582-cr.1.line.29_line_27_minus_line_28": 1980,
      // Line 30 — Enter the smaller of line 20 or line 29
      "form-8582-cr.1.line.30_smaller_of_20_or_29": 1400,
      // Line 31 — If you completed Part III, enter the amount from line 19. Otherwise, subtract li
      "form-8582-cr.1.line.31_line_19_or_7_minus_16": 8600,
      // Line 32 — Enter the amount from line 30
      "form-8582-cr.1.line.32_amount_from_line_30": 1400,
      // Line 33 — Subtract line 32 from line 31
      "form-8582-cr.1.line.33_line_31_minus_line_32": 7200,
      // Line 34 — Enter the smaller of line 3c or line 33
      "form-8582-cr.1.line.34_smaller_of_3c_or_33": 5000,
      // Line 35 — Tax attributable to the remaining special allowance (see instructions)
      "form-8582-cr.1.line.35_tax_remaining_special_allowance": 580,
      // Line 36 — Enter the smaller of line 34 or line 35
      "form-8582-cr.1.line.36_smaller_of_34_or_35": 580,
      // Line 37 — Passive Activity Credit Allowed. Add lines 6, 16, 30, and 36
      "form-8582-cr.1.line.37_passive_activity_credit_allowed": 4180,
    },
  },
  "form-3800": {
    engineFields: {
      // Line 2 — Credits subject to the passive activity limit. Combine Part III, line 2, column (
      "form-3800.0.line.2_credits_passive_limited": 3200,
      // Line 3 — Enter the portion of line 2 allowed for 2025
      "form-3800.0.line.3_passive_credits_allowed": 1600,
      // Line 6 — Add lines 1, 3, 4, and 5
      "form-3800.0.line.6_total_credits_not_allowed_tmt": 1600,
      // Line 7 — Regular tax before credits
      "form-3800.0.line.7_regular_tax_before_credits": 16095,
      // Line 9 — Add lines 7 and 8
      "form-3800.0.line.9_regular_tax_plus_amt": 16095,
      // Line 11 — Net income tax. Subtract line 10c from line 9
      "form-3800.0.line.11_net_income_tax": 16095,
      // Line 12 — Net regular tax. Subtract line 10c from line 7. If zero or less, enter -0-
      "form-3800.0.line.12_net_regular_tax": 16095,
      // Line 14 — Tentative minimum tax
      "form-3800.0.line.14_tentative_minimum_tax": 6214,
      // Line 15 — Enter the greater of line 13 or line 14
      "form-3800.0.line.15_greater_of_line_13_or_14": 6214,
      // Line 16 — Subtract line 15 from line 11. If zero or less, enter -0-
      "form-3800.0.line.16_net_income_tax_less_line_15": 9881,
      // Line 17 — Enter the smaller of line 6 or line 16. This is the amount of your credit allowe
      "form-3800.0.line.17_credit_allowed_after_38c1_limit": 1600,
      // Line 18 — Multiply line 14 by 75% (0.75)
      "form-3800.1.line.18_multiply_line_14_by_75_percent": 4661,
      // Line 19 — Enter the greater of line 13 or line 18
      "form-3800.1.line.19_greater_of_line_13_or_18": 4661,
      // Line 20 — Subtract line 19 from line 11. If zero or less, enter -0-
      "form-3800.1.line.20_subtract_line_19_from_11": 11434,
      // Line 21 — Subtract line 17 from line 20. If zero or less, enter -0-
      "form-3800.1.line.21_subtract_line_17_from_20": 9834,
      // Line 23 — Passive activity credit from Part III, line 3, column (d), plus the amount from
      "form-3800.1.line.23_empowerment_zone_passive_credit": 1200,
      // Line 24 — Enter the applicable passive activity credit allowed for 2025
      "form-3800.1.line.24_empowerment_zone_passive_credit_allowed": 600,
      // Line 25 — Add lines 22 and 24
      "form-3800.1.line.25_add_lines_22_and_24": 600,
      // Line 26 — Empowerment zone and renewal community employment credit allowed. Enter the smal
      "form-3800.1.line.26_empowerment_zone_credit_allowed": 600,
      // Line 27 — Subtract line 13 from line 11. If zero or less, enter -0-
      "form-3800.1.line.27_subtract_line_13_from_11": 16095,
      // Line 28 — Add lines 17 and 26
      "form-3800.1.line.28_add_lines_17_and_26": 2200,
      // Line 29 — Subtract line 28 from line 27. If zero or less, enter -0-
      "form-3800.1.line.29_subtract_line_28_from_27": 13895,
      // Line 32 — Passive activity credits from line 5 of Part III: combine column (d) with passiv
      "form-3800.1.line.32_specified_passive_activity_credits": 6400,
      // Line 33 — Enter the applicable passive activity credits allowed for 2025
      "form-3800.1.line.33_specified_passive_credits_allowed": 1980,
      // Line 36 — Add lines 30, 33, 34, and 35
      "form-3800.1.line.36_add_lines_30_33_34_35": 1980,
      // Line 37 — Enter the smaller of line 29 or line 36. This is the amount allowed for specifie
      "form-3800.1.line.37_specified_credits_allowed": 1980,
      // Line 38 — Credit allowed for the current year. Add lines 28 and 37
      "form-3800.1.line.38_credit_allowed_current_year": 4180,
      // Line 1e — Form 8826 — (d) Credits subject to the passive activity limit, before applicatio
      "form-3800.2.part3.1e_form_8826_col_d": 2500,
      // Line 1e — Form 8826 — (g) Combine columns (e) and (f) with the credit from column (d) allo
      "form-3800.2.part3.1e_form_8826_col_g": 1250,
      // Line 2 — Add lines 1a–1zz — (d) Credits subject to the passive activity limit, before appl
      "form-3800.2.part3.2_add_lines_1a_1zz_col_d": 2500,
      // Line 2 — Add lines 1a–1zz — (g) Combine columns (e) and (f) with the credit from column (d
      "form-3800.2.part3.2_add_lines_1a_1zz_col_g": 1250,
      // Line 3 — Form 8844: (d) Credits subject to the passive activity limit, before application
      "form-3800.3.part3.3_form_8844_col_d": 1200,
      // Line 3 — Form 8844: (g) Combine columns (e) and (f) with the credit from column (d) allowe
      "form-3800.3.part3.3_form_8844_col_g": 600,
      // Line 4d — Form 8586: (d) Credits subject to the passive activity limit, before application
      "form-3800.3.part3.4d_form_8586_col_d": 4000,
      // Line 4d — Form 8586: (g) Combine columns (e) and (f) with the credit from column (d) allow
      "form-3800.3.part3.4d_form_8586_col_g": 464,
      // Line 4k — Form 3468, Part VII: (d) Credits subject to the passive activity limit, before a
      "form-3800.3.part3.4k_form_3468_part_vii_col_d": 1000,
      // Line 4k — Form 3468, Part VII: (g) Combine columns (e) and (f) with the credit from column
      "form-3800.3.part3.4k_form_3468_part_vii_col_g": 1000,
      // Line 5 — Add lines 4a–4z: (d) Credits subject to the passive activity limit, before applic
      "form-3800.3.part3.5_add_lines_4a_4z_col_d": 5000,
      // Line 5 — Add lines 4a–4z: (g) Combine columns (e) and (f) with the credit from column (d)
      "form-3800.3.part3.5_add_lines_4a_4z_col_g": 1464,
      // Line 6 — Add lines 2, 3, and 5: (d) Credits subject to the passive activity limit, before
      "form-3800.3.part3.6_add_lines_2_3_5_col_d": 8700,
      // Line 6 — Add lines 2, 3, and 5: (g) Combine columns (e) and (f) with the credit from colum
      "form-3800.3.part3.6_add_lines_2_3_5_col_g": 3314,
      // Line 1e, column (d) — Form 8826: Carryover subject to the passive activity limits, before
      "form-3800.4.part4.1e_form_8826_col_d": 700,
      // Line 1e, column (e) — Form 8826: Carryover subject to the passive activity limits, after t
      "form-3800.4.part4.1e_form_8826_col_e": 350,
      // Line 1e, column (g) — Form 8826: Amount of columns (e) and (f) applied against tax in Part
      "form-3800.4.part4.1e_form_8826_col_g": 350,
      // Line 4d — Form 8586 (post-2007): (d) Carryover subject to the passive activity limits, bef
      "form-3800.6.part4.4d_form_8586_post_2007_col_d": 1000,
      // Line 4d — Form 8586 (post-2007): (e) Carryover subject to the passive activity limits, aft
      "form-3800.6.part4.4d_form_8586_post_2007_col_e": 116,
      // Line 4d — Form 8586 (post-2007): (g) Amount of columns (e) and (f) applied against tax in
      "form-3800.6.part4.4d_form_8586_post_2007_col_g": 116,
      // Line 4k — Form 3468, Part VII (post-2007): (d) Carryover subject to the passive activity l
      "form-3800.6.part4.4k_form_3468_part_vii_col_d": 400,
      // Line 4k — Form 3468, Part VII (post-2007): (e) Carryover subject to the passive activity l
      "form-3800.6.part4.4k_form_3468_part_vii_col_e": 400,
      // Line 4k — Form 3468, Part VII (post-2007): (g) Amount of columns (e) and (f) applied again
      "form-3800.6.part4.4k_form_3468_part_vii_col_g": 400,
      // Line 5 — Add lines 4a–4z: (d) Carryover subject to the passive activity limits, before the
      "form-3800.6.part4.5_add_lines_4a_4z_col_d": 1400,
      // Line 5 — Add lines 4a–4z: (e) Carryover subject to the passive activity limits, after the
      "form-3800.6.part4.5_add_lines_4a_4z_col_e": 516,
      // Line 5 — Add lines 4a–4z: (g) Amount of columns (e) and (f) applied against tax in Part II
      "form-3800.6.part4.5_add_lines_4a_4z_col_g": 516,
      // Line 6 — Add lines 1a through 2zz: (d) Carryover subject to the passive activity limits, b
      "form-3800.6.part4.6_add_lines_1a_2zz_col_d": 700,
      // Line 6 — Add lines 1a through 2zz: (e) Carryover subject to the passive activity limits, a
      "form-3800.6.part4.6_add_lines_1a_2zz_col_e": 350,
      // Line 6 — Add lines 1a through 2zz: (g) Amount of columns (e) and (f) applied against tax i
      "form-3800.6.part4.6_add_lines_1a_2zz_col_g": 350,
      // Line 7 — Add lines 3, 5, and 6: (d) Carryover subject to the passive activity limits, befo
      "form-3800.6.part4.7_add_lines_3_5_6_col_d": 2100,
      // Line 7 — Add lines 3, 5, and 6: (e) Carryover subject to the passive activity limits, afte
      "form-3800.6.part4.7_add_lines_3_5_6_col_e": 866,
      // Line 7 — Add lines 3, 5, and 6: (g) Amount of columns (e) and (f) applied against tax in P
      "form-3800.6.part4.7_add_lines_3_5_6_col_g": 866,
    },
  },
  "form-6251": {
    engineFields: {
      // Line 1a — Subtract Schedule 1-A (Form 1040), line 37, from Form 1040, 1040-SR, or 1040-NR,
      "form-6251.0.line.1a_deductions_less_schedule_1a": 15750,
      // Line 1b — Subtract line 1a from Form 1040, 1040-SR, or 1040-NR, line 11b (if less than zer
      "form-6251.0.line.1b_taxable_income_start": 96250,
      // Line 2a — If filing Schedule A (Form 1040), enter the taxes from Schedule A, line 7; other
      "form-6251.0.line.2a_taxes_or_standard_deduction": 15750,
      // Line 4 — Alternative minimum taxable income. Combine lines 1b through 3
      "form-6251.0.line.4_alternative_minimum_taxable_income": 112000,
      // Line 5 — Exemption
      "form-6251.0.line.5_exemption": 88100,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-6251.0.line.6_amti_less_exemption": 23900,
      // Line 7 — Tax on line 6: complete Part III and enter line 40 if you have capital gain distr
      "form-6251.0.line.7_tax_on_line_6": 6214,
      // Line 9 — Tentative minimum tax. Subtract line 8 from line 7
      "form-6251.0.line.9_tentative_minimum_tax": 6214,
      // Line 10 — Add Form 1040 or 1040-SR, line 16 (minus any tax from Form 4972), and Schedule 2
      "form-6251.0.line.10_regular_tax_less_credits": 16095,
    },
  },
  /*
   * Schedule 2 files because Form 6251 does (Form 3800 line 14 reads it); its
   * resolver cannot see that Form 6251 line 11 is 0 (filingInfoResolvers.ts,
   * KNOWN GAP), so lines 2 and 3 print 0.
   */
  "schedule-2": {
    engineFields: {
      // Line 2 — Alternative minimum tax. Attach Form 6251
      "schedule-2.0.line.2_alternative_minimum_tax": 0,
      // Line 3 — Add lines 1z and 2. Enter here and on Form 1040, line 17
      "schedule-2.0.line.3_total_lines_1z_and_2": 0,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 6a — General business credit. Attach Form 3800
      "schedule-3.0.line.6a": 4180,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 4180,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 4180,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 118000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 118000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": -6000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 112000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 112000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 112000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 96250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 16095,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 16095,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 4180,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 4180,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 11915,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 11915,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 13200,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 13200,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 13200,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 1285,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 1285,
    },
  },
};

export function arramExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
