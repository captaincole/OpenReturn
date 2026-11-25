/*
 * ingtar — LOCKED expected values, drafted from the engine's
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
  "form-8824": {
    engineFields: {
      // Line 12 — Fair market value (FMV) of other property given up
      "form-8824.1.line.12_fmv_other_property_given_up": 9000,
      // Line 13 — Adjusted basis of other property given up
      "form-8824.1.line.13_adjusted_basis_other_property_given_up": 4000,
      // Line 14 — Gain or (loss) recognized on other property given up. Subtract line 13 from line
      "form-8824.1.line.14_gain_loss_other_property_given_up": 5000,
      // Line 15 — Cash received, FMV of other property received, plus net liabilities assumed by o
      "form-8824.1.line.15_cash_other_property_received": 20000,
      // Line 16 — FMV of like-kind property you received
      "form-8824.1.line.16_fmv_like_kind_property_received": 260000,
      // Line 17 — Add lines 15 and 16
      "form-8824.1.line.17_add_lines_15_and_16": 280000,
      // Line 18 — Adjusted basis of like-kind property you gave up, net amounts paid to other part
      "form-8824.1.line.18_adjusted_basis_like_kind_given_up": 140000,
      // Line 19 — Realized gain or (loss). Subtract line 18 from line 17
      "form-8824.1.line.19_realized_gain_loss": 140000,
      // Line 20 — Enter the smaller of line 15 or line 19, but not less than zero
      "form-8824.1.line.20_smaller_of_line_15_or_19": 20000,
      // Line 22 — Subtract line 21 from line 20. If zero or less, enter -0-
      "form-8824.1.line.22_subtract_line_21_from_20": 20000,
      // Line 23 — Recognized gain. Add lines 21 and 22
      "form-8824.1.line.23_recognized_gain": 20000,
      // Line 24 — Deferred gain or (loss). Subtract line 23 from line 19
      "form-8824.1.line.24_deferred_gain_loss": 120000,
      // Line 25 — Basis of like-kind property received. Subtract line 15 from the sum of lines 18
      "form-8824.1.line.25_basis_like_kind_property_received": 140000,
    },
  },
  "schedule-d": {
    engineFields: {
      // Line 11 — Gain from Form 4797, Part I; long-term gain from Forms 2439 and 6252; and long-t
      "schedule-d.0.line.11_long_term_gain_other_forms": 25000,
      // Line 15 — Net long-term capital gain or (loss). Combine lines 8a through 14 in column (h)
      "schedule-d.0.line.15_net_long_term_gain_loss": 25000,
      // Line 16 — Combine lines 7 and 15 and enter the result
      "schedule-d.1.line.16_combined_gain_loss": 25000,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 176000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 176000,
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": 25000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 201000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 201000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 201000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 31500,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 31500,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 169500,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 25368,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 25368,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 25368,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 25368,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 20900,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 20900,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 20900,
      // Line 37 — Amount you owe
      "form-1040.line.37": 4468,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Part One. Income Adjustment Schedule. Section A. Income from federal Form 1040 or 1040-SR.
      "schedule-ca.0.line.1a_federal": 176000,
      // Line 1z. Add line 1a through line 1i. Column A. Federal Amounts.
      "schedule-ca.0.line.1z_federal": 176000,
      // Line 7a. Capital gain or (loss). See instructions. Column A. Federal Amounts.
      "schedule-ca.0.line.7a_federal": 25000,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 201000,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 201000,
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
      "form-540.line.12_state_wages": 176000,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040 or 1040-SR, li
      "form-540.line.13_federal_agi": 201000,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 201000,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 201000,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 11412,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 189588,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 10509,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 306,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 10203,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 10203,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 10203,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 10203,
      // Payments. Line 71. California income tax withheld. See instructions.
      "form-540.line.71_ca_income_tax_withheld": 9600,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 9600,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 9600,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 9600,
      // Line 100. Tax due. If line 95 is less than line 64, subtract line 95 from line 64.
      "form-540.line.100_tax_due": 603,
      // Amount You Owe. Line 111. Amount You Owe. If you do not have an amount on line 99, add lin
      "form-540.line.111_amount_you_owe": 603,
      // Line 114. Total amount due. See instructions. Enclose, but do not staple, any payment.
      "form-540.line.114_total_amount_due": 603,
    },
  },
  "form-3840": {
    engineFields: {
      // Part II, line 7. Fair market value (F M V) of other property given up.
      "form-3840.0.line.7_fmv_other_property_given_up": 9000,
      // Line 8. Adjusted basis of other property given up.
      "form-3840.0.line.8_adjusted_basis_other_property": 4000,
      // Line 9. Gain or (loss) recognized on other property given up. Subtract line 8 from line 7.
      "form-3840.0.line.9_gain_loss_other_property": 5000,
      // Line 10. Cash received, F M V of other property received, plus net liabilities assumed by
      "form-3840.0.line.10_cash_and_other_property_received": 20000,
      // Line 11. F M V of like-kind property received.
      "form-3840.0.line.11_fmv_like_kind_property_received": 260000,
      // Line 12. Add line 10 and line 11.
      "form-3840.0.line.12_total_amount_received": 280000,
      // Line 13. Adjusted basis of like-kind property given up, net amounts paid to other party, p
      "form-3840.0.line.13_adjusted_basis_like_kind_given_up": 140000,
      // Line 14. Realized gain or (loss). Subtract line 13 from line 12.
      "form-3840.0.line.14_realized_gain_loss": 140000,
      // Line 15. Enter smaller of line 10 or line 14, but not less than zero.
      "form-3840.0.line.15_smaller_of_line_10_or_14": 20000,
      // Line 17. Subtract line 16 from line 15. If more than 0, enter here. If zero or less, enter
      "form-3840.0.line.17_line_15_minus_line_16": 20000,
      // Line 18. Recognized gain. Add line 16 and line 17.
      "form-3840.0.line.18_recognized_gain": 20000,
      // Line 19. Deferred gain or (loss). Subtract line 18 from line 14.
      "form-3840.0.line.19_deferred_gain_loss": 120000,
      // Line 20. Basis of like-kind property received. Subtract line 10 from the sum of line 13 an
      "form-3840.0.line.20_basis_like_kind_property_received": 140000,
      // Line 3. Consideration/Sales price, A.
      "form-3840.1.line.3_consideration_sales_price_col_a": 286000,
      // Line 4. Selling expenses paid/incurred, A.
      "form-3840.1.line.4_selling_expenses_col_a": 6000,
      // Line 5. Amount realized. Subtract line 4 from line 3, A.
      "form-3840.1.line.5_amount_realized_col_a": 280000,
      // Line 6. California adjusted basis, A.
      "form-3840.1.line.6_california_adjusted_basis_col_a": 150000,
      // Line 7. Realized gain or (loss). Subtract line 6 from line 5, A.
      "form-3840.1.line.7_realized_gain_loss_col_a": 130000,
      // Line 8. California source deferred gain. If all property given up was real property locate
      "form-3840.1.line.8_california_sourced_deferred_gain": 110000,
      // Part III, line 10. Allocation of California source deferred gain to properties received. I
      "form-3840.1.line.10_allocation_deferred_gain_col_d": 110000,
    },
  },
};

export function ingtarExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
