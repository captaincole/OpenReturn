/*
 * shemerin — LOCKED expected values, drafted from the engine's
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
      "schedule-c.0.line.1": 620000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 620000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 620000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 620000,
      // Line 20b — Rent or lease: Other business property
      "schedule-c.0.line.20b": 60000,
      // Line 21 — Repairs and maintenance
      "schedule-c.0.line.21": 16000,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 110000,
      // Line 23 — Taxes and licenses
      "schedule-c.0.line.23": 12000,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 18000,
      // Line 25 — Utilities
      "schedule-c.0.line.25": 24000,
      // Line 26 — Wages (less employment credits)
      "schedule-c.0.line.26": 200000,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 440000,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 180000,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 180000,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 180000,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 180000,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 166230,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 166230,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 166230,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 20613,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 4821,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 25434,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 12717,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 180000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 180000,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 12717,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 12717,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 25434,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 25434,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": 167283,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": 167283,
      // Line 4 — Total qualified business income. Combine lines 2 and 3. If zero or less, enter -0
      "form-8995.0.line.4": 167283,
      // Line 5 — Qualified business income component. Multiply line 4 by 20% (0.20)
      "form-8995.0.line.5": 33457,
      // Line 10 — Qualified business income deduction before the income limitation. Add lines 5 an
      "form-8995.0.line.10": 33457,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 151533,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 151533,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 30307,
      // Line 15 — Qualified business income deduction. Enter the smaller of line 10 or line 14
      "form-8995.0.line.15": 30307,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 180000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 180000,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 12717,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 167283,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 167283,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 30307,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 46057,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 121226,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 21941,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 21941,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 21941,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 25434,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 47375,
      // Line 26 — 2025 estimated tax payments and amount applied from 2024 return
      "form-1040.line.26": 36000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 36000,
      // Line 37 — Amount you owe
      "form-1040.line.37": 11375,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Line 3 . Business income or (loss). See instructions. Column A. Federal Amounts.
      "schedule-ca.0.line.b3_federal": 180000,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 180000,
      // Line 15. Deductible part of self-employment tax. See instructions. Column A. Federal Amoun
      "schedule-ca.2.line.c15_federal": 12717,
      // Line 26. Add line 11 through line 23 and line 25 in columns A, B, and C. See instructions.
      "schedule-ca.3.line.c26_federal": 12717,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 167283,
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
      "schedule-p.0.line.15_taxable_income": 161577,
      // Line 19 . Combine line 14 through line 18 .
      "schedule-p.1.line.19_combine_lines_14_through_18": 167283,
      // Line 21 . Alternative Minimum Taxable Income. Subtract line 20 from line 19 (if married/Re
      "schedule-p.1.line.21_alternative_minimum_taxable_income": 167283,
      // Part 2 . Line 22 . Exemption Amount. (If this schedule is for a certain child under age 24
      "schedule-p.1.line.22_exemption_amount": 92749,
      // Line 23 . Subtract line 22 from line 21 . If zero or less, enter 0 . See instructions.
      "schedule-p.1.line.23_amti_less_exemption": 74534,
      // Line 24 . Tentative Minimum Tax. Multiply line 23 by 7.0% (.07)
      "schedule-p.1.line.24_tentative_minimum_tax": 5217,
      // Line 25 . Regular tax before credits from Form 540, line 31 .
      "schedule-p.1.line.25_regular_tax_before_credits": 11465,
      // Part 3 . Line 1 . Enter the amount from Form 540, line 35 .
      "schedule-p.1.part3.1_tax_from_form_540_line_35": 11312,
      // Line 2 . Enter the tentative minimum tax from Part 2, line 24 .
      "schedule-p.1.part3.2_tentative_minimum_tax": 5217,
      // Section A. Line 3 . Subtract line 2 from line 1 . If zero or less enter 0 and see instruct
      "schedule-p.1.part3.3_excess_tax_offset_by_credits_col_c": 6095,
      // Line 6 . Column A. Credit amount.
      "schedule-p.2.part3.6_credit_amount_col_a": 7971,
      // Line 6 . Column B*. Credit used this year. *If the taxpayer is subject to the business cre
      "schedule-p.2.part3.6_credit_used_col_b": 6095,
      // Line 6 . Column D. Credit carryover.
      "schedule-p.2.part3.6_credit_carryover_col_d": 1876,
      // Section B. Line 11 . If Part 3, line 3 is zero, enter the amount from line 1 . If line 3 i
      "schedule-p.2.part3.11_tax_balance_col_c": 5217,
      // Section B3 . Line 20 . Code: 187, Other state tax credit. Column A. Credit amount.
      "schedule-p.3.part3.20_other_state_tax_credit_amount_col_a": 624,
      // Line 20. Column B*. Credit used this year. *If the taxpayer is subject to the business cre
      "schedule-p.3.part3.20_other_state_tax_credit_used_col_b": 624,
      // Line 20 . Column C. Tax balance that may be offset by credits.
      "schedule-p.3.part3.20_other_state_tax_tax_balance_col_c": 4593,
    },
  },
  "schedule-s": {
    engineFields: {
      // Row 1 . Column (B). Double-taxed income taxable by California.
      "schedule-s.0.part1.row1_taxable_by_california_col_b": 20000,
      // Row 1 . Column (C). Double-taxed income taxable by other state.
      "schedule-s.0.part1.row1_taxable_by_other_state_col_c": 20000,
      // Line 1 . Total double-taxed income. Column (B). Double-taxed income taxable by California.
      "schedule-s.0.line.1_total_double_taxed_income_col_b": 20000,
      // Line 1 . Total double-taxed income. Column (C). Double-taxed income taxable by other state
      "schedule-s.0.line.1_total_double_taxed_income_col_c": 20000,
      // Part 2 . Line 2 . California tax liability. See instructions.
      "schedule-s.0.line.2_california_tax_liability": 5217,
      // Line 3 . Double-taxed income taxable by California. Enter the amount from Part 1, line 1,
      "schedule-s.0.line.3_double_taxed_income_california": 20000,
      // Line 4 . California adjusted gross income. See instructions.
      "schedule-s.0.line.4_california_adjusted_gross_income": 167283,
      // Line 6 . Multiply line 2 by line 5 .
      "schedule-s.0.line.6_california_tax_on_double_taxed_income": 624,
      // Line 7 . Income tax liability paid to other state. Enter amount.
      "schedule-s.0.line.7_tax_paid_to_other_state": 900,
      // Line 8 . Double-taxed income taxable by other state. Enter the amount from Part 1, line 1,
      "schedule-s.0.line.8_double_taxed_income_other_state": 20000,
      // Line 9 . Adjusted gross income taxable by other state. See instructions.
      "schedule-s.0.line.9_other_state_adjusted_gross_income": 20000,
      // Line 11 . Multiply line 7 by line 10 .
      "schedule-s.0.line.11_other_state_tax_on_double_taxed_income": 900,
      // Line 12 . Other state tax credit. Enter the smaller of line 6 or line 11 . Use Credit Code
      "schedule-s.0.line.12_other_state_tax_credit": 624,
    },
  },
  "form-3807": {
    engineFields: {
      // Line F. Total number of employees in the L A M B R A.
      "form-3807.0.header.f_total_employees_in_lambra": 4,
      // Line G. Gross annual receipts of the business.
      "form-3807.0.header.g_gross_annual_receipts": 620000,
      // Line H. Total asset value of the business.
      "form-3807.0.header.h_total_asset_value": 410000,
      // Part I, Line 1a. Hiring credit carryover from Schedule Z, line 8A, column (f) or line 10,
      "form-3807.0.line.1a_hiring_credit_carryover": 2000,
      // Line 1b. Sales or use tax credit carryover from Schedule Z, line 9A, column (f) or line 11
      "form-3807.0.line.1b_sales_use_tax_credit_carryover": 4095,
      // Line 1c. Add line 1a and line 1b.
      "form-3807.0.line.1c_total_credit_carryover": 6095,
      // Line 1d: a verified zero. Line 35 is under $5,000,000, so the limit disallows nothing.
      "form-3807.0.line.1d_credit_elected_refundable": 0,
      // Schedule Z line 4: a verified zero. She has no LAMBRA NOL carryover.
      "form-3807.1.line.4_lambra_nol_deduction": 0,
      // Line 8B (g): a verified zero. The hiring credit is used in full.
      "form-3807.1.line.8b_hiring_credit_carryover_col_g": 0,
      // Schedule Z, Part I, Line 1. Trade or business income. Individuals: Enter the amount from W
      "form-3807.1.line.1_trade_or_business_income": 124000,
      // Line 3. Multiply line 1 by line 2.
      "form-3807.1.line.3_apportioned_business_income": 124000,
      // Line 5. L A M B R A taxable income. Subtract line 4 from line 3.
      "form-3807.1.line.5_lambra_taxable_income": 124000,
      // Line 6a. Compute the amount of tax due using the amount on line 5. See instructions.
      "form-3807.1.line.6a_tax_on_lambra_income": 7971,
      // Line 6b. Enter the amount of tax from Form 540, line 35; Form 540N R, line 42; Form 541, l
      "form-3807.1.line.6b_tax_from_return": 11312,
      // Line 7. Enter the smaller of line 6a or line 6b. This is the limitation based on L A M B R
      "form-3807.1.line.7_lambra_income_limitation": 7971,
      // Part II, Line 8. Hiring credit carryover (A), (e) Limitation based on L A M B R A business
      "form-3807.1.line.8a_hiring_credit_carryover_col_e": 7971,
      // Line 8. Hiring credit carryover (A), (f) Credit carryover used on Schedule P can never be
      "form-3807.1.line.8a_hiring_credit_carryover_col_f": 2000,
      // Line 8. Hiring credit carryover (B), (b) Total prior year carryover.
      "form-3807.1.line.8b_hiring_credit_carryover_col_b": 2000,
      // Line 8. Hiring credit carryover (B), (d) Total credit column (b) minus column (c).
      "form-3807.1.line.8b_hiring_credit_carryover_col_d": 2000,
      // Line 8. Hiring credit carryover (B), (e) Limitation based on L A M B R A business income.
      "form-3807.1.line.8b_hiring_credit_carryover_col_e": 2000,
      // Line 9. Sales or use tax credit carryover (A), (e) Limitation based on L A M B R A busines
      "form-3807.1.line.9a_sales_use_tax_credit_carryover_col_e": 5971,
      // Line 9. Sales or use tax credit carryover (A), (f) Credit carryover used on Schedule P can
      "form-3807.1.line.9a_sales_use_tax_credit_carryover_col_f": 4095,
      // Line 9. Sales or use tax credit carryover (B), (b) Total prior year carryover.
      "form-3807.1.line.9b_sales_use_tax_credit_carryover_col_b": 9000,
      // Line 9. Sales or use tax credit carryover (B), (d) Total credit column (b) minus column (c
      "form-3807.1.line.9b_sales_use_tax_credit_carryover_col_d": 9000,
      // Line 9. Sales or use tax credit carryover (B), (e) Limitation based on L A M B R A busines
      "form-3807.1.line.9b_sales_use_tax_credit_carryover_col_e": 4095,
      // Line 9. Sales or use tax credit carryover (B), (g) Total credit carryover column (d) minus
      "form-3807.1.line.9b_sales_use_tax_credit_carryover_col_g": 4905,
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
      "form-540.line.13_federal_agi": 167283,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 167283,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 167283,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 161577,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 11465,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 153,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 11312,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 11312,
      // Line 43. Enter credit amount
      "form-540.line.43_credit_amount": 6095,
      // Line 44. Enter credit amount
      "form-540.line.44_credit_amount": 624,
      // Line 47. Add line 40 through line 46. These are your total credits.
      "form-540.line.47_total_credits": 6719,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 4593,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 4593,
      // Line 72. 2025 California estimated tax and other payments. See instructions.
      "form-540.line.72_ca_estimated_tax_payments": 5000,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 5000,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 5000,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 5000,
      // Line 97. Overpaid tax. If line 95 is more than line 64, subtract line 64 from line 95.
      "form-540.line.97_overpaid_tax": 407,
      // Line 99. Overpaid tax available this year. Subtract line 98 from line 97.
      "form-540.line.99_overpaid_tax_available": 407,
      // Refund and Direct Deposit. Line 115. Refund or no amount due. Subtract the sum of line 110
      "form-540.line.115_refund_or_no_amount_due": 407,
    },
  },
};

export function shemerinExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
