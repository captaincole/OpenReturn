/*
 * lyrelle — LOCKED expected values, drafted from the engine's
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
  "form-8959": {
    engineFields: {
      // Line 1 — Medicare wages and tips from Form W-2, box 5
      "form-8959.0.line.1_medicare_wages_tips": 900000,
      // Line 4 — Add lines 1 through 3
      "form-8959.0.line.4_total_medicare_wages": 900000,
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 200000,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-8959.0.line.6_excess_medicare_wages": 700000,
      // Line 7 — Additional Medicare Tax on Medicare wages. Multiply line 6 by 0.9% (0.009)
      "form-8959.0.line.7_additional_medicare_tax_wages": 6300,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 6300,
      // Line 19 — Medicare tax withheld from Form W-2, box 6
      "form-8959.0.line.19_medicare_tax_withheld": 19350,
      // Line 20 — Enter the amount from line 1
      "form-8959.0.line.20_medicare_wages_from_line1": 900000,
      // Line 21 — Multiply line 20 by 1.45% (0.0145). Regular Medicare tax withholding on Medicare
      "form-8959.0.line.21_regular_medicare_tax_on_wages": 13050,
      // Line 22 — Subtract line 21 from line 19. If zero or less, enter -0-. Additional Medicare T
      "form-8959.0.line.22_additional_medicare_tax_withholding_wages": 6300,
      // Line 24 — Total Additional Medicare Tax withholding. Add lines 22 and 23
      "form-8959.0.line.24_total_additional_medicare_tax_withholding": 6300,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 6300,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 6300,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 900000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 900000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 900000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 900000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 900000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 884250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 284193,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 284193,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 284193,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 6300,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 290493,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 250000,
      // Line 25c — Federal income tax withheld from other forms (see instructions)
      "form-1040.line.25c": 6300,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 256300,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 256300,
      // Line 37 — Amount you owe
      "form-1040.line.37": 34193,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Part One. Income Adjustment Schedule. Section A. Income from federal Form 1040 or 1040-SR.
      "schedule-ca.0.line.1a_federal": 900000,
      // Line 1z. Add line 1a through line 1i. Column A. Federal Amounts.
      "schedule-ca.0.line.1z_federal": 900000,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 900000,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 900000,
      // Line 30. Enter the larger of the amount on line 29 or your standard deduction shown below:
      "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 5706,
    },
  },
  "schedule-p": {
    engineFields: {
      // Part 1 . Line 1 . If you itemized deductions, go to line 2 . If you did not itemize deduct
      "schedule-p.0.line.1_standard_deduction": 5706,
      // Line 14 . Total Adjustments and Preferences. Combine line 1 through line 13 .
      "schedule-p.0.line.14_total_adjustments_preferences": 5706,
      // Line 15 . Enter taxable income from Form 540, line 19 . See instructions.
      "schedule-p.0.line.15_taxable_income": 894294,
      // Line 19 . Combine line 14 through line 18 .
      "schedule-p.1.line.19_combine_lines_14_through_18": 900000,
      // Line 21 . Alternative Minimum Taxable Income. Subtract line 20 from line 19 (if married/Re
      "schedule-p.1.line.21_alternative_minimum_taxable_income": 900000,
      // Line 23 . Subtract line 22 from line 21 . If zero or less, enter 0 . See instructions.
      "schedule-p.1.line.23_amti_less_exemption": 900000,
      // Line 24 . Tentative Minimum Tax. Multiply line 23 by 7.0% (.07)
      "schedule-p.1.line.24_tentative_minimum_tax": 63000,
      // Line 25 . Regular tax before credits from Form 540, line 31 .
      "schedule-p.1.line.25_regular_tax_before_credits": 90835,
      // Part 3 . Line 1 . Enter the amount from Form 540, line 35 .
      "schedule-p.1.part3.1_tax_from_form_540_line_35": 90835,
      // Line 2 . Enter the tentative minimum tax from Part 2, line 24 .
      "schedule-p.1.part3.2_tentative_minimum_tax": 63000,
      // Section A. Line 3 . Subtract line 2 from line 1 . If zero or less enter 0 and see instruct
      "schedule-p.1.part3.3_excess_tax_offset_by_credits_col_c": 27835,
      // Line 6 . Column A. Credit amount.
      "schedule-p.2.part3.6_credit_amount_col_a": 12000,
      // Line 6 . Column B*. Credit used this year. *If the taxpayer is subject to the business cre
      "schedule-p.2.part3.6_credit_used_col_b": 12000,
      // Line 6 . Column C. Tax balance that may be offset by credits.
      "schedule-p.2.part3.6_tax_balance_col_c": 15835,
      // Line 7 . Column A. Credit amount.
      "schedule-p.2.part3.7_credit_amount_col_a": 25000,
      // Line 7 . Column B*. Credit used this year. *If the taxpayer is subject to the business cre
      "schedule-p.2.part3.7_credit_used_col_b": 15835,
      // Line 7 . Column D. Credit carryover.
      "schedule-p.2.part3.7_credit_carryover_col_d": 9165,
      // Section B. Line 11 . If Part 3, line 3 is zero, enter the amount from line 1 . If line 3 i
      "schedule-p.2.part3.11_tax_balance_col_c": 63000,
      // Line 16 . Column A. Credit amount.
      "schedule-p.3.part3.16_credit_amount_col_a": 20000,
      // Line 16 . Column B*. Credit used this year. *If the taxpayer is subject to the business cr
      "schedule-p.3.part3.16_credit_used_col_b": 20000,
      // Line 16 . Column C. Tax balance that may be offset by credits.
      "schedule-p.3.part3.16_tax_balance_col_c": 43000,
      // Line 17 . Column A. Credit amount.
      "schedule-p.3.part3.17_credit_amount_col_a": 15000,
      // Line 17 . Column B*. Credit used this year. *If the taxpayer is subject to the business cr
      "schedule-p.3.part3.17_credit_used_col_b": 15000,
      // Line 17 . Column C. Tax balance that may be offset by credits.
      "schedule-p.3.part3.17_tax_balance_col_c": 28000,
      // Line 18 . Column A. Credit amount.
      "schedule-p.3.part3.18_credit_amount_col_a": 55000,
      // Line 18 . Column B*. Credit used this year. *If the taxpayer is subject to the business cr
      "schedule-p.3.part3.18_credit_used_col_b": 28000,
      // Line 18 . Column D. Credit carryover. MANUAL EDIT: 55,000 − 28,000 − the 27,000 elected refundable (decision A76).
      "schedule-p.3.part3.18_credit_carryover_col_d": 0,
    },
  },
  "form-3541": {
    engineFields: {
      // Line 1. Current year generated credit. See instructions.
      "form-3541.0.line.1_current_year_generated_credit": 60000,
      // Line 9. Credit applied against sales and use taxes. See instructions
      "form-3541.0.line.9_credit_applied_sales_use_tax": 5000,
      // Line 10. Total credit sold, assigned, passed through, or applied against sales and use tax
      "form-3541.0.line.10_total_credit_sold_assigned_applied": 5000,
      // Line 11. Total available credit. Subtract line 10 from any entry made on line 1, line 2, l
      "form-3541.0.line.11_total_available_credit": 55000,
      // Part II, Line 12a. Credit claimed. Enter the amount of the nonrefundable credit claimed on
      "form-3541.1.line.12a_credit_claimed": 28000,
      // Line 12d. Total available program 4.0 credit elected as refundable. Enter the amount from
      "form-3541.1.line.12d_program_4_credit_elected_refundable": 27000,
      // Part IV, Line 20. 2025 Program 4.0 credit amount. Enter the amount from Part I, line 1, 2,
      "form-3541.1.line.20_program_4_credit_amount": 60000,
      // Line 21. Enter your California income tax liability for the purpose of the program 4.0 ref
      "form-3541.1.line.21_ca_income_tax_liability": 33000,
      // Line 22. Available 2025 program 4.0 credit that can be elected as refundable. Subtract lin
      "form-3541.1.line.22_available_credit_elected_refundable": 27000,
      // Line 23. Multiply line 22 by 90%. This is your total refundable amount.
      "form-3541.1.line.23_total_refundable_amount": 24300,
      // Line 24. Multiply line 23 by 20%. This is your annual refundable amount available for each
      "form-3541.1.line.24_annual_refundable_amount": 4860,
      // Line 25. Refundable program 4.0 credits claimed in 2025. Enter the credit amount on Form 5
      "form-3541.1.line.25_refundable_credits_claimed": 4860,
      // MANUAL EDIT: verified zeros. Line 12b: "If you are not a corporation, enter 0".
      "form-3541.1.line.12b_total_credit_assigned": 0,
      // Line 13: 55,000 − (28,000 + 0 + 27,000).
      "form-3541.1.line.13_credit_carryover_future_years": 0,
      // Line 26: 4,860 − 4,860.
      "form-3541.1.line.26_refundable_credit_carryover": 0,
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
      "form-540.line.12_state_wages": 900000,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040 or 1040-SR, li
      "form-540.line.13_federal_agi": 900000,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 900000,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 900000,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 894294,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 90835,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 90835,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 90835,
      // Line 45. To claim more than two credits, see instructions. Attach Schedule P (540).
      "form-540.line.45_schedule_p_credits": 90835,
      // Line 47. Add line 40 through line 46. These are your total credits.
      "form-540.line.47_total_credits": 90835,
      // MANUAL EDIT: verified zero. Line 48: 90,835 − 90,835.
      "form-540.line.48_tax_after_credits": 0,
      // Payments. Line 71. California income tax withheld. See instructions.
      "form-540.line.71_ca_income_tax_withheld": 85000,
      // Line 74. Refundable Program 4.0 California Motion Picture and Television Production Credit
      "form-540.line.74_motion_picture_production_credit": 4860,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 89860,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 89860,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 89860,
      // Line 97. Overpaid tax. If line 95 is more than line 64, subtract line 64 from line 95.
      "form-540.line.97_overpaid_tax": 89860,
      // Line 99. Overpaid tax available this year. Subtract line 98 from line 97.
      "form-540.line.99_overpaid_tax_available": 89860,
      // Refund and Direct Deposit. Line 115. Refund or no amount due. Subtract the sum of line 110
      "form-540.line.115_refund_or_no_amount_due": 89860,
    },
  },
};

export function lyrelleExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
