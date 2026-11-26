/*
 * katerine — LOCKED expected values, drafted from the engine's
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
      "form-8959.0.line.1_medicare_wages_tips": 300000,
      // Line 4 — Add lines 1 through 3
      "form-8959.0.line.4_total_medicare_wages": 300000,
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 200000,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-8959.0.line.6_excess_medicare_wages": 100000,
      // Line 7 — Additional Medicare Tax on Medicare wages. Multiply line 6 by 0.9% (0.009)
      "form-8959.0.line.7_additional_medicare_tax_wages": 900,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 900,
      // Line 19 — Medicare tax withheld from Form W-2, box 6
      "form-8959.0.line.19_medicare_tax_withheld": 5250,
      // Line 20 — Enter the amount from line 1
      "form-8959.0.line.20_medicare_wages_from_line1": 300000,
      // Line 21 — Multiply line 20 by 1.45% (0.0145). Regular Medicare tax withholding on Medicare
      "form-8959.0.line.21_regular_medicare_tax_on_wages": 4350,
      // Line 22 — Subtract line 21 from line 19. If zero or less, enter -0-. Additional Medicare T
      "form-8959.0.line.22_additional_medicare_tax_withholding_wages": 900,
      // Line 24 — Total Additional Medicare Tax withholding. Add lines 22 and 23
      "form-8959.0.line.24_total_additional_medicare_tax_withholding": 900,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 900,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 900,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 300000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 300000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 300000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 300000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 300000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 284250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 69035,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 69035,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 69035,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 900,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 69935,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 61000,
      // Line 25c — Federal income tax withheld from other forms (see instructions)
      "form-1040.line.25c": 900,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 61900,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 61900,
      // Line 37 — Amount you owe
      "form-1040.line.37": 8035,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Part One. Income Adjustment Schedule. Section A. Income from federal Form 1040 or 1040-SR.
      "schedule-ca.0.line.1a_federal": 300000,
      // Line 1z. Add line 1a through line 1i. Column A. Federal Amounts.
      "schedule-ca.0.line.1z_federal": 300000,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 300000,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 300000,
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
      "schedule-p.0.line.15_taxable_income": 294294,
      // Line 19 . Combine line 14 through line 18 .
      "schedule-p.1.line.19_combine_lines_14_through_18": 300000,
      // Line 21 . Alternative Minimum Taxable Income. Subtract line 20 from line 19 (if married/Re
      "schedule-p.1.line.21_alternative_minimum_taxable_income": 300000,
      // Part 2 . Line 22 . Exemption Amount. (If this schedule is for a certain child under age 24
      "schedule-p.1.line.22_exemption_amount": 92749,
      // Line 23 . Subtract line 22 from line 21 . If zero or less, enter 0 . See instructions.
      "schedule-p.1.line.23_amti_less_exemption": 207251,
      // Line 24 . Tentative Minimum Tax. Multiply line 23 by 7.0% (.07)
      "schedule-p.1.line.24_tentative_minimum_tax": 14508,
      // Line 25 . Regular tax before credits from Form 540, line 31 .
      "schedule-p.1.line.25_regular_tax_before_credits": 23808,
      // Part 3 . Line 1 . Enter the amount from Form 540, line 35 .
      "schedule-p.1.part3.1_tax_from_form_540_line_35": 23775,
      // Line 2 . Enter the tentative minimum tax from Part 2, line 24 .
      "schedule-p.1.part3.2_tentative_minimum_tax": 14508,
      // Section A. Line 3 . Subtract line 2 from line 1 . If zero or less enter 0 and see instruct
      "schedule-p.1.part3.3_excess_tax_offset_by_credits_col_c": 9267,
      // Section A1. Line 4 . Code: 162 . Prison inmate labor credit (FTB 3507). Column A. Credit a
      "schedule-p.1.part3.4_prison_inmate_labor_credit_col_a": 12000,
      // Line 4 . Column B*. Credit used this year. *If the taxpayer is subject to the business cre
      "schedule-p.1.part3.4_prison_inmate_labor_credit_col_b": 9267,
      // Verified zero: column (b) used all of line 3.
      "schedule-p.1.part3.4_prison_inmate_labor_credit_col_c": 0,
      // Section B. Line 11 . If Part 3, line 3 is zero, enter the amount from line 1 . If line 3 i
      "schedule-p.2.part3.11_tax_balance_col_c": 14508,
      // Section B3 . Line 20 . Code: 187, Other state tax credit. Column A. Credit amount.
      "schedule-p.3.part3.20_other_state_tax_credit_amount_col_a": 1800,
      // Line 20. Column B*. Credit used this year. *If the taxpayer is subject to the business cre
      "schedule-p.3.part3.20_other_state_tax_credit_used_col_b": 1800,
      // Line 20 . Column C. Tax balance that may be offset by credits.
      "schedule-p.3.part3.20_other_state_tax_tax_balance_col_c": 12708,
      // Section B4 . Line 21 . Code: 242 Pass-through entity elective tax credit. Column A. Credit
      "schedule-p.3.part3.21_pte_elective_tax_credit_amount_col_a": 4000,
      // Line 21 . Column B*. Credit used this year. *If the taxpayer is subject to the business cr
      "schedule-p.3.part3.21_pte_elective_tax_credit_used_col_b": 4000,
      // Line 21 . Column C. Tax balance that may be offset by credits.
      "schedule-p.3.part3.21_pte_elective_tax_tax_balance_col_c": 8708,
    },
  },
  "form-3507": {
    engineFields: {
      // Line 3. Pass-through Prison Inmate Labor Credit(s) from Schedule K-1 (100S, 541, 565, or 5
      "form-3507.0.line.3_pass_through_credit_k1": 12000,
      // Line 5. Total available Prison Inmate Labor Credit. Add line 2, line 3, and line 4.
      "form-3507.0.line.5_total_available_credit": 12000,
      // Line 6a. Credit claimed. Enter the amount of the credit claimed on the current year tax re
      "form-3507.0.line.6a_credit_claimed": 9267,
      /*
       * Verified zeros: she pays no wages (1, 2), no 2024 credit (4), not a corporation (6b), no election (6c),
       * and no carryover (7): the 2,733 the tax could not use is lost, and the $5,000,000 limit disallowed nothing (decision A68).
       */
      "form-3507.0.line.7_disallowed_credit_carryover": 0,
      "form-3507.0.line.1_total_qualifying_wages": 0,
      "form-3507.0.line.2_current_year_credit": 0,
      "form-3507.0.line.4_credit_carryover_prior_year": 0,
      "form-3507.0.line.6b_total_credit_assigned": 0,
      "form-3507.0.line.6c_credit_elected_refundable": 0,
    },
  },
  "schedule-s": {
    engineFields: {
      // Row 1 . Column (B). Double-taxed income taxable by California.
      "schedule-s.0.part1.row1_taxable_by_california_col_b": 40000,
      // Row 1 . Column (C). Double-taxed income taxable by other state.
      "schedule-s.0.part1.row1_taxable_by_other_state_col_c": 40000,
      // Line 1 . Total double-taxed income. Column (B). Double-taxed income taxable by California.
      "schedule-s.0.line.1_total_double_taxed_income_col_b": 40000,
      // Line 1 . Total double-taxed income. Column (C). Double-taxed income taxable by other state
      "schedule-s.0.line.1_total_double_taxed_income_col_c": 40000,
      // Part 2 . Line 2 . California tax liability. See instructions.
      "schedule-s.0.line.2_california_tax_liability": 14508,
      // Line 3 . Double-taxed income taxable by California. Enter the amount from Part 1, line 1,
      "schedule-s.0.line.3_double_taxed_income_california": 40000,
      // Line 4 . California adjusted gross income. See instructions.
      "schedule-s.0.line.4_california_adjusted_gross_income": 300000,
      // Line 6 . Multiply line 2 by line 5 .
      "schedule-s.0.line.6_california_tax_on_double_taxed_income": 1934,
      // Line 7 . Income tax liability paid to other state. Enter amount.
      "schedule-s.0.line.7_tax_paid_to_other_state": 1800,
      // Line 8 . Double-taxed income taxable by other state. Enter the amount from Part 1, line 1,
      "schedule-s.0.line.8_double_taxed_income_other_state": 40000,
      // Line 9 . Adjusted gross income taxable by other state. See instructions.
      "schedule-s.0.line.9_other_state_adjusted_gross_income": 40000,
      // Line 11 . Multiply line 7 by line 10 .
      "schedule-s.0.line.11_other_state_tax_on_double_taxed_income": 1800,
      // Line 12 . Other state tax credit. Enter the smaller of line 6 or line 11 . Use Credit Code
      "schedule-s.0.line.12_other_state_tax_credit": 1800,
    },
  },
  "form-3804-cr": {
    engineFields: {
      // Line 1a. (c) P T E elective tax credit(s).
      "form-3804-cr.0.part1.1a_electing_pte_col_c": 4000,
      // Line 2. Total P T E elective tax credit amount. Add the amounts in column (c) and enter to
      "form-3804-cr.0.part1.2_total_pte_elective_tax_credit": 4000,
      // Part II, Line 1. Total credit from electing qualified P T E s. See instructions.
      "form-3804-cr.0.part2.1_total_credit_from_ptes": 4000,
      // Line 3. Total available credit. Add line 1 and line 2.
      "form-3804-cr.0.part2.3_total_available_credit": 4000,
      // Line 4. Enter the amount of the credit claimed on the current year tax return. See instruc
      "form-3804-cr.0.part2.4_credit_claimed_current_year": 4000,
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
      "form-540.line.12_state_wages": 300000,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040 or 1040-SR, li
      "form-540.line.13_federal_agi": 300000,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 300000,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 300000,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 294294,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 23808,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 33,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 23775,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 23775,
      // Line 45. To claim more than two credits, see instructions. Attach Schedule P (540).
      "form-540.line.45_schedule_p_credits": 15067,
      // Line 47. Add line 40 through line 46. These are your total credits.
      "form-540.line.47_total_credits": 15067,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 8708,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 8708,
      // Payments. Line 71. California income tax withheld. See instructions.
      "form-540.line.71_ca_income_tax_withheld": 24800,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 24800,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 24800,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 24800,
      // Line 97. Overpaid tax. If line 95 is more than line 64, subtract line 64 from line 95.
      "form-540.line.97_overpaid_tax": 16092,
      // Line 99. Overpaid tax available this year. Subtract line 98 from line 97.
      "form-540.line.99_overpaid_tax_available": 16092,
      // Refund and Direct Deposit. Line 115. Refund or no amount due. Subtract the sum of line 110
      "form-540.line.115_refund_or_no_amount_due": 16092,
    },
    // More than two other credits: lines 43 and 44 stay blank (line 45 holds them).
    renderedBlank: [
      "form-540.line.43_credit_name",
      "form-540.line.43_credit_amount",
      "form-540.line.44_credit_name",
      "form-540.line.44_credit_amount",
    ],
  },
};

export function katerineExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
