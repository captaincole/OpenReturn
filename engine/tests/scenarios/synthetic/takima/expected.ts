/*
 * takima — LOCKED expected values, drafted from the engine's
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
  "form-8859": {
    engineFields: {
      // Line 1 — Credit carryforward from 2024. Enter the amount from line 4 of your 2024 Form 885
      "form-8859.0.line.1_credit_carryforward_from_2024": 3800,
      // Line 2 — Limitation based on tax liability. Enter the amount from the Tax Liability Limit
      "form-8859.0.line.2_tax_liability_limitation": 3045,
      // Line 3 — Current year credit. Enter the smaller of line 1 or line 2 here
      "form-8859.0.line.3_current_year_credit": 3045,
      // Line 4 — Credit carryforward to 2026. Subtract line 3 from line 1
      "form-8859.0.line.4_credit_carryforward_to_2026": 755,
      // Tax Liability Limit Worksheet, line 1 — Enter the tax liability before the application of
      "form-8859.0.worksheet.1_tax_liability_before_credits": 3545,
      // Tax Liability Limit Worksheet, line 2 — Enter the total of the following credit(s)/adjustm
      "form-8859.0.worksheet.2_total_other_credits": 500,
      // Tax Liability Limit Worksheet, line 3 — Subtract line 2 from line 1. If zero or less, ente
      "form-8859.0.worksheet.3_tax_liability_limit": 3045,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 6h — District of Columbia first-time homebuyer credit. Attach Form 8859
      "schedule-3.0.line.6h": 3045,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 3045,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 3045,
    },
  },
  "schedule-8812": {
    engineFields: {
      // Line 1 — Enter the amount from line 11a of your Form 1040, 1040-SR, or 1040-NR
      "schedule-8812.0.line.1_form_1040_line_11a": 56000,
      // Line 3 — Add lines 1 and 2d
      "schedule-8812.0.line.3_modified_agi": 56000,
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
      "schedule-8812.0.line.13_credit_limit_worksheet_a": 500,
      // Line 14 — Enter the smaller of line 12 or line 13. This is your child tax credit and credi
      "schedule-8812.0.line.14_child_tax_credit_and_other_dependents": 500,
      // Line 16a — Subtract line 14 from line 12. If zero, stop here; you cannot take the addition
      "schedule-8812.1.line.16a_line12_minus_line14": 1700,
      // Line 16b — Number of qualifying children under age 17 with the required social security nu
      "schedule-8812.1.line.16b_qualifying_children_count": 1,
      // Line 16b — Number of qualifying children under age 17 with the required social security nu
      "schedule-8812.1.line.16b_qualifying_children_times_1700": 1700,
      // Line 17 — Enter the smaller of line 16a or line 16b
      "schedule-8812.1.line.17_smaller_of_16a_16b": 1700,
      // Line 18a — Earned income (see instructions)
      "schedule-8812.1.line.18a_earned_income": 56000,
      // Line 19 — Is the amount on line 18a more than $2,500? Yes. Subtract $2,500 from the amount
      "schedule-8812.1.line.19_earned_income_over_2500": 53500,
      // Line 20 — Multiply the amount on line 19 by 15% (0.15) and enter the result
      "schedule-8812.1.line.20_line19_times_15_percent": 8025,
      // Line 27 — This is your additional child tax credit. Enter this amount on Form 1040, 1040-S
      "schedule-8812.1.line.27_additional_child_tax_credit": 1700,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 56000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 56000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 56000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 56000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 56000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 23625,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 23625,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 32375,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 3545,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 3545,
      // Line 19 — Child tax credit or credit for other dependents from Schedule 8812
      "form-1040.line.19": 500,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 3045,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 3545,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 3200,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 3200,
      // Line 28 — Additional child tax credit (ACTC) from Schedule 8812
      "form-1040.line.28": 1700,
      // Line 32 — Add lines 27a, 28, 29, 30, and 31. Total other payments and refundable credits
      "form-1040.line.32": 1700,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 4900,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 4900,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 4900,
    },
  },
};

export function takimaExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
