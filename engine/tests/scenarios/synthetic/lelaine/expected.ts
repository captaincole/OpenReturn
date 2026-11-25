/*
 * lelaine — LOCKED expected values, drafted from the engine's
 * output on 2026-11-25 (scripts/draftExpected.ts).
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
  "schedule-8812": {
    engineFields: {
      // Line 1 — Enter the amount from line 11a of your Form 1040, 1040-SR, or 1040-NR
      "schedule-8812.0.line.1_form_1040_line_11a": 110400,
      // Line 3 — Add lines 1 and 2d
      "schedule-8812.0.line.3_modified_agi": 110400,
      // Line 4 — Number of qualifying children under age 17 with the required social security numb
      "schedule-8812.0.line.4_qualifying_children_under_17": 2,
      // Line 5 — Multiply line 4 by $2,200
      "schedule-8812.0.line.5_qualifying_children_times_2200": 4400,
      // Line 6 — Number of other dependents, including any qualifying children who are not under a
      "schedule-8812.0.line.6_other_dependents": 1,
      // Line 7 — Multiply line 6 by $500
      "schedule-8812.0.line.7_other_dependents_times_500": 500,
      // Line 8 — Add lines 5 and 7
      "schedule-8812.0.line.8_total_credit_before_limit": 4900,
      // Line 9 — Enter the amount shown below for your filing status. Married filing jointly—$400,
      "schedule-8812.0.line.9_filing_status_threshold": 400000,
      // Line 12 — Is the amount on line 8 more than the amount on line 11? Yes. Subtract line 11 f
      "schedule-8812.0.line.12_credit_after_phaseout": 4900,
      // Line 13 — Enter the amount from Credit Limit Worksheet A
      "schedule-8812.0.line.13_credit_limit_worksheet_a": 8994,
      // Line 14 — Enter the smaller of line 12 or line 13. This is your child tax credit and credi
      "schedule-8812.0.line.14_child_tax_credit_and_other_dependents": 4900,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 110400,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 110400,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 110400,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 110400,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 110400,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 31500,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 31500,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 78900,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 8994,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 8994,
      // Line 19 — Child tax credit or credit for other dependents from Schedule 8812
      "form-1040.line.19": 4900,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 4900,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 4094,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 4094,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 8900,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 8900,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 8900,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 4806,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 4806,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Part One. Income Adjustment Schedule. Section A. Income from federal Form 1040 or 1040-SR.
      "schedule-ca.0.line.1a_federal": 110400,
      // Line 1z. Add line 1a through line 1i. Column A. Federal Amounts.
      "schedule-ca.0.line.1z_federal": 110400,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 110400,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 110400,
      // Line 30. Enter the larger of the amount on line 29 or your standard deduction shown below:
      "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 11412,
    },
  },
  "form-3853": {
    engineFields: {
      // Line 1. Modified Adjusted Gross Income. (AGI)
      "form-3853.0.part1.1_modified_agi": 110400,
      // Line 6. Modified AGI
      "form-3853.0.part1.6_modified_agi": 24000,
      // Part 4. Individual Shared Responsibility Penalty. Line 1 . Your Individual Shared Responsi
      "form-3853.1.part4.1_shared_responsibility_penalty": 1615,
    },
    // Hand-checked codes: Z all year, the short gap and the second gap, two codes in a month, I, A.
    renderedText: {
      "form-3853.0.part1.3_ecn_3": "KH90552",
      "form-3853.0.part1.4_ecn_1": "No ECN",
      "form-3853.1.part3.1_full_year_code": "Z",
      "form-3853.1.part3.2_first_code_may": "C",
      "form-3853.1.part3.2_first_code_oct": "X",
      "form-3853.1.part3.3_first_code_mar": "K",
      "form-3853.1.part3.3_second_code_mar": "F",
      "form-3853.1.part3.4_full_year_code": "X",
      "form-3853.1.part3.5_first_code_mar": "I",
      "form-3853.1.part3.6_first_code_jul": "A",
    },
    renderedBlank: [
      "form-3853.0.part1.2_modified_agi",
      "form-3853.1.part3.2_full_year_code",
      "form-3853.1.part3.4_first_code_jan",
    ],
  },
  "form-540": {
    engineFields: {
      // Exemptions. For line 7, line 8, line 9, and line 10: Multiply the number you enter in the
      "form-540.line.7_personal_exemption_count": 2,
      // Multiply the number you put in the line 7 box by $153. Enter this number into this field.
      "form-540.line.7_personal_exemption_amount": 306,
      // Line 10. Total dependent exemptions
      "form-540.line.10_dependent_exemption_count": 3,
      // Multiply the number of total dependent exemptions you put in the line 10 box by $475. Ente
      "form-540.line.10_dependent_exemption_amount": 1425,
      // Line 11. Exemption amount: Add line 7 through line 10. Transfer this amount to line 32. Wh
      "form-540.line.11_total_exemption_amount": 1731,
      // Taxable Income. Line 12. State wages from your federal Form or Forms W-2, box 16 .
      "form-540.line.12_state_wages": 110400,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040 or 1040-SR, li
      "form-540.line.13_federal_agi": 110400,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 110400,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 110400,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 11412,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 98988,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 3010,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 1731,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 1279,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 1279,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 1279,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 1279,
      // Payments. Line 71. California income tax withheld. See instructions.
      "form-540.line.71_ca_income_tax_withheld": 1200,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 1200,
      // Line 92. Individual Shared Responsibility (I S R) Penalty. See instructions.
      "form-540.line.92_isr_penalty": 1615,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 1200,
      // Line 96. Individual Shared Responsibility Penalty Balance. If line 92 is more than line 93
      "form-540.line.96_isr_penalty_balance": 415,
      // Line 100. Tax due. If line 95 is less than line 64, subtract line 95 from line 64.
      "form-540.line.100_tax_due": 1279,
      // Amount You Owe. Line 111. Amount You Owe. If you do not have an amount on line 99, add lin
      "form-540.line.111_amount_you_owe": 1694,
      // Line 114. Total amount due. See instructions. Enclose, but do not staple, any payment.
      "form-540.line.114_total_amount_due": 1694,
    },
  },
};

export function lelaineExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
