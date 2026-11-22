/*
 * wren — LOCKED expected values, drafted from the engine's
 * output on 2026-11-21 (scripts/draftExpected.ts).
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
  "form-8880": {
    engineFields: {
      // Line 1, column (a) You — Traditional and Roth IRA contributions, and ABLE account contribu
      "form-8880.0.line.1_ira_able_contributions_col_a": 1000,
      // Line 1, column (b) Your spouse — Traditional and Roth IRA contributions, and ABLE account
      "form-8880.0.line.1_ira_able_contributions_col_b": 1500,
      // Line 2, column (a) You — Elective deferrals to a 401(k) or other qualified employer plan,
      "form-8880.0.line.2_elective_deferrals_col_a": 1800,
      // Line 2, column (b) Your spouse — Elective deferrals to a 401(k) or other qualified employe
      "form-8880.0.line.2_elective_deferrals_col_b": 900,
      // Line 3, column (a) You — Add lines 1 and 2
      "form-8880.0.line.3_total_contributions_col_a": 2800,
      // Line 3, column (b) Your spouse — Add lines 1 and 2
      "form-8880.0.line.3_total_contributions_col_b": 2400,
      // Line 4, column (a) You — Certain distributions received after 2022 and before the due date
      "form-8880.0.line.4_certain_distributions_col_a": 300,
      // Line 4, column (b) Your spouse — Certain distributions received after 2022 and before the
      "form-8880.0.line.4_certain_distributions_col_b": 300,
      // Line 5, column (a) You — Subtract line 4 from line 3. If zero or less, enter -0-
      "form-8880.0.line.5_contributions_less_distributions_col_a": 2500,
      // Line 5, column (b) Your spouse — Subtract line 4 from line 3. If zero or less, enter -0-
      "form-8880.0.line.5_contributions_less_distributions_col_b": 2100,
      // Line 6, column (a) You — In each column, enter the smaller of line 5 or $2,000
      "form-8880.0.line.6_smaller_of_line_5_or_2000_col_a": 2000,
      // Line 6, column (b) Your spouse — In each column, enter the smaller of line 5 or $2,000
      "form-8880.0.line.6_smaller_of_line_5_or_2000_col_b": 2000,
      // Line 7 — Add the amounts on line 6
      "form-8880.0.line.7_total_line_6": 4000,
      // Line 8 — Enter the amount from Form 1040, 1040-SR, or 1040-NR, line 11a
      "form-8880.0.line.8_adjusted_gross_income": 47500,
      // Line 10 — Multiply line 7 by line 9
      "form-8880.0.line.10_line_7_times_line_9": 2000,
      // Line 11 — Limitation based on tax liability. Enter the amount from the Credit Limit Worksh
      "form-8880.0.line.11_tax_liability_limitation": 1603,
      // Line 12 — Credit for qualified retirement savings contributions. Enter the smaller of line
      "form-8880.0.line.12_retirement_savings_credit": 1603,
      // Credit Limit Worksheet, line 1 — Enter the amount from Form 1040, 1040-SR, or 1040-NR, lin
      "form-8880.1.credit_limit_worksheet.1_form_1040_line_18": 1603,
      // Credit Limit Worksheet, line 2 — no Schedule 3 line 1, 2, 3, 6d or 6l credit
      "form-8880.1.credit_limit_worksheet.2_schedule_3_credits_total": 0,
      // Credit Limit Worksheet, line 3 — Subtract line 2 from line 1. Also enter this amount on Fo
      "form-8880.1.credit_limit_worksheet.3_credit_limit": 1603,
    },
    renderedText: {
      // Line 9 — MFJ, over $39,500 but not over $47,500: 0.5 (the digit after "0.")
      "form-8880.0.line.9_applicable_decimal_amount": "5",
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 4 — Retirement savings contributions credit. Attach Form 8880
      "schedule-3.0.line.4": 1603,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 1603,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 47500,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 47500,
      // Line 5a — Pensions and annuities
      "form-1040.line.5a": 4000,
      // Line 5b — the direct rollover (code G) is not taxable
      "form-1040.line.5b": 0,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 47500,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 47500,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 47500,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 31500,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 31500,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 16000,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 1603,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 1603,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 1603,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 1603,
      // Line 22 — Subtract line 21 from line 18: the credit takes the tax to 0
      "form-1040.line.22": 0,
      // Line 24 — Total tax
      "form-1040.line.24": 0,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 1250,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 1250,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 1250,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 1250,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 1250,
    },
  },
};

export function wrenExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
