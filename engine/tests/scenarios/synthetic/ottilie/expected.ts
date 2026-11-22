/*
 * ottilie — LOCKED expected values, drafted from the engine's
 * output on 2026-11-21 (scripts/draftExpected.ts).
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
  "form-2441": {
    engineFields: {
      // Line 1, row 1 — (e) Amount paid
      "form-2441.0.line.1_row_1_amount_paid": 6500,
      // Line 1, row 2 — (e) Amount paid
      "form-2441.0.line.1_row_2_amount_paid": 3000,
      // Line 2, row 1 — (d) Qualified expenses you incurred and paid in 2025 for the person listed
      "form-2441.0.line.2_row_1_expenses": 4300,
      // Line 2, row 2 — (d) Qualified expenses you incurred and paid in 2025 for the person listed
      "form-2441.0.line.2_row_2_expenses": 3000,
      // Line 3 — Add the amounts in column (d) of line 2. Don't enter more than $3,000 if you had
      "form-2441.0.line.3_qualified_expenses_total": 3800,
      // Line 4 — Enter your earned income
      "form-2441.0.line.4_earned_income": 58000,
      // Line 5 — If married filing jointly, enter your spouse's earned income; all others, enter t
      "form-2441.0.line.5_spouse_earned_income": 36650,
      // Line 6 — Enter the smallest of line 3, 4, or 5. If zero or less, enter -0-
      "form-2441.0.line.6_smallest_of_3_4_5": 3800,
      // Line 7 — Enter the amount from Form 1040, 1040-SR, or 1040-NR, line 11a
      "form-2441.0.line.7_agi": 95000,
      // Line 9a — Multiply line 6 by the decimal amount on line 8
      "form-2441.0.line.9a_line_6_times_line_8": 760,
      // Line 9c — Add lines 9a and 9b and enter the result
      "form-2441.0.line.9c_add_9a_9b": 760,
      // Line 10 — Tax liability limit. Enter the amount from the Credit Limit Worksheet in the ins
      "form-2441.0.line.10_tax_liability_limit": 7146,
      // Line 11 — Credit for child and dependent care expenses. Enter the smaller of line 9c or li
      "form-2441.0.line.11_dependent_care_credit": 760,
      // Line 12 — Enter the total amount of dependent care benefits you received in 2025
      "form-2441.1.line.12_benefits_received": 2000,
      // Line 13 — Enter the amount, if any, you carried over from 2024 and used in 2025 during the
      "form-2441.1.line.13_grace_period_carryover": 300,
      // Line 14 — Enter the amount, if any, you forfeited or carried forward to 2026
      "form-2441.1.line.14_forfeited_or_carried_forward": 100,
      // Line 15 — Combine lines 12 through 14
      "form-2441.1.line.15_combined_benefits": 2200,
      // Line 16 — Enter the total amount of qualified expenses incurred in 2025 for the care of th
      "form-2441.1.line.16_qualified_expenses": 9500,
      // Line 17 — Enter the smaller of line 15 or 16
      "form-2441.1.line.17_smaller_line_15_16": 2200,
      // Line 18 — Enter your earned income
      "form-2441.1.line.18_earned_income": 58000,
      // Line 19 — Enter the amount shown below that applies to you: if married filing jointly, you
      "form-2441.1.line.19_spouse_earned_income": 36650,
      // Line 20 — Enter the smallest of line 17, 18, or 19. If zero or less, enter -0-
      "form-2441.1.line.20_smallest_line_17_19": 2200,
      // Line 21 — Enter $5,000 ($2,500 if married filing separately and you were required to enter
      "form-2441.1.line.21_maximum_exclusion": 5000,
      // Line 23 — Subtract line 22 from line 15
      "form-2441.1.line.23_line_15_minus_22": 2200,
      // Line 25 — Excluded benefits. If you checked "No" on line 22, enter the smaller of line 20
      "form-2441.1.line.25_excluded_benefits": 2200,
      // Line 27 — Enter $3,000 ($6,000 if two or more qualifying persons)
      "form-2441.1.line.27_expense_limit": 6000,
      // Line 28 — Add lines 24 and 25
      "form-2441.1.line.28_add_lines_24_25": 2200,
      // Line 29 — Subtract line 28 from line 27. If zero or less, stop. You can't take the credit
      "form-2441.1.line.29_line_27_minus_28": 3800,
      // Line 30 — Complete line 2 on page 1 of this form. Don't include in column (d) any benefits
      "form-2441.1.line.30_line_2_col_d_total": 7300,
      // Line 31 — Enter the smaller of line 29 or 30
      "form-2441.1.line.31_smaller_line_29_30": 3800,
    },
  },
  "schedule-8812": {
    engineFields: {
      // Line 1 — Enter the amount from line 11a of your Form 1040, 1040-SR, or 1040-NR
      "schedule-8812.0.line.1_form_1040_line_11a": 95000,
      // Line 3 — Add lines 1 and 2d
      "schedule-8812.0.line.3_modified_agi": 95000,
      // Line 4 — Number of qualifying children under age 17 with the required social security numb
      "schedule-8812.0.line.4_qualifying_children_under_17": 2,
      // Line 5 — Multiply line 4 by $2,200
      "schedule-8812.0.line.5_qualifying_children_times_2200": 4400,
      // Line 8 — Add lines 5 and 7
      "schedule-8812.0.line.8_total_credit_before_limit": 4400,
      // Line 9 — Enter the amount shown below for your filing status. Married filing jointly—$400,
      "schedule-8812.0.line.9_filing_status_threshold": 400000,
      // Line 12 — Is the amount on line 8 more than the amount on line 11? Yes. Subtract line 11 f
      "schedule-8812.0.line.12_credit_after_phaseout": 4400,
      // Line 13 — Enter the amount from Credit Limit Worksheet A
      "schedule-8812.0.line.13_credit_limit_worksheet_a": 6386,
      // Line 14 — Enter the smaller of line 12 or line 13. This is your child tax credit and credi
      "schedule-8812.0.line.14_child_tax_credit_and_other_dependents": 4400,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 2 — Credit for child and dependent care expenses from Form 2441, line 11
      "schedule-3.0.line.2": 760,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 760,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 94650,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 94650,
      // Line 2b — Taxable interest
      "form-1040.line.2b": 350,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 95000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 95000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 95000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 31500,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 31500,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 63500,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 7146,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 7146,
      // Line 19 — Child tax credit or credit for other dependents from Schedule 8812
      "form-1040.line.19": 4400,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 760,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 5160,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 1986,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 1986,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 6000,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 6000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 6000,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 4014,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 4014,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Part One. Income Adjustment Schedule. Section A. Income from federal Form 1040 or 1040-SR.
      "schedule-ca.0.line.1a_federal": 94650,
      // Line 1z. Add line 1a through line 1i. Column A. Federal Amounts.
      "schedule-ca.0.line.1z_federal": 94650,
      // Line 2. Taxable interest. Line 2b. Column A. Federal Amounts.
      "schedule-ca.0.line.2b_federal": 350,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 95000,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 95000,
      // Line 30. Enter the larger of the amount on line 29 or your standard deduction shown below:
      "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 11412,
    },
  },
  "form-3506": {
    engineFields: {
      // Item 1 . Amount.
      "form-3506.0.part1.row1_amount_left": 350,
      // Item 2 . Amount.
      "form-3506.0.part1.row1_amount_right": 4800,
      // Line 1 g. Amount paid for care provided. Provider 1 .
      "form-3506.0.line.1g_amount_paid_for_care_provider1": 6500,
      // Line 1 g. Amount paid for care provided. Provider 2 .
      "form-3506.0.line.1g_amount_paid_for_care_provider2": 3000,
      // Line 2 . Item 1 . Column (e). Qualified expenses you incurred and paid in 2025 for the qua
      "form-3506.0.line.2_row1_qualified_expenses_col_e": 4300,
      // Line 2 . Item 2 . Column (e). Qualified expenses you incurred and paid in 2025 for the qua
      "form-3506.0.line.2_row2_qualified_expenses_col_e": 3000,
      // Line 3 . Add the amounts in column (e) of line 2 . Do not enter more than $3,000 for one q
      "form-3506.0.line.3_total_qualified_expenses": 3800,
      // Line 4 . Enter YOUR earned income. See instructions.
      "form-3506.0.line.4_your_earned_income": 58000,
      // Line 5 . If married or a Registered Domestic Partner filing a joint return, enter your spo
      "form-3506.0.line.5_spouse_rdp_earned_income": 36650,
      // Line 6 . Enter the smallest of line 3, line 4, or line 5 .
      "form-3506.0.line.6_smallest_of_lines_3_4_5": 3800,
      // Line 8 . Multiply line 6 by the decimal amount on line 7 .
      "form-3506.0.line.8_line_6_times_line_7": 760,
      // Line 10 . Multiply line 8 by the decimal amount on line 9 .
      "form-3506.0.line.10_line_8_times_line_9": 258,
      // Line 11 — no 2024 expenses paid in 2025 (a verified zero, added by hand).
      "form-3506.0.line.11_prior_year_expenses_credit": 0,
      // Line 12 . Add line 10 and line 11 . Enter the amount here and on Form 540, line 40; or For
      "form-3506.0.line.12_child_dependent_care_credit": 258,
      // Part four . Dependent Care Benefits. Line 13 . Enter the total amount of dependent care be
      "form-3506.1.line.13_dependent_care_benefits_received": 2000,
      // Line 14 . Enter the amount, if any, you carried over from 2024 and used in 2025 during the
      "form-3506.1.line.14_carryover_used_grace_period": 300,
      // Line 15 . Enter the amount, if any, you forfeited or carried forward to 2026 . See instruc
      "form-3506.1.line.15_forfeited_or_carried_forward": 100,
      // Line 16 . Combine line 13 through line 15 .
      "form-3506.1.line.16_combined_benefits": 2200,
      // Line 17 . Enter the total amount of qualified expenses incurred in 2025 for the care of th
      "form-3506.1.line.17_qualified_expenses_incurred": 9500,
      // Line 18 . Enter the smaller of line 16 or line 17 .
      "form-3506.1.line.18_smaller_of_line_16_or_17": 2200,
      // Line 19 . Enter your earned income.
      "form-3506.1.line.19_your_earned_income": 58000,
      // Line 20 . If married or a Registered Domestic Partner filing a joint return, enter YOUR SP
      "form-3506.1.line.20_spouse_earned_income": 36650,
      // Line 21 . Enter the smallest of line 18, line 19, or line 20 .
      "form-3506.1.line.21_smallest_of_line_18_19_20": 2200,
      // Line 22 . Enter $5,000 ($2,500 if married or a Registered Domestic Partner filing separate
      "form-3506.1.line.22_exclusion_limit": 5000,
      // Line 23 — benefits from the couple's own business: none (a verified zero, added by hand).
      "form-3506.1.line.23_benefits_from_own_business": 0,
      // Line 24 . Subtract line 23 from line 16 .
      "form-3506.1.line.24_line_16_minus_line_23": 2200,
      // Line 25 — deductible benefits: the smallest of 21, 22 and 23 (a verified zero, added by hand).
      "form-3506.1.line.25_deductible_benefits": 0,
      // Line 26 . Excluded benefits. Subtract line 25 from the smaller of line 21 or line 22 . If
      "form-3506.1.line.26_excluded_benefits": 2200,
      // Line 27 — taxable benefits: 2,200 − 2,200 (a verified zero, added by hand).
      "form-3506.1.line.27_taxable_benefits": 0,
      // Line 28 . Enter $3,000 ($6,000 if two or more qualifying persons).
      "form-3506.1.line.28_expense_limit": 6000,
      // Line 29 . Add line 25 and line 26 .
      "form-3506.1.line.29_deductible_plus_excluded_benefits": 2200,
      // Line 30 . Subtract line 29 from line 28 . If zero or less, stop. You do not qualify for th
      "form-3506.1.line.30_limit_minus_benefits": 3800,
      // Line 31 . Complete Side 1, Part 3, line 2 . Add the amounts in column (e) and enter the to
      "form-3506.1.line.31_total_column_e_expenses": 7300,
      // Line 32 . Enter the amount from your federal Form 2441, Part 3, line 31 .
      "form-3506.1.line.32_federal_form_2441_line_31": 3800,
      // Line 33 . Enter the smallest of line 30, line 31, or line 32 . Also, enter this amount on
      "form-3506.1.line.33_smallest_of_line_30_31_32": 3800,
    },
    renderedText: {
      // Lines 7 and 9 print the two digits after the printed decimal point.
      "form-3506.0.line.7_federal_credit_decimal_amount": "20",
      "form-3506.0.line.9_california_credit_decimal_amount": "34",
      "form-3506.0.line.1c_care_provider_telephone_provider1": "559-555-0147",
      "form-3506.0.line.1e_identification_number_provider1": "123456783",
      "form-3506.0.line.2_row2_physical_custody_percentage_col_d": "58",
      "form-3506.0.line.2_row1_date_of_birth_col_c": "03/14/2021",
    },
    renderedBlank: [
      // Ines and Mateo are not disabled; no third qualifying person.
      "form-3506.0.line.2_row1_physical_custody_percentage_col_d",
      "form-3506.0.line.2_row3_first_name_col_a",
      "form-3506.1.worksheet.15_prior_year_expenses_credit",
    ],
    renderedChecked: [
      "form-3506.0.line.1d_person_or_organization_provider1",
      "form-3506.0.line.1d_person_or_organization_provider2",
    ],
  },
  "form-540": {
    engineFields: {
      // Exemptions. For line 7, line 8, line 9, and line 10: Multiply the number you enter in the
      "form-540.line.7_personal_exemption_count": 2,
      // Multiply the number you put in the line 7 box by $153. Enter this number into this field.
      "form-540.line.7_personal_exemption_amount": 306,
      // Line 10. Total dependent exemptions
      "form-540.line.10_dependent_exemption_count": 2,
      // Multiply the number of total dependent exemptions you put in the line 10 box by $475. Ente
      "form-540.line.10_dependent_exemption_amount": 950,
      // Line 11. Exemption amount: Add line 7 through line 10. Transfer this amount to line 32. Wh
      "form-540.line.11_total_exemption_amount": 1256,
      // Taxable Income. Line 12. State wages from your federal Form or Forms W-2, box 16 .
      "form-540.line.12_state_wages": 94650,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040 or 1040-SR, li
      "form-540.line.13_federal_agi": 95000,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 95000,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 95000,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 11412,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 83588,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 2086,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 1256,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 830,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 830,
      // Special Credits. Line 40. Nonrefundable Child and Dependent Care Expenses Credit. See inst
      "form-540.line.40_child_dependent_care_credit": 258,
      // Line 47. Add line 40 through line 46. These are your total credits.
      "form-540.line.47_total_credits": 258,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 572,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 572,
      // Payments. Line 71. California income tax withheld. See instructions.
      "form-540.line.71_ca_income_tax_withheld": 2200,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 2200,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 2200,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 2200,
      // Line 97. Overpaid tax. If line 95 is more than line 64, subtract line 64 from line 95.
      "form-540.line.97_overpaid_tax": 1628,
      // Line 99. Overpaid tax available this year. Subtract line 98 from line 97.
      "form-540.line.99_overpaid_tax_available": 1628,
      // Refund and Direct Deposit. Line 115. Refund or no amount due. Subtract the sum of line 110
      "form-540.line.115_refund_or_no_amount_due": 1628,
    },
  },
};

export function ottilieExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
