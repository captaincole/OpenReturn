/*
 * leonin — LOCKED expected values, drafted from the engine's
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
  "schedule-e": {
    engineFields: {
      // Line 2 — Fair Rental Days (Property A)
      "schedule-e.0.line.2_fair_rental_days_a": 365,
      // Line 3 — Rents received (Property A)
      "schedule-e.0.line.3_rents_received_a": 26400,
      // Line 9 — Insurance (Property A)
      "schedule-e.0.line.9_insurance_a": 1400,
      // Line 12 — Mortgage interest paid to banks, etc. (Property A)
      "schedule-e.0.line.12_mortgage_interest_a": 6200,
      // Line 14 — Repairs (Property A)
      "schedule-e.0.line.14_repairs_a": 1200,
      // Line 16 — Taxes (Property A)
      "schedule-e.0.line.16_taxes_a": 3600,
      // Line 20 — Total expenses. Add lines 5 through 19 (Property A)
      "schedule-e.0.line.20_total_expenses_a": 12400,
      // Line 21 — Subtract line 20 from line 3 (rents) and/or 4 (royalties) (Property A)
      "schedule-e.0.line.21_income_or_loss_a": 14000,
      // Line 23a — Total of all amounts reported on line 3 for all rental properties
      "schedule-e.0.line.23a_total_rents": 26400,
      // Line 23c — Total of all amounts reported on line 12 for all properties
      "schedule-e.0.line.23c_total_mortgage_interest": 6200,
      // Line 23e — Total of all amounts reported on line 20 for all properties
      "schedule-e.0.line.23e_total_expenses": 12400,
      // Line 24 — Income. Add positive amounts shown on line 21. Do not include any losses
      "schedule-e.0.line.24_income": 14000,
      // Line 26 — Total rental real estate and royalty income or (loss). Combine lines 24 and 25
      "schedule-e.0.line.26_total_income_or_loss": 14000,
      // Line 41 — Total income or (loss). Combine lines 26, 32, 37, 39, and 40
      "schedule-e.1.line.41_total_income_or_loss": 14000,
    },
  },
  "form-8582": {
    engineFields: {
      // Line 1a — Rental real estate activities with active participation: activities with net inc
      "form-8582.0.line.1a_rental_net_income": 14000,
      // Line 1d — Combine lines 1a, 1b, and 1c
      "form-8582.0.line.1d_rental_combined": 14000,
      // Line 3 — Combine lines 1d and 2d and subtract any prior year unallowed CRD
      "form-8582.0.line.3_combined": 14000,
      // Part IV Row 1 — (a) Current year net income (line 1a)
      "form-8582.0.part4.row_1_col_a_net_income": 14000,
      // Part IV Row 1 — (d) Overall gain
      "form-8582.0.part4.row_1_col_d_gain": 14000,
      // Part IV Total — (a) Current year net income (line 1a)
      "form-8582.0.part4.total_col_a_net_income": 14000,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 5 — Rental real estate, royalties, partnerships, S corporations, trusts, etc. Attach
      "schedule-1.0.line.5": 14000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 14000,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 82000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 82000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 14000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 96000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 96000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 96000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 80250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 12575,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 12575,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 12575,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 12575,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 8900,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 8900,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 8900,
      // Line 37 — Amount you owe
      "form-1040.line.37": 3675,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Part One. Income Adjustment Schedule. Section A. Income from federal Form 1040 or 1040-SR.
      "schedule-ca.0.line.1a_federal": 82000,
      // Line 1z. Add line 1a through line 1i. Column A. Federal Amounts.
      "schedule-ca.0.line.1z_federal": 82000,
      // Line 5. Rental real estate, royalties, partnerships, S corporations, trusts, etcetera. Col
      "schedule-ca.0.line.b5_federal": 14000,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 96000,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 96000,
      // Line 30. Enter the larger of the amount on line 29 or your standard deduction shown below:
      "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 5706,
    },
  },
  "form-3801-cr": {
    engineFields: {
      // Line 2a. Credits from federal Worksheet 2, column (a).
      "form-3801-cr.0.line.2a_housing_pre_1990_credits": 600,
      // Line 2b. Prior year unallowed credits from federal Worksheet 2, column (b).
      "form-3801-cr.0.line.2b_housing_pre_1990_prior_unallowed": 1800,
      // Line 2c. Add line 2a and line 2b.
      "form-3801-cr.0.line.2c_housing_pre_1990_total": 2400,
      // Line 4a. Credits from federal Worksheet 4, column (a).
      "form-3801-cr.0.line.4a_other_passive_credits": 1200,
      // Line 4c. Add line 4a and line 4b.
      "form-3801-cr.0.line.4c_other_passive_total": 1200,
      // Line 5. Add line 1c, line 2c, line 3c, and line 4c.
      "form-3801-cr.0.line.5_total_passive_credits": 3600,
      // Line 6. Enter the tax attributable to net passive income. See instructions.
      "form-3801-cr.0.line.6_tax_on_net_passive_income": 1302,
      // Line 7. Subtract line 6 from line 5. If line 6 is more than or equal to line 5, enter 0. S
      "form-3801-cr.0.line.7_credits_over_passive_tax": 2298,
      // Part III, Line 17. Passive Activity Credits Allowed. Add line 6 and line 16. See instructi
      "form-3801-cr.1.line.17_passive_activity_credits_allowed": 1302,
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
      "form-540.line.12_state_wages": 82000,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040 or 1040-SR, li
      "form-540.line.13_federal_agi": 96000,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 96000,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 96000,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 90294,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 4837,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 153,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 4684,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 4684,
      // Line 43. Enter credit amount
      "form-540.line.43_credit_amount": 434,
      // Line 44. Enter credit amount
      "form-540.line.44_credit_amount": 868,
      // Line 47. Add line 40 through line 46. These are your total credits.
      "form-540.line.47_total_credits": 1302,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 3382,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 3382,
      // Payments. Line 71. California income tax withheld. See instructions.
      "form-540.line.71_ca_income_tax_withheld": 3600,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 3600,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 3600,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 3600,
      // Line 97. Overpaid tax. If line 95 is more than line 64, subtract line 64 from line 95.
      "form-540.line.97_overpaid_tax": 218,
      // Line 99. Overpaid tax available this year. Subtract line 98 from line 97.
      "form-540.line.99_overpaid_tax_available": 218,
      // Refund and Direct Deposit. Line 115. Refund or no amount due. Subtract the sum of line 110
      "form-540.line.115_refund_or_no_amount_due": 218,
    },
  },
};

export function leoninExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
