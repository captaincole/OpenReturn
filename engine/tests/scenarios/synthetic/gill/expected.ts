/*
 * gill — LOCKED expected values, drafted from the engine's
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
  "form-8881": {
    engineFields: {
      // Line A — Enter the number of qualifying employees
      "form-8881.0.line.a_qualifying_employees": 54,
      // Line 1 — Qualified startup costs incurred during the tax year
      "form-8881.0.line.1_qualified_startup_costs": 3800,
      // Line 2 — Employers with 1–50 employees enter the amount from line 1. Employers with 51–100
      "form-8881.0.line.2_startup_costs_by_employer_size": 1900,
      // Line 3 — Enter the number of employees eligible to participate in the pension plan
      "form-8881.0.line.3_eligible_employees": 40,
      // Line 3 — Number of eligible employees x $250
      "form-8881.0.line.3_multiply_eligible_employees_by_250": 10000,
      // Line 4 — Enter the greater of $500 or the amount from line 3 (Do not enter more than $5,00
      "form-8881.0.line.4_greater_of_500_or_3": 5000,
      // Line 5 — Enter the smaller of line 2 or line 4
      "form-8881.0.line.5_smaller_of_2_or_4": 1900,
      // Line 6a — Enter the number of employees from the preceding tax year
      "form-8881.0.line.6a_preceding_year_employees": 58,
      // Line 6b — Enter employer contributions made to the plan, but don't include (i) elective de
      "form-8881.0.line.6b_employer_contributions": 2751,
      // Line 6c — For employees for whom you made matching and nonelective contributions of more t
      "form-8881.0.line.6c_contributions_over_1000": 3868,
      // Line 6d — Add lines 6b and 6c
      "form-8881.0.line.6d_add_lines": 6619,
      // Line 6e(1) — Subtract 50 (50.0) from the number of employees entered on line 6a
      "form-8881.0.line.6e_1_subtract_50_from_6a": 8,
      // Line 6e(3) — Multiply line 6e(2) by line 6d
      "form-8881.0.line.6e_3_multiply_6e_2_by_6d": 1059,
      // Line 6e(4) — Subtract line 6e(3) from line 6d
      "form-8881.0.line.6e_4_subtract_6e_3_from_6d": 5560,
      // Line 6f — If you did NOT complete line 6e, enter the amount from line 6d. If you completed
      "form-8881.0.line.6f_contributions_after_phaseout": 5560,
      // Line 6g — Applicable percentages: first or second year of the plan, enter the amount from
      "form-8881.0.line.6g_applicable_percentage_amount": 4170,
      // Line 7 — Small employer pension plan startup costs credit and small employer contributions
      "form-8881.0.line.7_credit_from_partnerships_s_corps": 640,
      // Line 8 — Add lines 5, 6g, and 7
      "form-8881.0.line.8_total_part_i_credits": 6710,
      // Line 9 — Enter $500 if an auto-enrollment option is provided for retirement savings
      "form-8881.0.line.9_auto_enrollment_credit": 500,
      // Line 10 — Small employer auto-enrollment credit from partnerships and S corporations
      "form-8881.0.line.10_auto_enrollment_from_partnerships_s_corps": 100,
      // Line 11 — Add lines 9 and 10
      "form-8881.0.line.11_total_auto_enrollment_credit": 600,
      // Line 12 — Enter the number of military spouse employees participating in an eligible plan
      "form-8881.0.line.12_military_spouse_employees": 2,
      // Line 12 — Number of military spouse employees x $200
      "form-8881.0.line.12_multiply_military_spouses_by_200": 400,
      // Line 13 — Amount of contributions paid by employer for each eligible military spouse emplo
      "form-8881.0.line.13_military_spouse_contributions": 550,
      // Line 14 — Small employer military spouse participation credit from partnerships and S corp
      "form-8881.0.line.14_military_spouse_from_partnerships_s_corps": 90,
      // Line 15 — Add lines 12, 13, and 14
      "form-8881.0.line.15_total_military_spouse_credit": 1040,
    },
    renderedText: {
      "form-8881.0.header.identifying_number": "400-00-8881",
      // Line 6e(2): 8 employees over 50 times 2%.
      "form-8881.0.line.6e_2_multiply_6e_1_by_2_percent": "0.16",
    },
  },
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 2960000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 2960000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 2960000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 2960000,
      // Line 8 — Advertising
      "schedule-c.0.line.8": 18400,
      // Line 19 — Pension and profit-sharing plans
      "schedule-c.0.line.19": 10080,
      // Line 20b — Rent or lease: Other business property
      "schedule-c.0.line.20b": 96000,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 612000,
      // Line 23 — Taxes and licenses
      "schedule-c.0.line.23": 138000,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 41000,
      // Line 25 — Utilities
      "schedule-c.0.line.25": 44800,
      // Line 26 — Wages (less employment credits)
      "schedule-c.0.line.26": 1540000,
      // Line 17 — Legal and professional services
      "schedule-c.0.line.17": 24600,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 2524880,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 435120,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 435120,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 435120,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 435120,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 401833,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 401833,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 401833,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 21836,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 11653,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 33489,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 16745,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 435120,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 435120,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 16745,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 16745,
    },
  },
  "form-8995-a": {
    engineFields: {
      // Line 2 — Qualified business income from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.2_a": 418375,
      // Line 3 — Multiply line 2 by 20% (0.20) (Column A)
      "form-8995-a.0.line.3_a": 83675,
      // Line 4 — Allocable share of W-2 wages from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.4_a": 1540000,
      // Line 5 — Multiply line 4 by 50% (0.50) (Column A)
      "form-8995-a.0.line.5_a": 770000,
      // Line 6 — Multiply line 4 by 25% (0.25) (Column A)
      "form-8995-a.0.line.6_a": 385000,
      // Line 9 — Add lines 6 and 8 (Column A)
      "form-8995-a.0.line.9_a": 385000,
      // Line 10 — Enter the greater of line 5 or line 9 (Column A)
      "form-8995-a.0.line.10_a": 770000,
      // Line 11 — W-2 wage and UBIA of qualified property limitation. Enter the smaller of line 3
      "form-8995-a.0.line.11_a": 83675,
      // Line 13 — Qualified business income deduction before patron reduction. Enter the greater o
      "form-8995-a.0.line.13_a": 83675,
      // Line 15 — Qualified business income component. Subtract line 14 from line 13 (Column A)
      "form-8995-a.0.line.15_a": 83675,
      // Line 16 — Total qualified business income component. Add all amounts reported on line 15
      "form-8995-a.0.line.16": 83675,
      // Line 27 — Total qualified business income component from all qualified trades, businesses,
      "form-8995-a.1.line.27": 83675,
      // Line 32 — Qualified business income deduction before the income limitation. Add lines 27 a
      "form-8995-a.1.line.32": 83675,
      // Line 33 — Taxable income before qualified business income deduction
      "form-8995-a.1.line.33": 402625,
      // Line 35 — Subtract line 34 from line 33. If zero or less, enter -0-
      "form-8995-a.1.line.35": 402625,
      // Line 36 — Income limitation. Multiply line 35 by 20% (0.20)
      "form-8995-a.1.line.36": 80525,
      // Line 37 — Qualified business income deduction before the domestic production activities de
      "form-8995-a.1.line.37": 80525,
      // Line 39 — Total qualified business income deduction. Add lines 37 and 38
      "form-8995-a.1.line.39": 80525,
    },
  },
  "form-6251": {
    engineFields: {
      // Line 1a — Subtract Schedule 1-A (Form 1040), line 37, from Form 1040, 1040-SR, or 1040-NR,
      "form-6251.0.line.1a_deductions_less_schedule_1a": 96275,
      // Line 1b — Subtract line 1a from Form 1040, 1040-SR, or 1040-NR, line 11b (if less than zer
      "form-6251.0.line.1b_taxable_income_start": 322100,
      // Line 2a — If filing Schedule A (Form 1040), enter the taxes from Schedule A, line 7; other
      "form-6251.0.line.2a_taxes_or_standard_deduction": 15750,
      // Line 4 — Alternative minimum taxable income. Combine lines 1b through 3
      "form-6251.0.line.4_alternative_minimum_taxable_income": 337850,
      // Line 5 — Exemption
      "form-6251.0.line.5_exemption": 88100,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-6251.0.line.6_amti_less_exemption": 249750,
      // Line 7 — Tax on line 6: complete Part III and enter line 40 if you have capital gain distr
      "form-6251.0.line.7_tax_on_line_6": 65148,
      // Line 9 — Tentative minimum tax. Subtract line 8 from line 7
      "form-6251.0.line.9_tentative_minimum_tax": 65148,
      // Line 10 — Add Form 1040 or 1040-SR, line 16 (minus any tax from Form 4972), and Schedule 2
      "form-6251.0.line.10_regular_tax_less_credits": 82282,
    },
  },
  "form-3800": {
    engineFields: {
      // Line 1 — Credits not subject to the passive activity limit from Part III, line 2: combine
      "form-3800.0.line.1_credits_not_passive_limited": 8350,
      // Line 6 — Add lines 1, 3, 4, and 5
      "form-3800.0.line.6_total_credits_not_allowed_tmt": 8350,
      // Line 7 — Regular tax before credits
      "form-3800.0.line.7_regular_tax_before_credits": 82282,
      // Line 9 — Add lines 7 and 8
      "form-3800.0.line.9_regular_tax_plus_amt": 82282,
      // Line 11 — Net income tax. Subtract line 10c from line 9
      "form-3800.0.line.11_net_income_tax": 82282,
      // Line 12 — Net regular tax. Subtract line 10c from line 7. If zero or less, enter -0-
      "form-3800.0.line.12_net_regular_tax": 82282,
      // Line 13 — Enter 25% (0.25) of the excess, if any, of line 12 (line 11 for corporations) ov
      "form-3800.0.line.13_25_percent_of_excess": 14321,
      // Line 14 — Tentative minimum tax
      "form-3800.0.line.14_tentative_minimum_tax": 65148,
      // Line 15 — Enter the greater of line 13 or line 14
      "form-3800.0.line.15_greater_of_line_13_or_14": 65148,
      // Line 16 — Subtract line 15 from line 11. If zero or less, enter -0-
      "form-3800.0.line.16_net_income_tax_less_line_15": 17134,
      // Line 17 — Enter the smaller of line 6 or line 16. This is the amount of your credit allowe
      "form-3800.0.line.17_credit_allowed_after_38c1_limit": 8350,
      // Line 27 — Subtract line 13 from line 11. If zero or less, enter -0-
      "form-3800.1.line.27_subtract_line_13_from_11": 67961,
      // Line 28 — Add lines 17 and 26
      "form-3800.1.line.28_add_lines_17_and_26": 8350,
      // Line 29 — Subtract line 28 from line 27. If zero or less, enter -0-
      "form-3800.1.line.29_subtract_line_28_from_27": 59611,
      // Line 38 — Credit allowed for the current year. Add lines 28 and 37
      "form-3800.1.line.38_credit_allowed_current_year": 8350,
      // Line 1j — Form 8881, Part I — (a) No. of items
      "form-3800.2.part3.1j_form_8881_part_i_col_a": 2,
      // Line 1j — Form 8881, Part I — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.1j_form_8881_part_i_col_e": 6710,
      // Line 1j — Form 8881, Part I — (g) Combine columns (e) and (f) with the credit from column
      "form-3800.2.part3.1j_form_8881_part_i_col_g": 6710,
      // Line 1dd — Form 8881, Part II — (a) No. of items
      "form-3800.2.part3.1dd_form_8881_part_ii_col_a": 2,
      // Line 1dd — Form 8881, Part II — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.1dd_form_8881_part_ii_col_e": 600,
      // Line 1dd — Form 8881, Part II — (g) Combine columns (e) and (f) with the credit from colum
      "form-3800.2.part3.1dd_form_8881_part_ii_col_g": 600,
      // Line 1ee — Form 8881, Part III — (a) No. of items
      "form-3800.2.part3.1ee_form_8881_part_iii_col_a": 2,
      // Line 1ee — Form 8881, Part III — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.1ee_form_8881_part_iii_col_e": 1040,
      // Line 1ee — Form 8881, Part III — (g) Combine columns (e) and (f) with the credit from colu
      "form-3800.2.part3.1ee_form_8881_part_iii_col_g": 1040,
      // Line 2 — Add lines 1a–1zz — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.2_add_lines_1a_1zz_col_e": 8350,
      // Line 2 — Add lines 1a–1zz — (g) Combine columns (e) and (f) with the credit from column (d
      "form-3800.2.part3.2_add_lines_1a_1zz_col_g": 8350,
      // Line 6 — Add lines 2, 3, and 5: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.6_add_lines_2_3_5_col_e": 8350,
      // Line 6 — Add lines 2, 3, and 5: (g) Combine columns (e) and (f) with the credit from colum
      "form-3800.3.part3.6_add_lines_2_3_5_col_g": 8350,
      // Part V, line 1, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.1_breakdown_col_e": 640,
      // Part V, line 2, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.2_breakdown_col_e": 6070,
      // Part V, line 3, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.3_breakdown_col_e": 100,
      // Part V, line 4, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.4_breakdown_col_e": 500,
      // Part V, line 5, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.5_breakdown_col_e": 90,
      // Part V, line 6, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.6_breakdown_col_e": 950,
      // Line 1 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.1_breakdown_col_g": 640,
      // Line 1 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.1_breakdown_col_h2": 640,
      // Line 1 — (i)(1) Amount of column (h)(2) applied against tax in Part II
      "form-3800.7.part5.1_breakdown_col_i1": 640,
      // Line 2 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.2_breakdown_col_g": 6070,
      // Line 2 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.2_breakdown_col_h2": 6070,
      // Line 2 — (i)(1) Amount of column (h)(2) applied against tax in Part II
      "form-3800.7.part5.2_breakdown_col_i1": 6070,
      // Line 3 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.3_breakdown_col_g": 100,
      // Line 3 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.3_breakdown_col_h2": 100,
      // Line 3 — (i)(1) Amount of column (h)(2) applied against tax in Part II
      "form-3800.7.part5.3_breakdown_col_i1": 100,
      // Line 4 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.4_breakdown_col_g": 500,
      // Line 4 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.4_breakdown_col_h2": 500,
      // Line 4 — (i)(1) Amount of column (h)(2) applied against tax in Part II
      "form-3800.7.part5.4_breakdown_col_i1": 500,
      // Line 5 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.5_breakdown_col_g": 90,
      // Line 5 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.5_breakdown_col_h2": 90,
      // Line 5 — (i)(1) Amount of column (h)(2) applied against tax in Part II
      "form-3800.7.part5.5_breakdown_col_i1": 90,
      // Line 6 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.6_breakdown_col_g": 950,
      // Line 6 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.6_breakdown_col_h2": 950,
      // Line 6 — (i)(1) Amount of column (h)(2) applied against tax in Part II
      "form-3800.7.part5.6_breakdown_col_i1": 950,
    },
  },
  "form-8959": {
    engineFields: {
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 200000,
      // Line 8 — Self-employment income from Schedule SE (Form 1040), Part I, line 6
      "form-8959.0.line.8_self_employment_income": 401833,
      // Line 9 — Enter the following amount for your filing status
      "form-8959.0.line.9_filing_status_threshold_se": 200000,
      // Line 11 — Subtract line 10 from line 9. If zero or less, enter -0-
      "form-8959.0.line.11_threshold_reduced_by_wages": 200000,
      // Line 12 — Subtract line 11 from line 8. If zero or less, enter -0-
      "form-8959.0.line.12_excess_se_income": 201833,
      // Line 13 — Additional Medicare Tax on self-employment income. Multiply line 12 by 0.9% (0.0
      "form-8959.0.line.13_additional_medicare_tax_se": 1817,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 1817,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 33489,
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 1817,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 35306,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 6a — General business credit. Attach Form 3800
      "schedule-3.0.line.6a": 8350,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 8350,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 8350,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 435120,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 435120,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 16745,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 418375,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 418375,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 80525,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 96275,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 322100,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 82282,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 82282,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 8350,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 8350,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 73932,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 35306,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 109238,
      // Line 26 — 2025 estimated tax payments and amount applied from 2024 return
      "form-1040.line.26": 112000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 112000,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 2762,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 2762,
    },
  },
};

export function gillExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
