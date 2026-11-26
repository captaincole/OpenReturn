/*
 * romanda — LOCKED expected values, drafted from the engine's
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
  "form-2555": {
    engineFields: {
      // Line 18, row 1 — (d) Full days present in country
      "form-2555.1.line.18_row1_col_d": 151,
      // Line 18, row 2 — (d) Full days present in country
      "form-2555.1.line.18_row2_col_d": 12,
      // Line 18, row 3 — (d) Full days present in country
      "form-2555.1.line.18_row3_col_d": 199,
      // Line 20a — Allowable share of income for personal services performed: In a business (inclu
      "form-2555.1.line.20a_business_or_profession_income": 150000,
      // Line 24 — Add lines 19 through 21d, line 22g, and line 23
      "form-2555.1.line.24_total_before_excludable_meals_lodging": 150000,
      // Line 26 — Subtract line 25 from line 24. This is your 2025 foreign earned income
      "form-2555.1.line.26_foreign_earned_income": 150000,
      // Line 27 — Enter the amount from line 26
      "form-2555.2.line.27_amount_from_line_26": 150000,
      // Line 28 — Qualified housing expenses for the tax year
      "form-2555.2.line.28_qualified_housing_expenses": 33860,
      // Line 29b — Enter limit on housing expenses
      "form-2555.2.line.29b_housing_expenses_limit": 32696,
      // Line 30 — Enter the smaller of line 28 or line 29b
      "form-2555.2.line.30_smaller_of_line_28_or_29b": 32696,
      // Line 31 — Number of days in your qualifying period that fall within your 2025 tax year
      "form-2555.2.line.31_qualifying_period_days": 306,
      // Line 32 — Multiply $56.99 by the number of days on line 31. If 365 is entered on line 31,
      "form-2555.2.line.32_base_housing_amount": 17439,
      // Line 33 — Subtract line 32 from line 30
      "form-2555.2.line.33_housing_amount": 15257,
      // Line 37 — Maximum foreign earned income exclusion. Enter $130,000
      "form-2555.2.line.37_maximum_foreign_earned_income_exclusion": 130000,
      // Line 38 — If you completed Part VI, enter the number from line 31. All others, enter the n
      "form-2555.2.line.38_qualifying_period_days": 306,
      // Line 40 — Multiply line 37 by line 39
      "form-2555.2.line.40_prorated_maximum_exclusion": 108940,
      // Line 41 — Subtract line 36 from line 27
      "form-2555.2.line.41_income_less_housing_exclusion": 150000,
      // Line 42 — Foreign earned income exclusion. Enter the smaller of line 40 or line 41
      "form-2555.2.line.42_foreign_earned_income_exclusion": 108940,
      // Line 43 — Add lines 36 and 42
      "form-2555.2.line.43_total_exclusions": 108940,
      // Line 44 — Deductions allowed in figuring your adjusted gross income (Form 1040 or 1040-SR,
      "form-2555.2.line.44_deductions_allocable_excluded_income": 21197,
      // Line 45 — Subtract line 44 from line 43
      "form-2555.2.line.45_net_exclusion": 87743,
      // Line 46 — Subtract line 36 from line 33
      "form-2555.2.line.46_housing_amount_less_exclusion": 15257,
      // Line 47 — Subtract line 43 from line 27
      "form-2555.2.line.47_income_less_total_exclusions": 41060,
      // Line 48 — Enter the smaller of line 46 or line 47
      "form-2555.2.line.48_smaller_of_line_46_or_47": 15257,
      // Line 49 — Housing deduction carryover from 2024 (from the Housing Deduction Carryover Work
      "form-2555.2.line.49_housing_deduction_carryover": 2500,
      // Line 50 — Housing deduction. Add lines 48 and 49
      "form-2555.2.line.50_housing_deduction": 17757,
    },
  },
  "schedule-b": {
    engineFields: {
      // Line 1 — Amount (row 1)
      "schedule-b.0.line.1_amount_1": 2000,
      // Line 2 — Add the amounts on line 1
      "schedule-b.0.line.2_total_interest": 2000,
      // Line 4 — Subtract line 3 from line 2. Enter the result here and on Form 1040 or 1040-SR, l
      "schedule-b.0.line.4_taxable_interest": 2000,
    },
  },
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 150000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 150000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 150000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 150000,
      // Line 18 — Office expense
      "schedule-c.0.line.18": 4000,
      // Line 24a — Travel and meals: Travel
      "schedule-c.0.line.24a": 8000,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 3000,
      // Line 17 — Legal and professional services
      "schedule-c.0.line.17": 5000,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 20000,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 130000,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 130000,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 130000,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 130000,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 120055,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 120055,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 120055,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 14887,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 3482,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 18369,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 9185,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 130000,
      // Line 8d — Foreign earned income exclusion from Form 2555
      "schedule-1.0.line.8d": 87743,
      // Line 9 — Total other income. Add lines 8a through 8z
      "schedule-1.0.line.9": -87743,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 42257,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 9185,
      // Line 24j — Housing deduction from Form 2555
      "schedule-1.1.line.24j": 17757,
      // Line 25 — Total other adjustments. Add lines 24a through 24z
      "schedule-1.1.line.25": 17757,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 26942,
    },
  },
  "schedule-1-a": {
    engineFields: {
      // Line 1 — Enter the amount from Form 1040, 1040-SR, or 1040-NR, line 11b
      "schedule-1-a.0.line.1_agi_form_1040": 47315,
      // Line 2b — Enter the amount from Form 2555, line 45
      "schedule-1-a.0.line.2b_form_2555_line_45": 87743,
      // Line 2c — Enter the amount from Form 2555, line 50
      "schedule-1-a.0.line.2c_form_2555_line_50": 17757,
      // Line 2e — Add lines 2a, 2b, 2c, and 2d
      "schedule-1-a.0.line.2e_total_excluded_income": 105500,
      // Line 3 — Add lines 1 and 2e
      "schedule-1-a.0.line.3_modified_agi": 152815,
      // Line 31 — Enter the amount from line 3
      "schedule-1-a.1.line.31_magi_from_line_3": 152815,
      // Line 32 — Enter $75,000 ($150,000 if married filing jointly)
      "schedule-1-a.1.line.32_senior_threshold": 75000,
      // Line 33 — Subtract line 32 from line 31. If zero or less, enter $6,000 on line 35
      "schedule-1-a.1.line.33_magi_over_threshold": 77815,
      // Line 34 — Multiply line 33 by 6% (0.06)
      "schedule-1-a.1.line.34_senior_phaseout": 4669,
      // Line 35 — Subtract line 34 from $6,000. If zero or less, enter -0-
      "schedule-1-a.1.line.35_senior_amount_per_person": 1331,
      // Line 36a — If you have a valid social security number and were born before January 2, 1961
      "schedule-1-a.1.line.36a_senior_deduction_you": 1331,
      // Line 37 — Enhanced deduction for seniors. Add lines 36a and 36b
      "schedule-1-a.1.line.37_enhanced_senior_deduction": 1331,
      // Line 38 — Add lines 13, 21, 30, and 37
      "schedule-1-a.1.line.38_total_additional_deductions": 1331,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 18369,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 18369,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 28234,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 28234,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 5647,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 2b — Taxable interest
      "form-1040.line.2b": 2000,
      // Line 4a — IRA distributions
      "form-1040.line.4a": 30000,
      // Line 4b — Taxable amount
      "form-1040.line.4b": 30000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 42257,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 74257,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 26942,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 47315,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 47315,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 17750,
      // Line 13b — Additional deductions from Schedule 1-A, line 38
      "form-1040.line.13b": 1331,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 18369,
      // Line 25b — Federal income tax withheld from Form(s) 1099
      "form-1040.line.25b": 3000,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 3000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 3000,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Line 2. Taxable interest. Line 2b. Column A. Federal Amounts.
      "schedule-ca.0.line.2b_federal": 2000,
      // Line 4. I R A distributions. See instructions. Line 4 a.
      "schedule-ca.0.line.4a_federal": 30000,
      // Line 4. I R A distributions. Line 4b. Column A. Federal Amounts.
      "schedule-ca.0.line.4b_federal": 30000,
      // Line 3 . Business income or (loss). See instructions. Column A. Federal Amounts.
      "schedule-ca.0.line.b3_federal": 130000,
      // Line 8d. Foreign earned income exclusion from federal Form 2555. Column A. Federal Amounts
      "schedule-ca.1.line.b8d_federal": 87743,
      // Line 8d. Column C. Additions.
      "schedule-ca.1.line.b8d_additions": 87743,
      // Line 9 a. Total other income. Add line 8a through line 8z. Column A. Federal Amounts.
      "schedule-ca.2.line.b9a_federal": -87743,
      // Line 9 a. Column C. Additions.
      "schedule-ca.2.line.b9a_additions": 87743,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 74257,
      // Line 10. Column C. Additions.
      "schedule-ca.2.line.b10_additions": 87743,
      // Line 15. Deductible part of self-employment tax. See instructions. Column A. Federal Amoun
      "schedule-ca.2.line.c15_federal": 9185,
      // Line 24j. Housing deduction from federal Form 2555 . Column A. Federal Amounts.
      "schedule-ca.3.line.c24j_federal": 17757,
      // Line 24j. Column B. Subtractions.
      "schedule-ca.3.line.c24j_subtractions": 17757,
      // Line 25. Total other adjustments. Add line 24a through line 24z. Column A. Federal Amounts
      "schedule-ca.3.line.c25_federal": 17757,
      // Line 25. Column B. Subtractions.
      "schedule-ca.3.line.c25_subtractions": 17757,
      // Line 26. Add line 11 through line 23 and line 25 in columns A, B, and C. See instructions.
      "schedule-ca.3.line.c26_federal": 26942,
      // Line 26. Column B. Subtractions.
      "schedule-ca.3.line.c26_subtractions": 17757,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 47315,
      // Line 27. Column B. Subtractions.
      "schedule-ca.3.line.c27_subtractions": -17757,
      // Line 27. Column C. Additions.
      "schedule-ca.3.line.c27_additions": 87743,
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
      // Line 9. Senior: If you (or your spouse / R D P) are 65 or older, enter 1; if both are 65 o
      "form-540.line.9_senior_exemption_count": 1,
      // Multiply the number you put in the line 9 box by $153. Enter this number into this field.
      "form-540.line.9_senior_exemption_amount": 153,
      // Line 11. Exemption amount: Add line 7 through line 10. Transfer this amount to line 32. Wh
      "form-540.line.11_total_exemption_amount": 306,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040 or 1040-SR, li
      "form-540.line.13_federal_agi": 47315,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 47315,
      // Line 16. California adjustments – additions. Enter the amount from Schedule CA (540), Part
      "form-540.line.16_ca_adjustments_additions": 105500,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 152815,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 147109,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 10120,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 306,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 9814,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 9814,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 9814,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 9814,
      // Line 100. Tax due. If line 95 is less than line 64, subtract line 95 from line 64.
      "form-540.line.100_tax_due": 9814,
      // Amount You Owe. Line 111. Amount You Owe. If you do not have an amount on line 99, add lin
      "form-540.line.111_amount_you_owe": 9814,
      // Line 114. Total amount due. See instructions. Enclose, but do not staple, any payment.
      "form-540.line.114_total_amount_due": 9814,
    },
  },
};

export function romandaExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
