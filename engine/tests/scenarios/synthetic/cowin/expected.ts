/*
 * cowin — LOCKED expected values, drafted from the engine's
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
  "form-6765": {
    engineFields: {
      // Line 1 — Certain amounts paid or incurred to energy consortia
      "form-6765.0.line.1_energy_consortia_amounts": 5000,
      // Line 5 — Total qualified research expenses (QREs). Enter amount from line 48
      "form-6765.0.line.5_total_qres_from_line_48": 418000,
      // Line 7 — Enter average annual gross receipts
      "form-6765.0.line.7_average_annual_gross_receipts": 2100000,
      // Line 8 — Multiply line 7 by the percentage on line 6
      "form-6765.0.line.8_multiply_7_by_6": 80640,
      // Line 9 — Subtract line 8 from line 5. If zero or less, enter -0-
      "form-6765.0.line.9_subtract_8_from_5": 337360,
      // Line 10 — Multiply line 5 by 50% (0.50)
      "form-6765.0.line.10_multiply_5_by_50": 209000,
      // Line 11 — Enter the smaller of line 9 or line 10
      "form-6765.0.line.11_smaller_of_9_or_10": 209000,
      // Line 12 — Add lines 1, 4, and 11
      "form-6765.0.line.12_add_lines": 214000,
      // Line 13 — If you elect to reduce the credit under section 280C, then multiply line 12 by 1
      "form-6765.0.line.13_regular_credit": 42800,
      // Line 28 — Subtract line 27 from line 13 or line 26 (whichever applies). If zero or less, e
      "form-6765.1.line.28_subtract_27_from_13_or_26": 42800,
      // Line 29 — Credit for increasing research activities from partnerships, S corporations, est
      "form-6765.1.line.29_pass_through_research_credit": 3000,
      // Line 30 — Add lines 28 and 29
      "form-6765.1.line.30_total_current_year_credit": 45800,
      // Line 37 — Enter the number of business components generating the QREs on line 5 or line 20
      "form-6765.1.line.37_business_components_count": 7,
      // Line 42 — Total wages for qualified services for all business components (do not include a
      "form-6765.1.line.42_total_qualified_wages": 333000,
      // Line 43 — Total costs of supplies for all business components
      "form-6765.1.line.43_total_supplies_cost": 30000,
      // Line 44 — Total rental or lease cost of computers for all business components
      "form-6765.1.line.44_total_computer_rental_cost": 6000,
      // Line 45 — Total applicable amount of contract research for all business components (do not
      "form-6765.1.line.45_contract_research_amount": 49000,
      // Line 47 — Add line 45 and line 46
      "form-6765.1.line.47_add_lines": 49000,
      // Line 48 — Add lines 42, 43, 44, and 47, then enter line 48 on either line 5 or line 20, wh
      "form-6765.1.line.48_total_qres": 418000,
      // Line 50 — Direct research wages for qualified services, business component 1
      "form-6765.3.line.50_row_1_direct_research_wages": 120000,
      // Line 51 — Direct supervision wages for qualified services, business component 1
      "form-6765.3.line.51_row_1_direct_supervision_wages": 30000,
      // Line 52 — Direct support wages for qualified services, business component 1
      "form-6765.3.line.52_row_1_direct_support_wages": 10000,
      // Line 53 — Total qualified wages (add line 50, line 51, and line 52), business component 1
      "form-6765.3.line.53_row_1_total_qualified_wages": 160000,
      // Line 50 — Direct research wages for qualified services, business component 2
      "form-6765.3.line.50_row_2_direct_research_wages": 80000,
      // Line 51 — Direct supervision wages for qualified services, business component 2
      "form-6765.3.line.51_row_2_direct_supervision_wages": 20000,
      // Line 52 — Direct support wages for qualified services, business component 2
      "form-6765.3.line.52_row_2_direct_support_wages": 5000,
      // Line 53 — Total qualified wages (add line 50, line 51, and line 52), business component 2
      "form-6765.3.line.53_row_2_total_qualified_wages": 105000,
      // Line 50 — Direct research wages for qualified services, business component 3
      "form-6765.3.line.50_row_3_direct_research_wages": 40000,
      // Line 51 — Direct supervision wages for qualified services, business component 3
      "form-6765.3.line.51_row_3_direct_supervision_wages": 10000,
      // Line 53 — Total qualified wages (add line 50, line 51, and line 52), business component 3
      "form-6765.3.line.53_row_3_total_qualified_wages": 50000,
      // Line 50 — Direct research wages for qualified services, business component 4
      "form-6765.3.line.50_row_4_direct_research_wages": 15000,
      // Line 52 — Direct support wages for qualified services, business component 4
      "form-6765.3.line.52_row_4_direct_support_wages": 3000,
      // Line 53 — Total qualified wages (add line 50, line 51, and line 52), business component 4
      "form-6765.3.line.53_row_4_total_qualified_wages": 18000,
      // Line 50 — Direct research wages for qualified services, total
      "form-6765.3.line.50_total_direct_research_wages": 255000,
      // Line 51 — Direct supervision wages for qualified services, total
      "form-6765.3.line.51_total_direct_supervision_wages": 60000,
      // Line 52 — Direct support wages for qualified services, total
      "form-6765.3.line.52_total_direct_support_wages": 18000,
      // Line 53 — Total qualified wages (add line 50, line 51, and line 52), total
      "form-6765.3.line.53_total_total_qualified_wages": 333000,
      // Line 54 — Cost of supplies, business component 1
      "form-6765.3.line.54_row_1_cost_of_supplies": 18000,
      // Line 56 — Applicable amount of contract research expenses, business component 1
      "form-6765.3.line.56_row_1_contract_research": 26000,
      // Line 54 — Cost of supplies, business component 2
      "form-6765.3.line.54_row_2_cost_of_supplies": 2000,
      // Line 55 — Rental or lease cost of computers, business component 2
      "form-6765.3.line.55_row_2_computer_rental_cost": 6000,
      // Line 56 — Applicable amount of contract research expenses, business component 2
      "form-6765.3.line.56_row_2_contract_research": 15000,
      // Line 54 — Cost of supplies, business component 3
      "form-6765.3.line.54_row_3_cost_of_supplies": 9000,
      // Line 56 — Applicable amount of contract research expenses, business component 3
      "form-6765.3.line.56_row_3_contract_research": 8000,
      // Line 54 — Cost of supplies, business component 4
      "form-6765.3.line.54_row_4_cost_of_supplies": 1000,
      // Line 54 — Cost of supplies, total
      "form-6765.3.line.54_total_cost_of_supplies": 30000,
      // Line 55 — Rental or lease cost of computers, total
      "form-6765.3.line.55_total_computer_rental_cost": 6000,
      // Line 56 — Applicable amount of contract research expenses, total
      "form-6765.3.line.56_total_contract_research": 49000,
    },
  },
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 2600000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 2600000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 2600000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 2600000,
      // Line 18 — Office expense
      "schedule-c.0.line.18": 12000,
      // Line 20a — Rent or lease: Vehicles, machinery, and equipment
      "schedule-c.0.line.20a": 30000,
      // Line 11 — Contract labor
      "schedule-c.0.line.11": 90000,
      // Line 20b — Rent or lease: Other business property
      "schedule-c.0.line.20b": 96000,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 120000,
      // Line 23 — Taxes and licenses
      "schedule-c.0.line.23": 70000,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 25000,
      // Line 25 — Utilities
      "schedule-c.0.line.25": 18000,
      // Line 26 — Wages (less employment credits)
      "schedule-c.0.line.26": 1457200,
      // Line 17 — Legal and professional services
      "schedule-c.0.line.17": 15000,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 1933200,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 666800,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 666800,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 666800,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 666800,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 615790,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 615790,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 615790,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 21836,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 17858,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 39694,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 19847,
    },
  },
  "schedule-e": {
    engineFields: {
      // Line 28 row A — (k) Nonpassive income from Schedule K-1
      "schedule-e.1.line.28_row_a_col_k_nonpassive_income": 24000,
      // Line 29a — Totals, column (k) nonpassive income
      "schedule-e.1.line.29a_totals_col_k": 24000,
      // Line 30 — Add columns (h) and (k) of line 29a
      "schedule-e.1.line.30_add_income_columns": 24000,
      // Line 32 — Total partnership and S corporation income or (loss). Combine lines 30 and 31
      "schedule-e.1.line.32_total_partnership_s_corp_income": 24000,
      // Line 41 — Total income or (loss). Combine lines 26, 32, 37, 39, and 40
      "schedule-e.1.line.41_total_income_or_loss": 24000,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 666800,
      // Line 5 — Rental real estate, royalties, partnerships, S corporations, trusts, etc. Attach
      "schedule-1.0.line.5": 24000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 690800,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 19847,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 19847,
    },
  },
  "form-8995-a": {
    engineFields: {
      // Line 2 — Qualified business income from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.2_a": 646953,
      // Line 2 — Qualified business income from the trade, business, or aggregation (Column B)
      "form-8995-a.0.line.2_b": 24000,
      // Line 3 — Multiply line 2 by 20% (0.20) (Column A)
      "form-8995-a.0.line.3_a": 129391,
      // Line 3 — Multiply line 2 by 20% (0.20) (Column B)
      "form-8995-a.0.line.3_b": 4800,
      // Line 4 — Allocable share of W-2 wages from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.4_a": 1500000,
      // Line 4 — Allocable share of W-2 wages from the trade, business, or aggregation (Column B)
      "form-8995-a.0.line.4_b": 40000,
      // Line 5 — Multiply line 4 by 50% (0.50) (Column A)
      "form-8995-a.0.line.5_a": 750000,
      // Line 5 — Multiply line 4 by 50% (0.50) (Column B)
      "form-8995-a.0.line.5_b": 20000,
      // Line 6 — Multiply line 4 by 25% (0.25) (Column A)
      "form-8995-a.0.line.6_a": 375000,
      // Line 6 — Multiply line 4 by 25% (0.25) (Column B)
      "form-8995-a.0.line.6_b": 10000,
      // Line 9 — Add lines 6 and 8 (Column A)
      "form-8995-a.0.line.9_a": 375000,
      // Line 9 — Add lines 6 and 8 (Column B)
      "form-8995-a.0.line.9_b": 10000,
      // Line 10 — Enter the greater of line 5 or line 9 (Column A)
      "form-8995-a.0.line.10_a": 750000,
      // Line 10 — Enter the greater of line 5 or line 9 (Column B)
      "form-8995-a.0.line.10_b": 20000,
      // Line 11 — W-2 wage and UBIA of qualified property limitation. Enter the smaller of line 3
      "form-8995-a.0.line.11_a": 129391,
      // Line 11 — W-2 wage and UBIA of qualified property limitation. Enter the smaller of line 3
      "form-8995-a.0.line.11_b": 4800,
      // Line 13 — Qualified business income deduction before patron reduction. Enter the greater o
      "form-8995-a.0.line.13_a": 129391,
      // Line 13 — Qualified business income deduction before patron reduction. Enter the greater o
      "form-8995-a.0.line.13_b": 4800,
      // Line 15 — Qualified business income component. Subtract line 14 from line 13 (Column A)
      "form-8995-a.0.line.15_a": 129391,
      // Line 15 — Qualified business income component. Subtract line 14 from line 13 (Column B)
      "form-8995-a.0.line.15_b": 4800,
      // Line 16 — Total qualified business income component. Add all amounts reported on line 15
      "form-8995-a.0.line.16": 134191,
      // Line 27 — Total qualified business income component from all qualified trades, businesses,
      "form-8995-a.1.line.27": 134191,
      // Line 32 — Qualified business income deduction before the income limitation. Add lines 27 a
      "form-8995-a.1.line.32": 134191,
      // Line 33 — Taxable income before qualified business income deduction
      "form-8995-a.1.line.33": 655203,
      // Line 35 — Subtract line 34 from line 33. If zero or less, enter -0-
      "form-8995-a.1.line.35": 655203,
      // Line 36 — Income limitation. Multiply line 35 by 20% (0.20)
      "form-8995-a.1.line.36": 131041,
      // Line 37 — Qualified business income deduction before the domestic production activities de
      "form-8995-a.1.line.37": 131041,
      // Line 39 — Total qualified business income deduction. Add lines 37 and 38
      "form-8995-a.1.line.39": 131041,
    },
  },
  "form-6251": {
    engineFields: {
      // Line 1a — Subtract Schedule 1-A (Form 1040), line 37, from Form 1040, 1040-SR, or 1040-NR,
      "form-6251.0.line.1a_deductions_less_schedule_1a": 146791,
      // Line 1b — Subtract line 1a from Form 1040, 1040-SR, or 1040-NR, line 11b (if less than zer
      "form-6251.0.line.1b_taxable_income_start": 524162,
      // Line 2a — If filing Schedule A (Form 1040), enter the taxes from Schedule A, line 7; other
      "form-6251.0.line.2a_taxes_or_standard_deduction": 15750,
      // Line 4 — Alternative minimum taxable income. Combine lines 1b through 3
      "form-6251.0.line.4_alternative_minimum_taxable_income": 539912,
      // Line 5 — Exemption
      "form-6251.0.line.5_exemption": 88100,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-6251.0.line.6_amti_less_exemption": 451812,
      // Line 7 — Tax on line 6: complete Part III and enter line 40 if you have capital gain distr
      "form-6251.0.line.7_tax_on_line_6": 121725,
      // Line 9 — Tentative minimum tax. Subtract line 8 from line 7
      "form-6251.0.line.9_tentative_minimum_tax": 121725,
      // Line 10 — Add Form 1040 or 1040-SR, line 16 (minus any tax from Form 4972), and Schedule 2
      "form-6251.0.line.10_regular_tax_less_credits": 153004,
    },
  },
  "form-3800": {
    engineFields: {
      // Line 1 — Credits not subject to the passive activity limit from Part III, line 2: combine
      "form-3800.0.line.1_credits_not_passive_limited": 3000,
      // Line 6 — Add lines 1, 3, 4, and 5
      "form-3800.0.line.6_total_credits_not_allowed_tmt": 3000,
      // Line 7 — Regular tax before credits
      "form-3800.0.line.7_regular_tax_before_credits": 153004,
      // Line 9 — Add lines 7 and 8
      "form-3800.0.line.9_regular_tax_plus_amt": 153004,
      // Line 11 — Net income tax. Subtract line 10c from line 9
      "form-3800.0.line.11_net_income_tax": 153004,
      // Line 12 — Net regular tax. Subtract line 10c from line 7. If zero or less, enter -0-
      "form-3800.0.line.12_net_regular_tax": 153004,
      // Line 13 — Enter 25% (0.25) of the excess, if any, of line 12 (line 11 for corporations) ov
      "form-3800.0.line.13_25_percent_of_excess": 32001,
      // Line 14 — Tentative minimum tax
      "form-3800.0.line.14_tentative_minimum_tax": 121725,
      // Line 15 — Enter the greater of line 13 or line 14
      "form-3800.0.line.15_greater_of_line_13_or_14": 121725,
      // Line 16 — Subtract line 15 from line 11. If zero or less, enter -0-
      "form-3800.0.line.16_net_income_tax_less_line_15": 31279,
      // Line 17 — Enter the smaller of line 6 or line 16. This is the amount of your credit allowe
      "form-3800.0.line.17_credit_allowed_after_38c1_limit": 3000,
      // Line 27 — Subtract line 13 from line 11. If zero or less, enter -0-
      "form-3800.1.line.27_subtract_line_13_from_11": 121003,
      // Line 28 — Add lines 17 and 26
      "form-3800.1.line.28_add_lines_17_and_26": 3000,
      // Line 29 — Subtract line 28 from line 27. If zero or less, enter -0-
      "form-3800.1.line.29_subtract_line_28_from_27": 118003,
      // Line 30 — Enter the general business credit from line 5 of Part III: combine column (e) wi
      "form-3800.1.line.30_specified_general_business_credit": 42800,
      // Line 36 — Add lines 30, 33, 34, and 35
      "form-3800.1.line.36_add_lines_30_33_34_35": 42800,
      // Line 37 — Enter the smaller of line 29 or line 36. This is the amount allowed for specifie
      "form-3800.1.line.37_specified_credits_allowed": 42800,
      // Line 38 — Credit allowed for the current year. Add lines 28 and 37
      "form-3800.1.line.38_credit_allowed_current_year": 45800,
      // Line 1c — Form 6765 — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.1c_form_6765_col_e": 3000,
      // Line 1c — Form 6765 — (g) Combine columns (e) and (f) with the credit from column (d) allo
      "form-3800.2.part3.1c_form_6765_col_g": 3000,
      // Line 2 — Add lines 1a–1zz — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.2_add_lines_1a_1zz_col_e": 3000,
      // Line 2 — Add lines 1a–1zz — (g) Combine columns (e) and (f) with the credit from column (d
      "form-3800.2.part3.2_add_lines_1a_1zz_col_g": 3000,
      // Line 4i — Form 6765 (ESB): (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.4i_form_6765_esb_col_e": 42800,
      // Line 4i — Form 6765 (ESB): (g) Combine columns (e) and (f) with the credit from column (d)
      "form-3800.3.part3.4i_form_6765_esb_col_g": 42800,
      // Line 5 — Add lines 4a–4z: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.5_add_lines_4a_4z_col_e": 42800,
      // Line 5 — Add lines 4a–4z: (g) Combine columns (e) and (f) with the credit from column (d)
      "form-3800.3.part3.5_add_lines_4a_4z_col_g": 42800,
      // Line 6 — Add lines 2, 3, and 5: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.6_add_lines_2_3_5_col_e": 45800,
      // Line 6 — Add lines 2, 3, and 5: (g) Combine columns (e) and (f) with the credit from colum
      "form-3800.3.part3.6_add_lines_2_3_5_col_g": 45800,
    },
  },
  "form-8959": {
    engineFields: {
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 200000,
      // Line 8 — Self-employment income from Schedule SE (Form 1040), Part I, line 6
      "form-8959.0.line.8_self_employment_income": 615790,
      // Line 9 — Enter the following amount for your filing status
      "form-8959.0.line.9_filing_status_threshold_se": 200000,
      // Line 11 — Subtract line 10 from line 9. If zero or less, enter -0-
      "form-8959.0.line.11_threshold_reduced_by_wages": 200000,
      // Line 12 — Subtract line 11 from line 8. If zero or less, enter -0-
      "form-8959.0.line.12_excess_se_income": 415790,
      // Line 13 — Additional Medicare Tax on self-employment income. Multiply line 12 by 0.9% (0.0
      "form-8959.0.line.13_additional_medicare_tax_se": 3742,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 3742,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 39694,
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 3742,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 43436,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 6a — General business credit. Attach Form 3800
      "schedule-3.0.line.6a": 45800,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 45800,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 45800,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 690800,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 690800,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 19847,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 670953,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 670953,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 131041,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 146791,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 524162,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 153004,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 153004,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 45800,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 45800,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 107204,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 43436,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 150640,
      // Line 26 — 2025 estimated tax payments and amount applied from 2024 return
      "form-1040.line.26": 192000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 192000,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 41360,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 41360,
    },
  },
};

export function cowinExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
