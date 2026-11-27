/*
 * javindhra — LOCKED expected values, drafted from the engine's
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
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 300000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 300000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 300000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 300000,
      // Line 18 — Office expense
      "schedule-c.0.line.18": 3000,
      // Line 20b — Rent or lease: Other business property
      "schedule-c.0.line.20b": 24000,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 8000,
      // Line 23 — Taxes and licenses
      "schedule-c.0.line.23": 7000,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 4000,
      // Line 25 — Utilities
      "schedule-c.0.line.25": 6000,
      // Line 26 — Wages (less employment credits)
      "schedule-c.0.line.26": 90000,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 142000,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 158000,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 158000,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 158000,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 158000,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 145913,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 145913,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 145913,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 18093,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 4231,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 22324,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 11162,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 158000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 158000,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 11162,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 11162,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 22324,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 22324,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": 146838,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": 146838,
      // Line 4 — Total qualified business income. Combine lines 2 and 3. If zero or less, enter -0
      "form-8995.0.line.4": 146838,
      // Line 5 — Qualified business income component. Multiply line 4 by 20% (0.20)
      "form-8995.0.line.5": 29368,
      // Line 10 — Qualified business income deduction before the income limitation. Add lines 5 an
      "form-8995.0.line.10": 29368,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 131088,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 131088,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 26218,
      // Line 15 — Qualified business income deduction. Enter the smaller of line 10 or line 14
      "form-8995.0.line.15": 26218,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 158000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 158000,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 11162,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 146838,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 146838,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 26218,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 41968,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 104870,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 18016,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 18016,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 18016,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 22324,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 40340,
      // Line 26 — 2025 estimated tax payments and amount applied from 2024 return
      "form-1040.line.26": 38000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 38000,
      // Line 37 — Amount you owe
      "form-1040.line.37": 2340,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Line 3 . Business income or (loss). See instructions. Column A. Federal Amounts.
      "schedule-ca.0.line.b3_federal": 158000,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 158000,
      // Line 15. Deductible part of self-employment tax. See instructions. Column A. Federal Amoun
      "schedule-ca.2.line.c15_federal": 11162,
      // Line 26. Add line 11 through line 23 and line 25 in columns A, B, and C. See instructions.
      "schedule-ca.3.line.c26_federal": 11162,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 146838,
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
      "schedule-p.0.line.15_taxable_income": 141132,
      // Line 19 . Combine line 14 through line 18 .
      "schedule-p.1.line.19_combine_lines_14_through_18": 146838,
      // Line 21 . Alternative Minimum Taxable Income. Subtract line 20 from line 19 (if married/Re
      "schedule-p.1.line.21_alternative_minimum_taxable_income": 146838,
      // Part 2 . Line 22 . Exemption Amount. (If this schedule is for a certain child under age 24
      "schedule-p.1.line.22_exemption_amount": 92749,
      // Line 23 . Subtract line 22 from line 21 . If zero or less, enter 0 . See instructions.
      "schedule-p.1.line.23_amti_less_exemption": 54089,
      // Line 24 . Tentative Minimum Tax. Multiply line 23 by 7.0% (.07)
      "schedule-p.1.line.24_tentative_minimum_tax": 3786,
      // Line 25 . Regular tax before credits from Form 540, line 31 .
      "schedule-p.1.line.25_regular_tax_before_credits": 9564,
      // Part 3 . Line 1 . Enter the amount from Form 540, line 35 .
      "schedule-p.1.part3.1_tax_from_form_540_line_35": 9411,
      // Line 2 . Enter the tentative minimum tax from Part 2, line 24 .
      "schedule-p.1.part3.2_tentative_minimum_tax": 3786,
      // Section A. Line 3 . Subtract line 2 from line 1 . If zero or less enter 0 and see instruct
      "schedule-p.1.part3.3_excess_tax_offset_by_credits_col_c": 5625,
      // Section A1. Line 4 . Code: 162 . Prison inmate labor credit (FTB 3507). Column A. Credit a
      "schedule-p.1.part3.4_prison_inmate_labor_credit_col_a": 4950,
      // Line 4 . Column B*. Credit used this year. *If the taxpayer is subject to the business cre
      "schedule-p.1.part3.4_prison_inmate_labor_credit_col_b": 4950,
      // Line 4 . Column C. Tax balance that may be offset by credits.
      "schedule-p.1.part3.4_prison_inmate_labor_credit_col_c": 675,
      // Section B. Line 11 . If Part 3, line 3 is zero, enter the amount from line 1 . If line 3 i
      "schedule-p.2.part3.11_tax_balance_col_c": 4461,
      // Section B4 . Line 21 . Code: 242 Pass-through entity elective tax credit. Column A. Credit
      "schedule-p.3.part3.21_pte_elective_tax_credit_amount_col_a": 1500,
      // Line 21 . Column B*. Credit used this year. *If the taxpayer is subject to the business cr
      "schedule-p.3.part3.21_pte_elective_tax_credit_used_col_b": 1500,
      // Line 21 . Column C. Tax balance that may be offset by credits.
      "schedule-p.3.part3.21_pte_elective_tax_tax_balance_col_c": 2961,
    },
  },
  "form-3507": {
    engineFields: {
      // Line 1. Total qualifying wages. See instructions.
      "form-3507.0.line.1_total_qualifying_wages": 40000,
      // Line 2. Multiply line 1 by 10% (.10).
      "form-3507.0.line.2_current_year_credit": 4000,
      // Line 3. Pass-through Prison Inmate Labor Credit(s) from Schedule K-1 (100S, 541, 565, or 5
      "form-3507.0.line.3_pass_through_credit_k1": 650,
      // Line 4. Credit carryover from 2024. See instructions.
      "form-3507.0.line.4_credit_carryover_prior_year": 300,
      // Line 5. Total available Prison Inmate Labor Credit. Add line 2, line 3, and line 4.
      "form-3507.0.line.5_total_available_credit": 4950,
      // Line 6a. Credit claimed. Enter the amount of the credit claimed on the current year tax re
      "form-3507.0.line.6a_credit_claimed": 4950,
      // Verified zeros: not a corporation (6b), no FTB 3870 election (6c), all of line 5 used (7).
      "form-3507.0.line.6b_total_credit_assigned": 0,
      "form-3507.0.line.6c_credit_elected_refundable": 0,
      "form-3507.0.line.7_disallowed_credit_carryover": 0,
    },
  },
  "form-3804-cr": {
    engineFields: {
      // Line 1a. (c) P T E elective tax credit(s).
      "form-3804-cr.0.part1.1a_electing_pte_col_c": 1500,
      // Line 2. Total P T E elective tax credit amount. Add the amounts in column (c) and enter to
      "form-3804-cr.0.part1.2_total_pte_elective_tax_credit": 1500,
      // Part II, Line 1. Total credit from electing qualified P T E s. See instructions.
      "form-3804-cr.0.part2.1_total_credit_from_ptes": 1500,
      // Line 3. Total available credit. Add line 1 and line 2.
      "form-3804-cr.0.part2.3_total_available_credit": 1500,
      // Line 4. Enter the amount of the credit claimed on the current year tax return. See instruc
      "form-3804-cr.0.part2.4_credit_claimed_current_year": 1500,
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
      "form-540.line.13_federal_agi": 146838,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 146838,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 146838,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 141132,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 9564,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 153,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 9411,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 9411,
      // Line 43. Enter credit amount
      "form-540.line.43_credit_amount": 4950,
      // Line 44. Enter credit amount
      "form-540.line.44_credit_amount": 1500,
      // Line 47. Add line 40 through line 46. These are your total credits.
      "form-540.line.47_total_credits": 6450,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 2961,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 2961,
      // Line 72. 2025 California estimated tax and other payments. See instructions.
      "form-540.line.72_ca_estimated_tax_payments": 4000,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 4000,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 4000,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 4000,
      // Line 97. Overpaid tax. If line 95 is more than line 64, subtract line 64 from line 95.
      "form-540.line.97_overpaid_tax": 1039,
      // Line 99. Overpaid tax available this year. Subtract line 98 from line 97.
      "form-540.line.99_overpaid_tax_available": 1039,
      // Refund and Direct Deposit. Line 115. Refund or no amount due. Subtract the sum of line 110
      "form-540.line.115_refund_or_no_amount_due": 1039,
    },
    // Two other credits: lines 43 and 44 hold them by name and code, and line 45 stays blank.
    renderedText: {
      "form-540.line.43_credit_name": "Prison Inmate Labor",
      "form-540.line.43_credit_code": "162",
      "form-540.line.44_credit_name": "PTE Elective Tax",
      "form-540.line.44_credit_code": "242",
    },
    renderedBlank: ["form-540.line.45_schedule_p_credits"],
  },
};

export function javindhraExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
