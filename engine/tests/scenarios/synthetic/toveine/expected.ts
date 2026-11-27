/*
 * toveine — LOCKED expected values, drafted from the engine's
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
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 480000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 480000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 480000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 480000,
      // Line 18 — Office expense
      "schedule-c.0.line.18": 3000,
      // Line 20b — Rent or lease: Other business property
      "schedule-c.0.line.20b": 30000,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 36000,
      // Line 23 — Taxes and licenses
      "schedule-c.0.line.23": 12000,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 9000,
      // Line 25 — Utilities
      "schedule-c.0.line.25": 14000,
      // Line 26 — Wages (less employment credits)
      "schedule-c.0.line.26": 150000,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 254000,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 226000,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 226000,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 226000,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 226000,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 208711,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 208711,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 208711,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 21836,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 6053,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 27889,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 13945,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 226000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 226000,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 13945,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 13945,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 27889,
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 78,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 27967,
    },
  },
  "form-8959": {
    engineFields: {
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 200000,
      // Line 8 — Self-employment income from Schedule SE (Form 1040), Part I, line 6
      "form-8959.0.line.8_self_employment_income": 208711,
      // Line 9 — Enter the following amount for your filing status
      "form-8959.0.line.9_filing_status_threshold_se": 200000,
      // Line 11 — Subtract line 10 from line 9. If zero or less, enter -0-
      "form-8959.0.line.11_threshold_reduced_by_wages": 200000,
      // Line 12 — Subtract line 11 from line 8. If zero or less, enter -0-
      "form-8959.0.line.12_excess_se_income": 8711,
      // Line 13 — Additional Medicare Tax on self-employment income. Multiply line 12 by 0.9% (0.0
      "form-8959.0.line.13_additional_medicare_tax_se": 78,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 78,
    },
  },
  "form-8995-a": {
    engineFields: {
      // Line 2 — Qualified business income from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.2_a": 212055,
      // Line 3 — Multiply line 2 by 20% (0.20) (Column A)
      "form-8995-a.0.line.3_a": 42411,
      // Line 4 — Allocable share of W-2 wages from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.4_a": 150000,
      // Line 5 — Multiply line 4 by 50% (0.50) (Column A)
      "form-8995-a.0.line.5_a": 75000,
      // Line 6 — Multiply line 4 by 25% (0.25) (Column A)
      "form-8995-a.0.line.6_a": 37500,
      // Line 9 — Add lines 6 and 8 (Column A)
      "form-8995-a.0.line.9_a": 37500,
      // Line 10 — Enter the greater of line 5 or line 9 (Column A)
      "form-8995-a.0.line.10_a": 75000,
      // Line 11 — W-2 wage and UBIA of qualified property limitation. Enter the smaller of line 3
      "form-8995-a.0.line.11_a": 42411,
      // Line 13 — Qualified business income deduction before patron reduction. Enter the greater o
      "form-8995-a.0.line.13_a": 42411,
      // Line 15 — Qualified business income component. Subtract line 14 from line 13 (Column A)
      "form-8995-a.0.line.15_a": 42411,
      // Line 16 — Total qualified business income component. Add all amounts reported on line 15
      "form-8995-a.0.line.16": 42411,
      // Line 27 — Total qualified business income component from all qualified trades, businesses,
      "form-8995-a.1.line.27": 42411,
      // Line 32 — Qualified business income deduction before the income limitation. Add lines 27 a
      "form-8995-a.1.line.32": 42411,
      // Line 33 — Taxable income before qualified business income deduction
      "form-8995-a.1.line.33": 196305,
      // Line 35 — Subtract line 34 from line 33. If zero or less, enter -0-
      "form-8995-a.1.line.35": 196305,
      // Line 36 — Income limitation. Multiply line 35 by 20% (0.20)
      "form-8995-a.1.line.36": 39261,
      // Line 37 — Qualified business income deduction before the domestic production activities de
      "form-8995-a.1.line.37": 39261,
      // Line 39 — Total qualified business income deduction. Add lines 37 and 38
      "form-8995-a.1.line.39": 39261,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 226000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 226000,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 13945,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 212055,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 212055,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 39261,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 55011,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 157044,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 30538,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 30538,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 30538,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 27967,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 58505,
      // Line 26 — 2025 estimated tax payments and amount applied from 2024 return
      "form-1040.line.26": 56000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 56000,
      // Line 37 — Amount you owe
      "form-1040.line.37": 2505,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Line 3 . Business income or (loss). See instructions. Column A. Federal Amounts.
      "schedule-ca.0.line.b3_federal": 226000,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 226000,
      // Line 15. Deductible part of self-employment tax. See instructions. Column A. Federal Amoun
      "schedule-ca.2.line.c15_federal": 13945,
      // Line 26. Add line 11 through line 23 and line 25 in columns A, B, and C. See instructions.
      "schedule-ca.3.line.c26_federal": 13945,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 212055,
      // Line 30. Enter the larger of the amount on line 29 or your standard deduction shown below:
      "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 5706,
    },
  },
  "schedule-p": {
    engineFields: {
      // Part 1 . Line 1 . If you itemized deductions, go to line 2 . If you did not itemize deduct
      "schedule-p.0.line.1_standard_deduction": 5706,
      // Line 14 . Total Adjustments and Preferences. Combine line 1 through line 13 .
      "schedule-p.0.line.14_total_adjustments_preferences": 5706,
      // Line 15 . Enter taxable income from Form 540, line 19 . See instructions.
      "schedule-p.0.line.15_taxable_income": 206349,
      // Line 19 . Combine line 14 through line 18 .
      "schedule-p.1.line.19_combine_lines_14_through_18": 212055,
      // Line 21 . Alternative Minimum Taxable Income. Subtract line 20 from line 19 (if married/Re
      "schedule-p.1.line.21_alternative_minimum_taxable_income": 212055,
      // Part 2 . Line 22 . Exemption Amount. (If this schedule is for a certain child under age 24
      "schedule-p.1.line.22_exemption_amount": 92749,
      // Line 23 . Subtract line 22 from line 21 . If zero or less, enter 0 . See instructions.
      "schedule-p.1.line.23_amti_less_exemption": 119306,
      // Line 24 . Tentative Minimum Tax. Multiply line 23 by 7.0% (.07)
      "schedule-p.1.line.24_tentative_minimum_tax": 8351,
      // Line 25 . Regular tax before credits from Form 540, line 31 .
      "schedule-p.1.line.25_regular_tax_before_credits": 15629,
      // Part 3 . Line 1 . Enter the amount from Form 540, line 35 .
      "schedule-p.1.part3.1_tax_from_form_540_line_35": 15476,
      // Line 2 . Enter the tentative minimum tax from Part 2, line 24 .
      "schedule-p.1.part3.2_tentative_minimum_tax": 8351,
      // Section A. Line 3 . Subtract line 2 from line 1 . If zero or less enter 0 and see instruct
      "schedule-p.1.part3.3_excess_tax_offset_by_credits_col_c": 7125,
      // Section A1. Line 4 . Code: 162 . Prison inmate labor credit (FTB 3507). Column A. Credit a
      "schedule-p.1.part3.4_prison_inmate_labor_credit_col_a": 900,
      // Line 4 . Column B*. Credit used this year. *If the taxpayer is subject to the business cre
      "schedule-p.1.part3.4_prison_inmate_labor_credit_col_b": 900,
      // Line 4 . Column C. Tax balance that may be offset by credits.
      "schedule-p.1.part3.4_prison_inmate_labor_credit_col_c": 6225,
      // Section B. Line 11 . If Part 3, line 3 is zero, enter the amount from line 1 . If line 3 i
      "schedule-p.2.part3.11_tax_balance_col_c": 14576,
      // Line 16 . Column A. Credit amount.
      "schedule-p.3.part3.16_credit_amount_col_a": 11851,
      // Line 16 . Column B*. Credit used this year. *If the taxpayer is subject to the business cr
      "schedule-p.3.part3.16_credit_used_col_b": 11851,
      // Line 16 . Column C. Tax balance that may be offset by credits.
      "schedule-p.3.part3.16_tax_balance_col_c": 2725,
      // Verified zero: column (a) is already limited by FTB 3809 Schedule Z line 7.
      "schedule-p.3.part3.16_credit_carryover_col_d": 0,
      // Section B4 . Line 21 . Code: 242 Pass-through entity elective tax credit. Column A. Credit
      "schedule-p.3.part3.21_pte_elective_tax_credit_amount_col_a": 2800,
      // Line 21 . Column B*. Credit used this year. *If the taxpayer is subject to the business cr
      "schedule-p.3.part3.21_pte_elective_tax_credit_used_col_b": 2725,
      // Line 21 . Column D. Credit carryover.
      "schedule-p.3.part3.21_pte_elective_tax_credit_carryover_col_d": 75,
    },
    // Code 210 holds both TTA carryovers on one line, after no film credit.
    renderedText: {
      "schedule-p.3.part3.16_credit_code": "210",
      "schedule-p.3.part3.16_credit_name": "Targeted Tax Area",
    },
  },
  "form-3507": {
    engineFields: {
      // Line 3. Pass-through Prison Inmate Labor Credit(s) from Schedule K-1 (100S, 541, 565, or 5
      "form-3507.0.line.3_pass_through_credit_k1": 900,
      // Line 5. Total available Prison Inmate Labor Credit. Add line 2, line 3, and line 4.
      "form-3507.0.line.5_total_available_credit": 900,
      // Line 6a. Credit claimed. Enter the amount of the credit claimed on the current year tax re
      "form-3507.0.line.6a_credit_claimed": 900,
    },
  },
  "form-3809": {
    engineFields: {
      // Line F. Total number of employees in the T T A.
      "form-3809.0.header.f_total_employees_in_tta": 4,
      // Line G. Gross annual receipts of the business.
      "form-3809.0.header.g_gross_annual_receipts": 480000,
      // Line H. Total asset value of the business.
      "form-3809.0.header.h_total_asset_value": 660000,
      // Part I, Line 1a. Hiring credit carryover from Schedule Z, line 8A, column (f) or line 10,
      "form-3809.0.line.1a_hiring_credit_carryover": 4000,
      // Line 1b. Sales or use tax credit carryover from Schedule Z, line 9A, column (f) or line 11
      "form-3809.0.line.1b_sales_use_tax_credit_carryover": 7851,
      // Line 1c. Add line 1a and line 1b.
      "form-3809.0.line.1c_total_credit_carryover": 11851,
      // Part I, Line 1. Trade or business income. Individuals: Enter the amount from Worksheet I,
      "form-3809.1.line.1_trade_or_business_income": 165726,
      // Line 3. Multiply line 1 by line 2.
      "form-3809.1.line.3_apportioned_business_income": 165726,
      // Line 5. T T A taxable income. Subtract line 4 from line 3.
      "form-3809.1.line.5_tta_taxable_income": 165726,
      // Line 6a. Compute the amount of tax due using the amount on line 5. See instructions.
      "form-3809.1.line.6a_tax_on_tta_income": 11851,
      // Line 6b. Enter the amount of tax from Form 540, line 35; Form 540NR, line 42; Form 541, li
      "form-3809.1.line.6b_tax_from_return": 15476,
      // Line 7. Enter the smaller of line 6a or line 6b. This is the limitation based on the T T A
      "form-3809.1.line.7_tta_business_income_limitation": 11851,
      // Part II, Line 8A. Hiring credit carryover, (e) Limitation based on T T A business income.
      "form-3809.1.line.8a_hiring_credit_carryover_col_e": 11851,
      // Line 8A. Hiring credit carryover, (f) Credit carryover used on Schedule P can never be gre
      "form-3809.1.line.8a_hiring_credit_carryover_col_f": 4000,
      // Line 8B. Hiring credit carryover, (b) Total prior year carryover.
      "form-3809.1.line.8b_hiring_credit_carryover_col_b": 4000,
      // Line 8B. Hiring credit carryover, (d) Total credit column (b) minus column (c).
      "form-3809.1.line.8b_hiring_credit_carryover_col_d": 4000,
      // Line 8B. Hiring credit carryover, (e) Limitation based on T T A business income.
      "form-3809.1.line.8b_hiring_credit_carryover_col_e": 4000,
      // Line 9A. Sales or use tax credit carryover, (e) Limitation based on T T A business income.
      "form-3809.1.line.9a_sales_use_tax_credit_carryover_col_e": 7851,
      // Line 9A. Sales or use tax credit carryover, (f) Credit carryover used on Schedule P can ne
      "form-3809.1.line.9a_sales_use_tax_credit_carryover_col_f": 7851,
      // Line 9B. Sales or use tax credit carryover, (b) Total prior year carryover.
      "form-3809.1.line.9b_sales_use_tax_credit_carryover_col_b": 16000,
      // Line 9B. Sales or use tax credit carryover, (d) Total credit column (b) minus column (c).
      "form-3809.1.line.9b_sales_use_tax_credit_carryover_col_d": 16000,
      // Line 9B. Sales or use tax credit carryover, (e) Limitation based on T T A business income.
      "form-3809.1.line.9b_sales_use_tax_credit_carryover_col_e": 7851,
      // Line 9B. Sales or use tax credit carryover, (g) Total credit carryover column (d) minus co
      "form-3809.1.line.9b_sales_use_tax_credit_carryover_col_g": 8149,
      // Verified zeros: no TTA NOL, and the hiring credit is used in full.
      "form-3809.1.line.4_tta_nol_deduction": 0,
      "form-3809.1.line.8b_hiring_credit_carryover_col_g": 0,
    },
    renderedText: {
      "form-3809.0.header.sic_code": "3599",
      "form-3809.0.header.e_principal_business_activity_code": "332710",
      "form-3809.0.line.2_average_apportionment_percentage": "0.7333",
    },
    // No TTA NOL carryover; Schedule Z line 2 is skipped by an individual; column (c) left blank.
    renderedBlank: [
      "form-3809.0.line.1d_credit_elected_refundable",
      "form-3809.0.line.3a_nol_carryover_prior_years",
      "form-3809.0.line.3b_nol_deduction_current_year",
      "form-3809.0.line.3c_nol_carryover_future_years",
      "form-3809.1.line.2_average_apportionment_percentage",
      "form-3809.1.line.8b_hiring_credit_carryover_col_c",
      "form-3809.1.line.10_hiring_credit_carryover_col_b",
      "form-3809.1.line.12_hiring_credit_carryover_col_b",
    ],
  },
  "form-3804-cr": {
    engineFields: {
      // Line 1a. (c) P T E elective tax credit(s).
      "form-3804-cr.0.part1.1a_electing_pte_col_c": 2800,
      // Line 2. Total P T E elective tax credit amount. Add the amounts in column (c) and enter to
      "form-3804-cr.0.part1.2_total_pte_elective_tax_credit": 2800,
      // Part II, Line 1. Total credit from electing qualified P T E s. See instructions.
      "form-3804-cr.0.part2.1_total_credit_from_ptes": 2800,
      // Line 3. Total available credit. Add line 1 and line 2.
      "form-3804-cr.0.part2.3_total_available_credit": 2800,
      // Line 4. Enter the amount of the credit claimed on the current year tax return. See instruc
      "form-3804-cr.0.part2.4_credit_claimed_current_year": 2725,
      // Line 5. Credit carryover to future years. Subtract line 4 from line 3.
      "form-3804-cr.0.part2.5_credit_carryover_future_years": 75,
    },
  },
  "form-540": {
    engineFields: {
      // Exemptions. For line 7, line 8, line 9, and line 10: Multiply the number you enter in the
      "form-540.line.7_personal_exemption_count": 1,
      // Multiply the number you put in the line 7 box by $153. Enter this number into this field.
      "form-540.line.7_personal_exemption_amount": 153,
      // Line 11. Exemption amount: Add line 7 through line 10. Transfer this amount to line 32. Wh
      "form-540.line.11_total_exemption_amount": 153,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040 or 1040-SR, li
      "form-540.line.13_federal_agi": 212055,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 212055,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 212055,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 206349,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 15629,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 153,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 15476,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 15476,
      // Line 45. To claim more than two credits, see instructions. Attach Schedule P (540).
      "form-540.line.45_schedule_p_credits": 15476,
      // Line 47. Add line 40 through line 46. These are your total credits.
      "form-540.line.47_total_credits": 15476,
      // Line 72. 2025 California estimated tax and other payments. See instructions.
      "form-540.line.72_ca_estimated_tax_payments": 11000,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 11000,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 11000,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 11000,
      // Line 97. Overpaid tax. If line 95 is more than line 64, subtract line 64 from line 95.
      "form-540.line.97_overpaid_tax": 11000,
      // Line 99. Overpaid tax available this year. Subtract line 98 from line 97.
      "form-540.line.99_overpaid_tax_available": 11000,
      // Refund and Direct Deposit. Line 115. Refund or no amount due. Subtract the sum of line 110
      "form-540.line.115_refund_or_no_amount_due": 11000,
      // Verified zero: the three credits take all of line 35.
      "form-540.line.48_tax_after_credits": 0,
    },
    // Three other credits: line 45 holds them, and lines 43 and 44 stay blank.
    renderedBlank: ["form-540.line.43_credit_amount", "form-540.line.44_credit_amount"],
  },
};

export function toveineExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
