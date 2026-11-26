/*
 * bair — LOCKED expected values, drafted from the engine's
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
      // Line 14, row 1 — (c) Number of days in U.S. on business
      "form-2555.0.line.14_row1_col_c": 5,
      // Line 14, row 1 — (d) Income earned in U.S. on business (attach computation)
      "form-2555.0.line.14_row1_col_d": 3500,
      // Line 14, row 2 — (c) Number of days in U.S. on business
      "form-2555.0.line.14_row2_col_c": 7,
      // Line 14, row 2 — (d) Income earned in U.S. on business (attach computation)
      "form-2555.0.line.14_row2_col_d": 5500,
      // Line 19 — Total wages, salaries, bonuses, commissions, etc.
      "form-2555.1.line.19_total_wages_salaries_bonuses": 150000,
      // Line 21b — Noncash income: Meals
      "form-2555.1.line.21b_noncash_meals": 1200,
      // Line 21c — Noncash income: Car
      "form-2555.1.line.21c_noncash_car": 4800,
      // Line 21d — Noncash income: Other property or facilities
      "form-2555.1.line.21d_noncash_other_property": 600,
      // Line 22a — Allowances, reimbursements, or expenses paid on your behalf: Cost of living and
      "form-2555.1.line.22a_cost_of_living_differential": 12000,
      // Line 22b — Allowances, reimbursements, or expenses paid on your behalf: Family
      "form-2555.1.line.22b_family_allowance": 2400,
      // Line 22c — Allowances, reimbursements, or expenses paid on your behalf: Education
      "form-2555.1.line.22c_education_allowance": 9000,
      // Line 22d — Allowances, reimbursements, or expenses paid on your behalf: Home leave
      "form-2555.1.line.22d_home_leave_allowance": 3500,
      // Line 22e — Allowances, reimbursements, or expenses paid on your behalf: Quarters
      "form-2555.1.line.22e_quarters_allowance": 30000,
      // Line 22f — Allowances, reimbursements, or expenses paid on your behalf: For any other purp
      "form-2555.1.line.22f_other_purpose_allowance": 2500,
      // Line 22g — Add lines 22a through 22f
      "form-2555.1.line.22g_total_allowances": 59400,
      // Line 23 — Other foreign earned income
      "form-2555.1.line.23_other_foreign_earned_income": 1500,
      // Line 24 — Add lines 19 through 21d, line 22g, and line 23
      "form-2555.1.line.24_total_before_excludable_meals_lodging": 217500,
      // Line 25 — Total amount of meals and lodging included on line 24 that is excludable
      "form-2555.1.line.25_excludable_meals_lodging": 1200,
      // Line 26 — Subtract line 25 from line 24. This is your 2025 foreign earned income
      "form-2555.1.line.26_foreign_earned_income": 216300,
      // Line 27 — Enter the amount from line 26
      "form-2555.2.line.27_amount_from_line_26": 216300,
      // Line 28 — Qualified housing expenses for the tax year
      "form-2555.2.line.28_qualified_housing_expenses": 39526,
      // Line 29b — Enter limit on housing expenses
      "form-2555.2.line.29b_housing_expenses_limit": 39000,
      // Line 30 — Enter the smaller of line 28 or line 29b
      "form-2555.2.line.30_smaller_of_line_28_or_29b": 39000,
      // Line 31 — Number of days in your qualifying period that fall within your 2025 tax year
      "form-2555.2.line.31_qualifying_period_days": 365,
      // Line 32 — Multiply $56.99 by the number of days on line 31. If 365 is entered on line 31,
      "form-2555.2.line.32_base_housing_amount": 20800,
      // Line 33 — Subtract line 32 from line 30
      "form-2555.2.line.33_housing_amount": 18200,
      // Line 34 — Enter employer-provided amounts
      "form-2555.2.line.34_employer_provided_amounts": 216300,
      // Line 36 — Housing exclusion. Multiply line 33 by line 35. Enter the result but don't enter
      "form-2555.2.line.36_housing_exclusion": 18200,
      // Line 37 — Maximum foreign earned income exclusion. Enter $130,000
      "form-2555.2.line.37_maximum_foreign_earned_income_exclusion": 130000,
      // Line 38 — If you completed Part VI, enter the number from line 31. All others, enter the n
      "form-2555.2.line.38_qualifying_period_days": 365,
      // Line 40 — Multiply line 37 by line 39
      "form-2555.2.line.40_prorated_maximum_exclusion": 130000,
      // Line 41 — Subtract line 36 from line 27
      "form-2555.2.line.41_income_less_housing_exclusion": 198100,
      // Line 42 — Foreign earned income exclusion. Enter the smaller of line 40 or line 41
      "form-2555.2.line.42_foreign_earned_income_exclusion": 130000,
      // Line 43 — Add lines 36 and 42
      "form-2555.2.line.43_total_exclusions": 148200,
      // Line 45 — Subtract line 44 from line 43
      "form-2555.2.line.45_net_exclusion": 148200,
    },
  },
  "schedule-b": {
    engineFields: {
      // Line 1 — Amount (row 1)
      "schedule-b.0.line.1_amount_1": 1500,
      // Line 2 — Add the amounts on line 1
      "schedule-b.0.line.2_total_interest": 1500,
      // Line 4 — Subtract line 3 from line 2. Enter the result here and on Form 1040 or 1040-SR, l
      "schedule-b.0.line.4_taxable_interest": 1500,
      // Line 5 — Amount (row 1)
      "schedule-b.0.line.5_amount_1": 3000,
      // Line 6 — Add the amounts on line 5. Enter the total here and on Form 1040 or 1040-SR, line
      "schedule-b.0.line.6_total_ordinary_dividends": 3000,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 8d — Foreign earned income exclusion from Form 2555
      "schedule-1.0.line.8d": 148200,
      // Line 9 — Total other income. Add lines 8a through 8z
      "schedule-1.0.line.9": -148200,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": -148200,
    },
  },
  "schedule-1-a": {
    engineFields: {
      // Line 1 — Enter the amount from Form 1040, 1040-SR, or 1040-NR, line 11b
      "schedule-1-a.0.line.1_agi_form_1040": 81600,
      // Line 2b — Enter the amount from Form 2555, line 45
      "schedule-1-a.0.line.2b_form_2555_line_45": 148200,
      // Line 2e — Add lines 2a, 2b, 2c, and 2d
      "schedule-1-a.0.line.2e_total_excluded_income": 148200,
      // Line 3 — Add lines 1 and 2e
      "schedule-1-a.0.line.3_modified_agi": 229800,
      // Line 31 — Enter the amount from line 3
      "schedule-1-a.1.line.31_magi_from_line_3": 229800,
      // Line 32 — Enter $75,000 ($150,000 if married filing jointly)
      "schedule-1-a.1.line.32_senior_threshold": 75000,
      // Line 33 — Subtract line 32 from line 31. If zero or less, enter $6,000 on line 35
      "schedule-1-a.1.line.33_magi_over_threshold": 154800,
      // Line 34 — Multiply line 33 by 6% (0.06)
      "schedule-1-a.1.line.34_senior_phaseout": 9288,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 228,
      // Line 12 — Net investment income tax. Attach Form 8960
      "schedule-2.0.line.12_net_investment_income_tax": 171,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 399,
    },
  },
  "schedule-8812": {
    engineFields: {
      // Line 1 — Enter the amount from line 11a of your Form 1040, 1040-SR, or 1040-NR
      "schedule-8812.0.line.1_form_1040_line_11a": 81600,
      // Line 2b — Enter the amounts from lines 45 and 50 of your Form 2555
      "schedule-8812.0.line.2b_form_2555_lines_45_50": 148200,
      // Line 2d — Add lines 2a through 2c
      "schedule-8812.0.line.2d_total_excluded_income": 148200,
      // Line 3 — Add lines 1 and 2d
      "schedule-8812.0.line.3_modified_agi": 229800,
      // Line 4 — Number of qualifying children under age 17 with the required social security numb
      "schedule-8812.0.line.4_qualifying_children_under_17": 1,
      // Line 5 — Multiply line 4 by $2,200
      "schedule-8812.0.line.5_qualifying_children_times_2200": 2200,
      // Line 8 — Add lines 5 and 7
      "schedule-8812.0.line.8_total_credit_before_limit": 2200,
      // Line 9 — Enter the amount shown below for your filing status. Married filing jointly—$400,
      "schedule-8812.0.line.9_filing_status_threshold": 200000,
      // Line 10 — Subtract line 9 from line 3. If zero or less, enter -0-. If more than zero and n
      "schedule-8812.0.line.10_excess_over_threshold": 30000,
      // Line 11 — Multiply line 10 by 5% (0.05)
      "schedule-8812.0.line.11_phaseout_amount": 1500,
      // Line 12 — Is the amount on line 8 more than the amount on line 11? Yes. Subtract line 11 f
      "schedule-8812.0.line.12_credit_after_phaseout": 700,
      // Line 13 — Enter the amount from Credit Limit Worksheet A
      "schedule-8812.0.line.13_credit_limit_worksheet_a": 13474,
      // Line 14 — Enter the smaller of line 12 or line 13. This is your child tax credit and credi
      "schedule-8812.0.line.14_child_tax_credit_and_other_dependents": 700,
    },
  },
  "form-8959": {
    engineFields: {
      // Line 1 — Medicare wages and tips from Form W-2, box 5
      "form-8959.0.line.1_medicare_wages_tips": 225300,
      // Line 4 — Add lines 1 through 3
      "form-8959.0.line.4_total_medicare_wages": 225300,
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 200000,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-8959.0.line.6_excess_medicare_wages": 25300,
      // Line 7 — Additional Medicare Tax on Medicare wages. Multiply line 6 by 0.9% (0.009)
      "form-8959.0.line.7_additional_medicare_tax_wages": 228,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 228,
      // Line 19 — Medicare tax withheld from Form W-2, box 6
      "form-8959.0.line.19_medicare_tax_withheld": 3267,
      // Line 20 — Enter the amount from line 1
      "form-8959.0.line.20_medicare_wages_from_line1": 225300,
      // Line 21 — Multiply line 20 by 1.45% (0.0145). Regular Medicare tax withholding on Medicare
      "form-8959.0.line.21_regular_medicare_tax_on_wages": 3267,
    },
  },
  "form-8960": {
    engineFields: {
      // Line 1 — Taxable interest (see instructions)
      "form-8960.0.line.1": 1500,
      // Line 2 — Ordinary dividends (see instructions)
      "form-8960.0.line.2": 3000,
      // Line 8 — Total investment income. Combine lines 1, 2, 3, 4c, 5d, 6, and 7
      "form-8960.0.line.8": 4500,
      // Line 12 — Net investment income. Subtract Part II, line 11, from Part I, line 8. If zero o
      "form-8960.0.line.12": 4500,
      // Line 13 — Modified adjusted gross income (see instructions)
      "form-8960.0.line.13": 211600,
      // Line 14 — Threshold based on filing status (see instructions)
      "form-8960.0.line.14": 200000,
      // Line 15 — Subtract line 14 from line 13. If zero or less, enter -0-
      "form-8960.0.line.15": 11600,
      // Line 16 — Enter the smaller of line 12 or line 15
      "form-8960.0.line.16": 4500,
      // Line 17 — Net investment income tax for individuals. Multiply line 16 by 3.8% (0.038)
      "form-8960.0.line.17": 171,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 225300,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 225300,
      // Line 2b — Taxable interest
      "form-1040.line.2b": 1500,
      // Line 3a — Qualified dividends
      "form-1040.line.3a": 3000,
      // Line 3b — Ordinary dividends
      "form-1040.line.3b": 3000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": -148200,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 81600,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 81600,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 81600,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 25625,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 25625,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 55975,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 13474,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 13474,
      // Line 19 — Child tax credit or credit for other dependents from Schedule 8812
      "form-1040.line.19": 700,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 700,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 12774,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 399,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 13173,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 19000,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 19000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 19000,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 5827,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 5827,
    },
  },
};

export function bairExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
