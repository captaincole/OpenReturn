/*
 * gawyn — LOCKED expected values, drafted from the engine's
 * output on 2026-11-22 (scripts/draftExpected.ts).
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
  "form-8919": {
    engineFields: {
      // Line 1 (f) — Total wages received with no social security or Medicare tax withholding and
      "form-8919.0.line.1_firm_col_f": 18000,
      // Line 6 — Total wages. Combine lines 1 through 5 in column (f)
      "form-8919.0.line.6_total_wages": 18000,
      // Line 8 — Total social security wages and social security tips (total of boxes 3 and 7 on F
      "form-8919.0.line.8_total_social_security_wages_tips": 62000,
      // Line 9 — Subtract line 8 from line 7. If line 8 is more than line 7, enter -0-
      "form-8919.0.line.9_subtract_line_8_from_7": 114100,
      // Line 10 — Wages subject to social security tax. Enter the smaller of line 6 or line 9
      "form-8919.0.line.10_wages_subject_social_security_tax": 18000,
      // Line 11 — Multiply line 10 by 0.062 (social security tax rate)
      "form-8919.0.line.11_social_security_tax": 1116,
      // Line 12 — Multiply line 6 by 0.0145 (Medicare tax rate)
      "form-8919.0.line.12_medicare_tax": 261,
      // Line 13 — Add lines 11 and 12
      "form-8919.0.line.13_total_uncollected_tax": 1377,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 6 — Uncollected social security and Medicare tax on wages. Attach Form 8919
      "schedule-2.0.line.6_uncollected_ss_medicare_tax_wages": 3251,
      // Line 7 — Total additional social security and Medicare tax. Add lines 5 and 6
      "schedule-2.0.line.7_total_additional_ss_medicare_tax": 3251,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 3251,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 62000,
      // Line 1g — Wages from Form 8919, line 6
      "form-1040.line.1g": 42500,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 104500,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 104500,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 104500,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 104500,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 31500,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 31500,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 73000,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 8286,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 8286,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 8286,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 3251,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 11537,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 5000,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 5000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 5000,
      // Line 37 — Amount you owe
      "form-1040.line.37": 6537,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Part One. Income Adjustment Schedule. Section A. Income from federal Form 1040 or 1040-SR.
      "schedule-ca.0.line.1a_federal": 62000,
      // Line 1 g. Wages from federal Form 8919, line 6 . Column A. Federal Amounts.
      "schedule-ca.0.line.1g_federal": 42500,
      // Line 1z. Add line 1a through line 1i. Column A. Federal Amounts.
      "schedule-ca.0.line.1z_federal": 104500,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 104500,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 104500,
      // Line 30. Enter the larger of the amount on line 29 or your standard deduction shown below:
      "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 11412,
    },
  },
  "form-540": {
    engineFields: {
      // Exemptions. For line 7, line 8, line 9, and line 10: Multiply the number you enter in the
      "form-540.line.7_personal_exemption_count": 2,
      // Multiply the number you put in the line 7 box by $153. Enter this number into this field.
      "form-540.line.7_personal_exemption_amount": 306,
      // Line 11. Exemption amount: Add line 7 through line 10. Transfer this amount to line 32. Wh
      "form-540.line.11_total_exemption_amount": 306,
      // Taxable Income. Line 12. State wages from your federal Form or Forms W-2, box 16 .
      "form-540.line.12_state_wages": 62000,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040 or 1040-SR, li
      "form-540.line.13_federal_agi": 104500,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 104500,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 104500,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 11412,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 93088,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 2656,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 306,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 2350,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 2350,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 2350,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 2350,
      // Payments. Line 71. California income tax withheld. See instructions.
      "form-540.line.71_ca_income_tax_withheld": 2100,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 2100,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 2100,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 2100,
      // Line 100. Tax due. If line 95 is less than line 64, subtract line 95 from line 64.
      "form-540.line.100_tax_due": 250,
      // Amount You Owe. Line 111. Amount You Owe. If you do not have an amount on line 99, add lin
      "form-540.line.111_amount_you_owe": 250,
      // Line 114. Total amount due. See instructions. Enclose, but do not staple, any payment.
      "form-540.line.114_total_amount_due": 250,
    },
  },
};

export function gawynExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
