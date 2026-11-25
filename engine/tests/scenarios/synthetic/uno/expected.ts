/*
 * uno — LOCKED expected values, drafted from the engine's
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
  "form-6252": {
    engineFields: {
      // Line 5 — Selling price including mortgages and other debts
      "form-6252.0.line.5_selling_price": 400000,
      // Line 7 — Subtract line 6 from line 5
      "form-6252.0.line.7_price_less_liabilities": 400000,
      // Line 8 — Cost or other basis of property sold
      "form-6252.0.line.8_cost_or_other_basis": 120000,
      // Line 10 — Adjusted basis. Subtract line 9 from line 8
      "form-6252.0.line.10_adjusted_basis": 120000,
      // Line 11 — Commissions and other expenses of sale
      "form-6252.0.line.11_commissions_expenses_of_sale": 10000,
      // Line 13 — Add lines 10, 11, and 12
      "form-6252.0.line.13_basis_expenses_recapture_total": 130000,
      // Line 14 — Subtract line 13 from line 5
      "form-6252.0.line.14_price_less_line_13": 270000,
      // Line 16 — Gross profit. Subtract line 15 from line 14
      "form-6252.0.line.16_gross_profit": 270000,
      // Line 18 — Contract price. Add line 7 and line 17
      "form-6252.0.line.18_contract_price": 400000,
      // Line 21 — Payments received during year
      "form-6252.0.line.21_payments_received_during_year": 40000,
      // Line 22 — Add lines 20 and 21
      "form-6252.0.line.22_total_payments_this_year": 40000,
      // Line 23 — Payments received in prior years
      "form-6252.0.line.23_payments_received_prior_years": 120000,
      // Line 24 — Installment sale income. Multiply line 22 by line 19
      "form-6252.0.line.24_installment_sale_income": 27000,
      // Line 26 — Subtract line 25 from line 24
      "form-6252.0.line.26_income_less_recapture": 27000,
    },
  },
  "schedule-d": {
    engineFields: {
      // Line 11 — Gain from Form 4797, Part I; long-term gain from Forms 2439 and 6252; and long-t
      "schedule-d.0.line.11_long_term_gain_other_forms": 27000,
      // Line 15 — Net long-term capital gain or (loss). Combine lines 8a through 14 in column (h)
      "schedule-d.0.line.15_net_long_term_gain_loss": 27000,
      // Line 16 — Combine lines 7 and 15 and enter the result
      "schedule-d.1.line.16_combined_gain_loss": 27000,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 70000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 70000,
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": 27000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 97000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 97000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 97000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 81250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 10905,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 10905,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 10905,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 10905,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 7200,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 7200,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 7200,
      // Line 37 — Amount you owe
      "form-1040.line.37": 3705,
    },
  },
  "form-3805e": {
    engineFields: {
      // Line 21. Payments received during the year (do not include stated or unstated interest).
      "form-3805e.0.line.21_payments_received_during_year": 40000,
      // Line 22. Add line 20 and line 21.
      "form-3805e.0.line.22_payments_total": 40000,
      // Line 23. Payments received in prior years (do not include stated or unstated interest).
      "form-3805e.1.line.23_payments_received_prior_years": 120000,
      // Line 24. Installment sale income. Multiply line 22 by line 19. This amount cannot be zero
      "form-3805e.1.line.24_installment_sale_income": 24000,
      // Line 26. Subtract line 25 from line 24. Enter the result here and on Schedule D (540, 540N
      "form-3805e.1.line.26_installment_income_less_recapture": 24000,
    },
  },
  "schedule-d-ca": {
    engineFields: {
      // Line 1 a . (e) Gain. If (b) is more than (c), subtract (c) from (b).
      "schedule-d-ca.0.line.1a.gain": 24000,
      // Line 4 . Total 2025 gains from all sources. Add column (e) amounts of line 1, line 2, and
      "schedule-d-ca.3.line.4": 24000,
      // Line 8 . Net gain or (loss). Combine line 4 and line 7. If a loss, go to line 9. If a gain
      "schedule-d-ca.3.line.8": 24000,
      // Line 10 . Enter the gain or (loss) from federal Form 1040 or 1040-SR, line 7a.
      "schedule-d-ca.3.line.10": 27000,
      // Line 11 . Enter the California gain from line 8 or (loss) from line 9.
      "schedule-d-ca.3.line.11": 24000,
      // Line 12 a . If line 10 is more than line 11, enter the difference here and on Schedule CA
      "schedule-d-ca.3.line.12a": 3000,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Part One. Income Adjustment Schedule. Section A. Income from federal Form 1040 or 1040-SR.
      "schedule-ca.0.line.1a_federal": 70000,
      // Line 1z. Add line 1a through line 1i. Column A. Federal Amounts.
      "schedule-ca.0.line.1z_federal": 70000,
      // Line 7a. Capital gain or (loss). See instructions. Column A. Federal Amounts.
      "schedule-ca.0.line.7a_federal": 27000,
      // Line 7a. Column B. Subtractions.
      "schedule-ca.0.line.7a_subtractions": 3000,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 97000,
      // Line 10. Column B. Subtractions.
      "schedule-ca.2.line.b10_subtractions": 3000,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 97000,
      // Line 27. Column B. Subtractions.
      "schedule-ca.3.line.c27_subtractions": 3000,
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
      "form-540.line.12_state_wages": 70000,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040 or 1040-SR, li
      "form-540.line.13_federal_agi": 97000,
      // Line 14. California adjustments – subtractions. Enter the amount from Schedule CA (540), P
      "form-540.line.14_ca_adjustments_subtractions": 3000,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 94000,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 94000,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 88294,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 4651,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 153,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 4498,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 4498,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 4498,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 4498,
      // Payments. Line 71. California income tax withheld. See instructions.
      "form-540.line.71_ca_income_tax_withheld": 2600,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 2600,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 2600,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 2600,
      // Line 100. Tax due. If line 95 is less than line 64, subtract line 95 from line 64.
      "form-540.line.100_tax_due": 1898,
      // Amount You Owe. Line 111. Amount You Owe. If you do not have an amount on line 99, add lin
      "form-540.line.111_amount_you_owe": 1898,
      // Line 114. Total amount due. See instructions. Enclose, but do not staple, any payment.
      "form-540.line.114_total_amount_due": 1898,
    },
  },
};

export function unoExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
