/*
 * berylla — LOCKED expected values, drafted from the engine's
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
  "form-4563": {
    engineFields: {
      // Line 6, row 1 (c) — Number of days absent
      "form-4563.0.line.6_row1_days_absent_col_c": 13,
      // Line 6, row 2 (c) — Number of days absent
      "form-4563.0.line.6_row2_days_absent_col_c": 13,
      // Line 6, row 3 (c) — Number of days absent
      "form-4563.0.line.6_row3_days_absent_col_c": 9,
      // Line 7 — Wages, salaries, tips, etc.
      "form-4563.0.line.7_wages_salaries_tips": 48000,
      // Line 8 — Taxable interest
      "form-4563.0.line.8_taxable_interest": 300,
      // Line 9 — Ordinary dividends
      "form-4563.0.line.9_ordinary_dividends": 400,
      // Line 10 — Business income
      "form-4563.0.line.10_business_income": 250,
      // Line 11 — Capital gain
      "form-4563.0.line.11_capital_gain": 4000,
      // Line 12 — Rental real estate, royalties, etc.
      "form-4563.0.line.12_rental_real_estate_royalties": 3600,
      // Line 13 — Farm income
      "form-4563.0.line.13_farm_income": 100,
      // Line 14 — Other income
      "form-4563.0.line.14_other_income": 500,
      // Line 15 — Add lines 7 through 14. This is the amount you may exclude from your gross incom
      "form-4563.0.line.15_total_exclusion": 57150,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 21 — Student loan interest deduction
      "schedule-1.1.line.21": 426,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 426,
    },
  },
  "schedule-1-a": {
    engineFields: {
      // Line 1 — Enter the amount from Form 1040, 1040-SR, or 1040-NR, line 11b
      "schedule-1-a.0.line.1_agi_form_1040": 38874,
      // Line 2d — Enter the amount from Form 4563, line 15
      "schedule-1-a.0.line.2d_form_4563_line_15": 57150,
      // Line 2e — Add lines 2a, 2b, 2c, and 2d
      "schedule-1-a.0.line.2e_total_excluded_income": 57150,
      // Line 3 — Add lines 1 and 2e
      "schedule-1-a.0.line.3_modified_agi": 96024,
      // Line 31 — Enter the amount from line 3
      "schedule-1-a.1.line.31_magi_from_line_3": 96024,
      // Line 32 — Enter $75,000 ($150,000 if married filing jointly)
      "schedule-1-a.1.line.32_senior_threshold": 75000,
      // Line 33 — Subtract line 32 from line 31. If zero or less, enter $6,000 on line 35
      "schedule-1-a.1.line.33_magi_over_threshold": 21024,
      // Line 34 — Multiply line 33 by 6% (0.06)
      "schedule-1-a.1.line.34_senior_phaseout": 1261,
      // Line 35 — Subtract line 34 from $6,000. If zero or less, enter -0-
      "schedule-1-a.1.line.35_senior_amount_per_person": 4739,
      // Line 36a — If you have a valid social security number and were born before January 2, 1961
      "schedule-1-a.1.line.36a_senior_deduction_you": 4739,
      // Line 37 — Enhanced deduction for seniors. Add lines 36a and 36b
      "schedule-1-a.1.line.37_enhanced_senior_deduction": 4739,
      // Line 38 — Add lines 13, 21, 30, and 37
      "schedule-1-a.1.line.38_total_additional_deductions": 4739,
    },
  },
  "schedule-8812": {
    engineFields: {
      // Line 1 — Enter the amount from line 11a of your Form 1040, 1040-SR, or 1040-NR
      "schedule-8812.0.line.1_form_1040_line_11a": 38874,
      // Line 2c — Enter the amount from line 15 of your Form 4563
      "schedule-8812.0.line.2c_form_4563_line_15": 57150,
      // Line 2d — Add lines 2a through 2c
      "schedule-8812.0.line.2d_total_excluded_income": 57150,
      // Line 3 — Add lines 1 and 2d
      "schedule-8812.0.line.3_modified_agi": 96024,
      // Line 4 — Number of qualifying children under age 17 with the required social security numb
      "schedule-8812.0.line.4_qualifying_children_under_17": 1,
      // Line 5 — Multiply line 4 by $2,200
      "schedule-8812.0.line.5_qualifying_children_times_2200": 2200,
      // Line 8 — Add lines 5 and 7
      "schedule-8812.0.line.8_total_credit_before_limit": 2200,
      // Line 9 — Enter the amount shown below for your filing status. Married filing jointly—$400,
      "schedule-8812.0.line.9_filing_status_threshold": 200000,
      // Line 12 — Is the amount on line 8 more than the amount on line 11? Yes. Subtract line 11 f
      "schedule-8812.0.line.12_credit_after_phaseout": 2200,
      // Line 13 — Enter the amount from Credit Limit Worksheet A
      "schedule-8812.0.line.13_credit_limit_worksheet_a": 2963,
      // Line 14 — Enter the smaller of line 12 or line 13. This is your child tax credit and credi
      "schedule-8812.0.line.14_child_tax_credit_and_other_dependents": 2200,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 2b — Taxable interest
      "form-1040.line.2b": 1100,
      // Line 3a — Qualified dividends
      "form-1040.line.3a": 600,
      // Line 3b — Ordinary dividends
      "form-1040.line.3b": 900,
      // Line 5a — Pensions and annuities
      "form-1040.line.5a": 22000,
      // Line 5b — Taxable amount
      "form-1040.line.5b": 22000,
      // Line 6a — Social security benefits
      "form-1040.line.6a": 18000,
      // Line 6b — Taxable amount
      "form-1040.line.6b": 15300,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 39300,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 426,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 38874,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 38874,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 6846,
      // Line 13b — Additional deductions from Schedule 1-A, line 38
      "form-1040.line.13b": 4739,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 11585,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 27289,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 2963,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 2963,
      // Line 19 — Child tax credit or credit for other dependents from Schedule 8812
      "form-1040.line.19": 2200,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 2200,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 763,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 763,
      // Line 25b — Federal income tax withheld from Form(s) 1099
      "form-1040.line.25b": 2200,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 2200,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 2200,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 1437,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 1437,
    },
  },
};

export function beryllaExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
