/*
 * kenly — LOCKED expected values, drafted from the engine's
 * output on 2026-11-28 (scripts/draftExpected.ts).
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
  "form-8941": {
    engineFields: {
      // Line 1 — Enter the number of individuals you employed during the tax year who are consider
      "form-8941.0.line.1_number_of_employees": 6,
      // Line 2 — Enter the number of full-time equivalent employees (FTEs) you had for the tax yea
      "form-8941.0.line.2_full_time_equivalent_employees": 4,
      // Line 3 — Average annual wages you paid for the tax year (from Worksheet 3, line 3). This a
      "form-8941.0.line.3_average_annual_wages": 32000,
      // Line 4 — Premiums you paid during the tax year for employees included on line 1 for health
      "form-8941.0.line.4_premiums_paid_qualifying_arrangement": 31838,
      // Line 5 — Premiums you would have entered on line 4 if the total premium for each employee
      "form-8941.0.line.5_premiums_at_average_premium": 38004,
      // Line 6 — Enter the smaller of line 4 or line 5
      "form-8941.0.line.6_smaller_of_4_or_5": 31838,
      // Line 7 — Multiply line 6 by the applicable percentage: tax-exempt small employers, 35% (0.
      "form-8941.0.line.7_multiply_6_by_applicable_percentage": 15919,
      // Line 8 — If line 2 is 10 or less, enter the amount from line 7. Otherwise, enter the amoun
      "form-8941.0.line.8_fte_phaseout_amount": 15919,
      // Line 9 — If line 3 is $33,000 or less, enter the amount from line 8. Otherwise, enter the
      "form-8941.0.line.9_wage_phaseout_amount": 15919,
      // Line 11 — Subtract line 10 from line 4. If zero or less, enter -0-
      "form-8941.0.line.11_subtract_10_from_4": 31838,
      // Line 12 — Enter the smaller of line 9 or line 11
      "form-8941.0.line.12_smaller_of_9_or_11": 15919,
      // Line 13 — If line 12 is zero, skip lines 13 and 14 and go to line 15. Otherwise, enter the
      "form-8941.0.line.13_employees_with_premiums_paid": 5,
      // Line 14 — Enter the number of FTEs you would have entered on line 2 if you only included e
      "form-8941.0.line.14_ftes_for_line_13_employees": 3,
      // Line 16 — Add lines 12 and 15
      "form-8941.0.line.16_add_lines_12_and_15": 15919,
    },
  },
  "form-3800": {
    engineFields: {
      // Line 7 — Regular tax before credits
      "form-3800.0.line.7_regular_tax_before_credits": 25097,
      // Line 9 — Add lines 7 and 8
      "form-3800.0.line.9_regular_tax_plus_amt": 25097,
      // Line 11 — Net income tax. Subtract line 10c from line 9
      "form-3800.0.line.11_net_income_tax": 25097,
      // Line 12 — Net regular tax. Subtract line 10c from line 7. If zero or less, enter -0-
      "form-3800.0.line.12_net_regular_tax": 25097,
      // Line 13 — Enter 25% (0.25) of the excess, if any, of line 12 (line 11 for corporations) ov
      "form-3800.0.line.13_25_percent_of_excess": 24,
      // Line 27 — Subtract line 13 from line 11. If zero or less, enter -0-
      "form-3800.1.line.27_subtract_line_13_from_11": 25073,
      // Line 29 — Subtract line 28 from line 27. If zero or less, enter -0-
      "form-3800.1.line.29_subtract_line_28_from_27": 25073,
      // Line 30 — Enter the general business credit from line 5 of Part III: combine column (e) wi
      "form-3800.1.line.30_specified_general_business_credit": 15919,
      // Line 36 — Add lines 30, 33, 34, and 35
      "form-3800.1.line.36_add_lines_30_33_34_35": 15919,
      // Line 37 — Enter the smaller of line 29 or line 36. This is the amount allowed for specifie
      "form-3800.1.line.37_specified_credits_allowed": 15919,
      // Line 38 — Credit allowed for the current year. Add lines 28 and 37
      "form-3800.1.line.38_credit_allowed_current_year": 15919,
      // Line 4h — Form 8941: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.4h_form_8941_col_e": 15919,
      // Line 4h — Form 8941: (g) Combine columns (e) and (f) with the credit from column (d) allow
      "form-3800.3.part3.4h_form_8941_col_g": 15919,
      // Line 5 — Add lines 4a–4z: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.5_add_lines_4a_4z_col_e": 15919,
      // Line 5 — Add lines 4a–4z: (g) Combine columns (e) and (f) with the credit from column (d)
      "form-3800.3.part3.5_add_lines_4a_4z_col_g": 15919,
      // Line 6 — Add lines 2, 3, and 5: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.6_add_lines_2_3_5_col_e": 15919,
      // Line 6 — Add lines 2, 3, and 5: (g) Combine columns (e) and (f) with the credit from colum
      "form-3800.3.part3.6_add_lines_2_3_5_col_g": 15919,
    },
  },
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 480000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 480000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 480000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 480000,
      // Line 20b — Rent or lease: Other business property
      "schedule-c.0.line.20b": 36000,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 70000,
      // Line 23 — Taxes and licenses
      "schedule-c.0.line.23": 12000,
      // Line 14 — Employee benefit programs (other than on line 19)
      "schedule-c.0.line.14": 15919,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 6000,
      // Line 25 — Utilities
      "schedule-c.0.line.25": 4800,
      // Line 26 — Wages (less employment credits)
      "schedule-c.0.line.26": 138000,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 282719,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 197281,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 197281,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 197281,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 197281,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 182189,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 182189,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 182189,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 21836,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 5283,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 27119,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 13560,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 197281,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 197281,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 13560,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 13560,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": 183721,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": 183721,
      // Line 4 — Total qualified business income. Combine lines 2 and 3. If zero or less, enter -0
      "form-8995.0.line.4": 183721,
      // Line 5 — Qualified business income component. Multiply line 4 by 20% (0.20)
      "form-8995.0.line.5": 36744,
      // Line 10 — Qualified business income deduction before the income limitation. Add lines 5 an
      "form-8995.0.line.10": 36744,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 167971,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 167971,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 33594,
      // Line 15 — Qualified business income deduction. Enter the smaller of line 10 or line 14
      "form-8995.0.line.15": 33594,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 27119,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 27119,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 6a — General business credit. Attach Form 3800
      "schedule-3.0.line.6a": 15919,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 15919,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 15919,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 197281,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 197281,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 13560,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 183721,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 183721,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 33594,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 49344,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 134377,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 25097,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 25097,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 15919,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 15919,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 9178,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 27119,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 36297,
      // Line 26 — 2025 estimated tax payments and amount applied from 2024 return
      "form-1040.line.26": 36000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 36000,
      // Line 37 — Amount you owe
      "form-1040.line.37": 297,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Line 3 . Business income or (loss). See instructions. Column A. Federal Amounts.
      "schedule-ca.0.line.b3_federal": 197281,
      // Line 3 . Column B. Subtractions.
      "schedule-ca.0.line.b3_subtractions": 15919,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 197281,
      // Line 10. Column B. Subtractions.
      "schedule-ca.2.line.b10_subtractions": 15919,
      // Line 15. Deductible part of self-employment tax. See instructions. Column A. Federal Amoun
      "schedule-ca.2.line.c15_federal": 13560,
      // Line 26. Add line 11 through line 23 and line 25 in columns A, B, and C. See instructions.
      "schedule-ca.3.line.c26_federal": 13560,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 183721,
      // Line 27. Column B. Subtractions.
      "schedule-ca.3.line.c27_subtractions": 15919,
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
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040 or 1040-SR, li
      "form-540.line.13_federal_agi": 183721,
      // Line 14. California adjustments – subtractions. Enter the amount from Schedule CA (540), P
      "form-540.line.14_ca_adjustments_subtractions": 15919,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 167802,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 167802,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 162096,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 11514,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 153,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 11361,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 11361,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 11361,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 11361,
      // Line 100. Tax due. If line 95 is less than line 64, subtract line 95 from line 64.
      "form-540.line.100_tax_due": 11361,
      // Amount You Owe. Line 111. Amount You Owe. If you do not have an amount on line 99, add lin
      "form-540.line.111_amount_you_owe": 11361,
      // Line 114. Total amount due. See instructions. Enclose, but do not staple, any payment.
      "form-540.line.114_total_amount_due": 11361,
    },
  },
};

export function kenlyExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
