/*
 * elyas — LOCKED expected values, drafted from the engine's
 * output on 2026-11-24 (scripts/draftExpected.ts).
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
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 95000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 95000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 95000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 95000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 95000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 79250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 12355,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 12355,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 12355,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 12355,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 9800,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 9800,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 9800,
      // Line 37 — Amount you owe
      "form-1040.line.37": 2555,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Part One. Income Adjustment Schedule. Section A. Income from federal Form 1040 or 1040-SR.
      "schedule-ca.0.line.1a_federal": 95000,
      // Line 1z. Add line 1a through line 1i. Column A. Federal Amounts.
      "schedule-ca.0.line.1z_federal": 95000,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 95000,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 95000,
      // Line 30. Enter the larger of the amount on line 29 or your standard deduction shown below:
      "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 5706,
    },
  },
  "schedule-s": {
    engineFields: {
      // Row 1 . Column (B). Double-taxed income taxable by California.
      "schedule-s.0.part1.row1_taxable_by_california_col_b": 30000,
      // Row 1 . Column (C). Double-taxed income taxable by other state.
      "schedule-s.0.part1.row1_taxable_by_other_state_col_c": 30000,
      // Line 1 . Total double-taxed income. Column (B). Double-taxed income taxable by California.
      "schedule-s.0.line.1_total_double_taxed_income_col_b": 30000,
      // Line 1 . Total double-taxed income. Column (C). Double-taxed income taxable by other state
      "schedule-s.0.line.1_total_double_taxed_income_col_c": 30000,
      // Part 2 . Line 2 . California tax liability. See instructions.
      "schedule-s.0.line.2_california_tax_liability": 4591,
      // Line 3 . Double-taxed income taxable by California. Enter the amount from Part 1, line 1,
      "schedule-s.0.line.3_double_taxed_income_california": 30000,
      // Line 4 . California adjusted gross income. See instructions.
      "schedule-s.0.line.4_california_adjusted_gross_income": 95000,
      // Line 6 . Multiply line 2 by line 5 .
      "schedule-s.0.line.6_california_tax_on_double_taxed_income": 1450,
      // Line 7 . Income tax liability paid to other state. Enter amount.
      "schedule-s.0.line.7_tax_paid_to_other_state": 1500,
      // Line 8 . Double-taxed income taxable by other state. Enter the amount from Part 1, line 1,
      "schedule-s.0.line.8_double_taxed_income_other_state": 30000,
      // Line 9 . Adjusted gross income taxable by other state. See instructions.
      "schedule-s.0.line.9_other_state_adjusted_gross_income": 30000,
      // Line 11 . Multiply line 7 by line 10 .
      "schedule-s.0.line.11_other_state_tax_on_double_taxed_income": 1500,
      // Line 12 . Other state tax credit. Enter the smaller of line 6 or line 11 . Use Credit Code
      "schedule-s.0.line.12_other_state_tax_credit": 1450,
    },
    renderedText: {
      "schedule-s.0.part1.row1_income_item_description_col_a": "Wages, Boston project",
      "schedule-s.0.line.5_california_income_ratio": "03158",
      "schedule-s.0.line.7_other_state_abbreviation": "MA",
      "schedule-s.0.line.10_other_state_income_ratio": "10000",
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
      "form-540.line.12_state_wages": 95000,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040 or 1040-SR, li
      "form-540.line.13_federal_agi": 95000,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 95000,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 95000,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 89294,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 4744,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 153,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 4591,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 4591,
      // Line 43. Enter credit amount
      "form-540.line.43_credit_amount": 1450,
      // Line 47. Add line 40 through line 46. These are your total credits.
      "form-540.line.47_total_credits": 1450,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 3141,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 3141,
      // Payments. Line 71. California income tax withheld. See instructions.
      "form-540.line.71_ca_income_tax_withheld": 3900,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 3900,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 3900,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 3900,
      // Line 97. Overpaid tax. If line 95 is more than line 64, subtract line 64 from line 95.
      "form-540.line.97_overpaid_tax": 759,
      // Line 99. Overpaid tax available this year. Subtract line 98 from line 97.
      "form-540.line.99_overpaid_tax_available": 759,
      // Refund and Direct Deposit. Line 115. Refund or no amount due. Subtract the sum of line 110
      "form-540.line.115_refund_or_no_amount_due": 759,
    },
    renderedText: {
      "form-540.line.43_credit_name": "Other State Tax",
      "form-540.line.43_credit_code": "187",
    },
  },
};

export function elyasExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
