/*
 * tarna — LOCKED expected values, drafted from the engine's
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
      "schedule-c.0.line.1": 160000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 160000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 160000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 160000,
      // Line 20b — Rent or lease: Other business property
      "schedule-c.0.line.20b": 30000,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 28000,
      // Line 23 — Taxes and licenses
      "schedule-c.0.line.23": 2000,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 4000,
      // Line 25 — Utilities
      "schedule-c.0.line.25": 6000,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 70000,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 90000,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 90000,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 90000,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 90000,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 83115,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 83115,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 83115,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 10306,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 2410,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 12716,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 6358,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 90000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 90000,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 6358,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 6358,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 12716,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 12716,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": 83642,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": 83642,
      // Line 4 — Total qualified business income. Combine lines 2 and 3. If zero or less, enter -0
      "form-8995.0.line.4": 83642,
      // Line 5 — Qualified business income component. Multiply line 4 by 20% (0.20)
      "form-8995.0.line.5": 16728,
      // Line 10 — Qualified business income deduction before the income limitation. Add lines 5 an
      "form-8995.0.line.10": 16728,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 67892,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 67892,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 13578,
      // Line 15 — Qualified business income deduction. Enter the smaller of line 10 or line 14
      "form-8995.0.line.15": 13578,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 90000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 90000,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 6358,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 83642,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 83642,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 13578,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 29328,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 54314,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 6866,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 6866,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 6866,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 12716,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 19582,
      // Line 26 — 2025 estimated tax payments and amount applied from 2024 return
      "form-1040.line.26": 16000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 16000,
      // Line 37 — Amount you owe
      "form-1040.line.37": 3582,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Line 3 . Business income or (loss). See instructions. Column A. Federal Amounts.
      "schedule-ca.0.line.b3_federal": 90000,
      // Line 9 b3. Net operating loss deduction from form FTB 3805Z, 3807, or 3809. Column B. Subt
      "schedule-ca.2.line.b9b3_subtractions": 54000,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 90000,
      // Line 10. Column B. Subtractions.
      "schedule-ca.2.line.b10_subtractions": 54000,
      // Line 15. Deductible part of self-employment tax. See instructions. Column A. Federal Amoun
      "schedule-ca.2.line.c15_federal": 6358,
      // Line 26. Add line 11 through line 23 and line 25 in columns A, B, and C. See instructions.
      "schedule-ca.3.line.c26_federal": 6358,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 83642,
      // Line 27. Column B. Subtractions.
      "schedule-ca.3.line.c27_subtractions": 54000,
      // Line 30. Enter the larger of the amount on line 29 or your standard deduction shown below:
      "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 5706,
    },
  },
  "form-3807": {
    engineFields: {
      // Line F: a verified zero. She works alone.
      "form-3807.0.header.f_total_employees_in_lambra": 0,
      // Line G. Gross annual receipts of the business.
      "form-3807.0.header.g_gross_annual_receipts": 160000,
      // Line H. Total asset value of the business.
      "form-3807.0.header.h_total_asset_value": 260000,
      // Part III, Line 3a. Enter the total L A M B R A N O L carryover from prior years from Works
      "form-3807.0.line.3a_nol_carryover_prior_years": 70000,
      // Line 3b. Enter the total L A M B R A N O L deduction used in the current year from Workshe
      "form-3807.0.line.3b_nol_deduction_current_year": 54000,
      // Line 3c. Enter the L A M B R A N O L carryover to future years from Worksheet II, line 9,
      "form-3807.0.line.3c_nol_carryover_future_years": 16000,
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
      "form-540.line.13_federal_agi": 83642,
      // Line 14. California adjustments – subtractions. Enter the amount from Schedule CA (540), P
      "form-540.line.14_ca_adjustments_subtractions": 54000,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 29642,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 29642,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 23936,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 367,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 153,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 214,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 214,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 214,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 214,
      // Line 72. 2025 California estimated tax and other payments. See instructions.
      "form-540.line.72_ca_estimated_tax_payments": 600,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 600,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 600,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 600,
      // Line 97. Overpaid tax. If line 95 is more than line 64, subtract line 64 from line 95.
      "form-540.line.97_overpaid_tax": 386,
      // Line 99. Overpaid tax available this year. Subtract line 98 from line 97.
      "form-540.line.99_overpaid_tax_available": 386,
      // Refund and Direct Deposit. Line 115. Refund or no amount due. Subtract the sum of line 110
      "form-540.line.115_refund_or_no_amount_due": 386,
    },
  },
};

export function tarnaExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
