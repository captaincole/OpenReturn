/*
 * berowyn — LOCKED expected values, drafted from the engine's
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
  "form-982": {
    engineFields: {
      // Line 2 — Total amount of discharged indebtedness excluded from gross income
      "form-982.0.line.2_total_discharged_excluded": 27900,
      // Line 10a — Applied to reduce the basis of nondepreciable and depreciable property if not r
      "form-982.0.line.10a_property_basis": 2900,
      // Line 10b — Applied to reduce the basis of your principal residence
      "form-982.0.line.10b_principal_residence_basis": 25000,
    },
    // The nonbusiness chart: lines 1b, 1e, 2, 10a and 10b; line 3 is not asked.
    renderedChecked: [
      "form-982.0.line.1b_insolvency",
      "form-982.0.line.1e_qualified_principal_residence",
    ],
    renderedBlank: [
      "form-982.0.line.3_elect_real_property_depreciable_yes",
      "form-982.0.line.3_elect_real_property_depreciable_no",
      "form-982.0.line.5_elect_depreciable_basis_first",
    ],
  },
  "schedule-1": {
    engineFields: {
      // Line 8c — Cancellation of debt
      "schedule-1.0.line.8c": 7400,
      // Line 9 — Total other income. Add lines 8a through 8z
      "schedule-1.0.line.9": 7400,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 7400,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 72000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 72000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 7400,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 79400,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 79400,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 79400,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 63650,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 8923,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 8923,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 8923,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 8923,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 7200,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 7200,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 7200,
      // Line 37 — Amount you owe
      "form-1040.line.37": 1723,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Part One. Income Adjustment Schedule. Section A. Income from federal Form 1040 or 1040-SR.
      "schedule-ca.0.line.1a_federal": 72000,
      // Line 1z. Add line 1a through line 1i. Column A. Federal Amounts.
      "schedule-ca.0.line.1z_federal": 72000,
      // Line 8c. Cancellation of debt. Column A. Federal Amounts.
      "schedule-ca.1.line.b8c_federal": 7400,
      // Line 8c. Column C. Additions.
      "schedule-ca.1.line.b8c_additions": 25000,
      // Line 9 a. Total other income. Add line 8a through line 8z. Column A. Federal Amounts.
      "schedule-ca.2.line.b9a_federal": 7400,
      // Line 9 a. Column C. Additions.
      "schedule-ca.2.line.b9a_additions": 25000,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 79400,
      // Line 10. Column C. Additions.
      "schedule-ca.2.line.b10_additions": 25000,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 79400,
      // Line 27. Column C. Additions.
      "schedule-ca.3.line.c27_additions": 25000,
      // Line 30. Enter the larger of the amount on line 29 or your standard deduction shown below:
      "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 5706,
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
      "form-540.line.12_state_wages": 72000,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040 or 1040-SR, li
      "form-540.line.13_federal_agi": 79400,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 79400,
      // Line 16. California adjustments – additions. Enter the amount from Schedule CA (540), Part
      "form-540.line.16_ca_adjustments_additions": 25000,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 104400,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 98694,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 5618,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 153,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 5465,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 5465,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 5465,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 5465,
      // Payments. Line 71. California income tax withheld. See instructions.
      "form-540.line.71_ca_income_tax_withheld": 2900,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 2900,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 2900,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 2900,
      // Line 100. Tax due. If line 95 is less than line 64, subtract line 95 from line 64.
      "form-540.line.100_tax_due": 2565,
      // Amount You Owe. Line 111. Amount You Owe. If you do not have an amount on line 99, add lin
      "form-540.line.111_amount_you_owe": 2565,
      // Line 114. Total amount due. See instructions. Enclose, but do not staple, any payment.
      "form-540.line.114_total_amount_due": 2565,
    },
  },
};

export function berowynExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
