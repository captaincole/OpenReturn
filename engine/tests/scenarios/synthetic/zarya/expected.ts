/*
 * zarya — LOCKED expected values, drafted from the engine's
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
      "schedule-c.0.line.1": 210000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 210000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 210000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 210000,
      // Line 18 — Office expense
      "schedule-c.0.line.18": 2000,
      // Line 20b — Rent or lease: Other business property
      "schedule-c.0.line.20b": 24000,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 38000,
      // Line 23 — Taxes and licenses
      "schedule-c.0.line.23": 4000,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 3000,
      // Line 25 — Utilities
      "schedule-c.0.line.25": 9000,
      // Line 26 — Wages (less employment credits)
      "schedule-c.0.line.26": 70000,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 150000,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 60000,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 60000,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 60000,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 60000,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 55410,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 55410,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 55410,
      // Line 8a — Total social security wages and tips (total of boxes 3 and 7 on Form(s) W-2) and
      "schedule-se.0.line.8a": 176100,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 1607,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 1607,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 804,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 60000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 60000,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 804,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 804,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 1607,
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 319,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 1926,
    },
  },
  "form-8959": {
    engineFields: {
      // Line 1 — Medicare wages and tips from Form W-2, box 5
      "form-8959.0.line.1_medicare_wages_tips": 180000,
      // Line 4 — Add lines 1 through 3
      "form-8959.0.line.4_total_medicare_wages": 180000,
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 200000,
      // Line 8 — Self-employment income from Schedule SE (Form 1040), Part I, line 6
      "form-8959.0.line.8_self_employment_income": 55410,
      // Line 9 — Enter the following amount for your filing status
      "form-8959.0.line.9_filing_status_threshold_se": 200000,
      // Line 10 — Enter the amount from line 4
      "form-8959.0.line.10_medicare_wages_from_line4": 180000,
      // Line 11 — Subtract line 10 from line 9. If zero or less, enter -0-
      "form-8959.0.line.11_threshold_reduced_by_wages": 20000,
      // Line 12 — Subtract line 11 from line 8. If zero or less, enter -0-
      "form-8959.0.line.12_excess_se_income": 35410,
      // Line 13 — Additional Medicare Tax on self-employment income. Multiply line 12 by 0.9% (0.0
      "form-8959.0.line.13_additional_medicare_tax_se": 319,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 319,
      // Line 19 — Medicare tax withheld from Form W-2, box 6
      "form-8959.0.line.19_medicare_tax_withheld": 2610,
      // Line 20 — Enter the amount from line 1
      "form-8959.0.line.20_medicare_wages_from_line1": 180000,
      // Line 21 — Multiply line 20 by 1.45% (0.0145). Regular Medicare tax withholding on Medicare
      "form-8959.0.line.21_regular_medicare_tax_on_wages": 2610,
    },
  },
  "form-8995-a": {
    engineFields: {
      // Line 2 — Qualified business income from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.2_a": 59196,
      // Line 3 — Multiply line 2 by 20% (0.20) (Column A)
      "form-8995-a.0.line.3_a": 11839,
      // Line 4 — Allocable share of W-2 wages from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.4_a": 70000,
      // Line 5 — Multiply line 4 by 50% (0.50) (Column A)
      "form-8995-a.0.line.5_a": 35000,
      // Line 6 — Multiply line 4 by 25% (0.25) (Column A)
      "form-8995-a.0.line.6_a": 17500,
      // Line 9 — Add lines 6 and 8 (Column A)
      "form-8995-a.0.line.9_a": 17500,
      // Line 10 — Enter the greater of line 5 or line 9 (Column A)
      "form-8995-a.0.line.10_a": 35000,
      // Line 11 — W-2 wage and UBIA of qualified property limitation. Enter the smaller of line 3
      "form-8995-a.0.line.11_a": 11839,
      // Line 13 — Qualified business income deduction before patron reduction. Enter the greater o
      "form-8995-a.0.line.13_a": 11839,
      // Line 15 — Qualified business income component. Subtract line 14 from line 13 (Column A)
      "form-8995-a.0.line.15_a": 11839,
      // Line 16 — Total qualified business income component. Add all amounts reported on line 15
      "form-8995-a.0.line.16": 11839,
      // Line 27 — Total qualified business income component from all qualified trades, businesses,
      "form-8995-a.1.line.27": 11839,
      // Line 32 — Qualified business income deduction before the income limitation. Add lines 27 a
      "form-8995-a.1.line.32": 11839,
      // Line 33 — Taxable income before qualified business income deduction
      "form-8995-a.1.line.33": 223446,
      // Line 35 — Subtract line 34 from line 33. If zero or less, enter -0-
      "form-8995-a.1.line.35": 223446,
      // Line 36 — Income limitation. Multiply line 35 by 20% (0.20)
      "form-8995-a.1.line.36": 44689,
      // Line 37 — Qualified business income deduction before the domestic production activities de
      "form-8995-a.1.line.37": 11839,
      // Line 39 — Total qualified business income deduction. Add lines 37 and 38
      "form-8995-a.1.line.39": 11839,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 180000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 180000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 60000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 240000,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 804,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 239196,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 239196,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 11839,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 27589,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 211607,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 44777,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 44777,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 44777,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 1926,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 46703,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 36000,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 36000,
      // Line 26 — 2025 estimated tax payments and amount applied from 2024 return
      "form-1040.line.26": 18000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 54000,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 7297,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 7297,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Part One. Income Adjustment Schedule. Section A. Income from federal Form 1040 or 1040-SR.
      "schedule-ca.0.line.1a_federal": 180000,
      // Line 1z. Add line 1a through line 1i. Column A. Federal Amounts.
      "schedule-ca.0.line.1z_federal": 180000,
      // Line 3 . Business income or (loss). See instructions. Column A. Federal Amounts.
      "schedule-ca.0.line.b3_federal": 60000,
      // Line 9 b3. Net operating loss deduction from form FTB 3805Z, 3807, or 3809. Column B. Subt
      "schedule-ca.2.line.b9b3_subtractions": 23000,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 240000,
      // Line 10. Column B. Subtractions.
      "schedule-ca.2.line.b10_subtractions": 23000,
      // Line 15. Deductible part of self-employment tax. See instructions. Column A. Federal Amoun
      "schedule-ca.2.line.c15_federal": 804,
      // Line 26. Add line 11 through line 23 and line 25 in columns A, B, and C. See instructions.
      "schedule-ca.3.line.c26_federal": 804,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 239196,
      // Line 27. Column B. Subtractions.
      "schedule-ca.3.line.c27_subtractions": 23000,
      // Line 30. Enter the larger of the amount on line 29 or your standard deduction shown below:
      "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 5706,
    },
  },
  "form-3809": {
    engineFields: {
      // Line F. Total number of employees in the T T A.
      "form-3809.0.header.f_total_employees_in_tta": 5,
      // Line G. Gross annual receipts of the business.
      "form-3809.0.header.g_gross_annual_receipts": 210000,
      // Line H. Total asset value of the business.
      "form-3809.0.header.h_total_asset_value": 140000,
      // Part I, Line 1a. Hiring credit carryover from Schedule Z, line 8A, column (f) or line 10,
      "form-3809.0.line.1a_hiring_credit_carryover": 2500,
      // Line 1c. Add line 1a and line 1b.
      "form-3809.0.line.1c_total_credit_carryover": 2500,
      // Part III, Line 3a. Enter the total N O L carryover from prior years from Worksheet II, lin
      "form-3809.0.line.3a_nol_carryover_prior_years": 23000,
      // Line 3b. Enter the total N O L deduction used in the current year from Worksheet II, line
      "form-3809.0.line.3b_nol_deduction_current_year": 23000,
      // Part I, Line 1. Trade or business income. Individuals: Enter the amount from Worksheet I,
      "form-3809.1.line.1_trade_or_business_income": 195000,
      // Line 3. Multiply line 1 by line 2.
      "form-3809.1.line.3_apportioned_business_income": 195000,
      // Line 4. Enter the T T A N O L deduction from Worksheet II, line 9, column (c).
      "form-3809.1.line.4_tta_nol_deduction": 23000,
      // Line 5. T T A taxable income. Subtract line 4 from line 3.
      "form-3809.1.line.5_tta_taxable_income": 172000,
      // Line 6a. Compute the amount of tax due using the amount on line 5. See instructions.
      "form-3809.1.line.6a_tax_on_tta_income": 12435,
      // Line 6b. Enter the amount of tax from Form 540, line 35; Form 540NR, line 42; Form 541, li
      "form-3809.1.line.6b_tax_from_return": 15861,
      // Line 7. Enter the smaller of line 6a or line 6b. This is the limitation based on the T T A
      "form-3809.1.line.7_tta_business_income_limitation": 12435,
      // Part II, Line 8A. Hiring credit carryover, (e) Limitation based on T T A business income.
      "form-3809.1.line.8a_hiring_credit_carryover_col_e": 12435,
      // Line 8A. Hiring credit carryover, (f) Credit carryover used on Schedule P can never be gre
      "form-3809.1.line.8a_hiring_credit_carryover_col_f": 2500,
      // Line 8B. Hiring credit carryover, (b) Total prior year carryover.
      "form-3809.1.line.8b_hiring_credit_carryover_col_b": 2500,
      // Line 8B. Hiring credit carryover, (d) Total credit column (b) minus column (c).
      "form-3809.1.line.8b_hiring_credit_carryover_col_d": 2500,
      // Line 8B. Hiring credit carryover, (e) Limitation based on T T A business income.
      "form-3809.1.line.8b_hiring_credit_carryover_col_e": 2500,
      // Line 9A. Sales or use tax credit carryover, (e) Limitation based on T T A business income.
      "form-3809.1.line.9a_sales_use_tax_credit_carryover_col_e": 9935,
      // Verified zeros: the NOLs are used in full, the hiring credit too, and no sales or use tax credit.
      "form-3809.0.line.1b_sales_use_tax_credit_carryover": 0,
      "form-3809.0.line.3c_nol_carryover_future_years": 0,
      "form-3809.1.line.8b_hiring_credit_carryover_col_g": 0,
      "form-3809.1.line.9a_sales_use_tax_credit_carryover_col_f": 0,
      "form-3809.1.line.9b_sales_use_tax_credit_carryover_col_b": 0,
      "form-3809.1.line.9b_sales_use_tax_credit_carryover_col_g": 0,
    },
    renderedText: {
      "form-3809.0.header.sic_code": "2051",
      "form-3809.0.line.2_average_apportionment_percentage": "1.0000",
    },
    renderedBlank: [
      "form-3809.0.line.1d_credit_elected_refundable",
      "form-3809.1.line.2_average_apportionment_percentage",
      "form-3809.1.line.9b_sales_use_tax_credit_carryover_col_c",
      "form-3809.1.line.11_sales_use_tax_credit_carryover_col_b",
      "form-3809.1.line.13_sales_use_tax_credit_carryover_col_b",
    ],
  },
  "schedule-s": {
    engineFields: {
      // Row 1 . Column (B). Double-taxed income taxable by California.
      "schedule-s.0.part1.row1_taxable_by_california_col_b": 40000,
      // Row 1 . Column (C). Double-taxed income taxable by other state.
      "schedule-s.0.part1.row1_taxable_by_other_state_col_c": 40000,
      // Line 1 . Total double-taxed income. Column (B). Double-taxed income taxable by California.
      "schedule-s.0.line.1_total_double_taxed_income_col_b": 40000,
      // Line 1 . Total double-taxed income. Column (C). Double-taxed income taxable by other state
      "schedule-s.0.line.1_total_double_taxed_income_col_c": 40000,
      // Part 2 . Line 2 . California tax liability. See instructions.
      "schedule-s.0.line.2_california_tax_liability": 13361,
      // Line 3 . Double-taxed income taxable by California. Enter the amount from Part 1, line 1,
      "schedule-s.0.line.3_double_taxed_income_california": 40000,
      // Line 4 . California adjusted gross income. See instructions.
      "schedule-s.0.line.4_california_adjusted_gross_income": 216196,
      // Line 6 . Multiply line 2 by line 5 .
      "schedule-s.0.line.6_california_tax_on_double_taxed_income": 2472,
      // Line 7 . Income tax liability paid to other state. Enter amount.
      "schedule-s.0.line.7_tax_paid_to_other_state": 1800,
      // Line 8 . Double-taxed income taxable by other state. Enter the amount from Part 1, line 1,
      "schedule-s.0.line.8_double_taxed_income_other_state": 40000,
      // Line 9 . Adjusted gross income taxable by other state. See instructions.
      "schedule-s.0.line.9_other_state_adjusted_gross_income": 40000,
      // Line 11 . Multiply line 7 by line 10 .
      "schedule-s.0.line.11_other_state_tax_on_double_taxed_income": 1800,
      // Line 12 . Other state tax credit. Enter the smaller of line 6 or line 11 . Use Credit Code
      "schedule-s.0.line.12_other_state_tax_credit": 1800,
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
      // Taxable Income. Line 12. State wages from your federal Form or Forms W-2, box 16 .
      "form-540.line.12_state_wages": 180000,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040 or 1040-SR, li
      "form-540.line.13_federal_agi": 239196,
      // Line 14. California adjustments – subtractions. Enter the amount from Schedule CA (540), P
      "form-540.line.14_ca_adjustments_subtractions": 23000,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 216196,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 216196,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 210490,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 16014,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 153,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 15861,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 15861,
      // Line 43. Enter credit amount
      "form-540.line.43_credit_amount": 2500,
      // Line 44. Enter credit amount
      "form-540.line.44_credit_amount": 1800,
      // Line 47. Add line 40 through line 46. These are your total credits.
      "form-540.line.47_total_credits": 4300,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 11561,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 11561,
      // Payments. Line 71. California income tax withheld. See instructions.
      "form-540.line.71_ca_income_tax_withheld": 12500,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 12500,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 12500,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 12500,
      // Line 97. Overpaid tax. If line 95 is more than line 64, subtract line 64 from line 95.
      "form-540.line.97_overpaid_tax": 939,
      // Line 99. Overpaid tax available this year. Subtract line 98 from line 97.
      "form-540.line.99_overpaid_tax_available": 939,
      // Refund and Direct Deposit. Line 115. Refund or no amount due. Subtract the sum of line 110
      "form-540.line.115_refund_or_no_amount_due": 939,
    },
    // Two other credits: lines 43 and 44 hold them by name and code, and line 45 stays blank.
    renderedText: {
      "form-540.line.43_credit_name": "Targeted Tax Area",
      "form-540.line.43_credit_code": "210",
      "form-540.line.44_credit_name": "Other State Tax",
      "form-540.line.44_credit_code": "187",
    },
    renderedBlank: ["form-540.line.45_schedule_p_credits"],
  },
};

export function zaryaExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
