/*
 * yukiri — LOCKED expected values, drafted from the engine's
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
  "form-8912": {
    engineFields: {
      // Line 2 — Bond credit(s) from Part IV. Enter the amount from line 20
      "form-8912.0.line.2_bond_credits_part_iv": 910,
      // Line 4 — Total credit. Add lines 1 through 3
      "form-8912.0.line.4_total_credit": 910,
      // Line 7 — Regular tax before credits
      "form-8912.0.line.7_regular_tax_before_credits": 4943,
      // Line 9 — Add line 7 and line 8
      "form-8912.0.line.9_regular_tax_plus_amt": 4943,
      // Line 11 — Net income tax. Subtract line 10e from line 9
      "form-8912.0.line.11_net_income_tax": 4943,
      // Line 12 — Credit to holders of tax credit bonds allowed for the current year
      "form-8912.0.line.12_credit_allowed_current_year": 910,
      // Line 18, row 1 — (b) Outstanding bond principal (or for build America bonds, interest paya
      "form-8912.2.line.18_row1_col_b": 20000,
      // Line 18, row 1 — (d) Multiply (b) x (c)
      "form-8912.2.line.18_row1_col_d": 910,
      // Line 18, row 1 — (f) Multiply (d) x (e)
      "form-8912.2.line.18_row1_col_f": 910,
      // Line 19 — Add the amounts on line 18, column (f)
      "form-8912.2.line.19_add_line_18_col_f": 910,
      // Line 20 — For a new clean renewable energy bond or a qualified energy conservation bond, m
      "form-8912.2.line.20_bond_credit_not_on_1097btc": 910,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 6k — Credit to holders of tax credit bonds. Attach Form 8912
      "schedule-3.0.line.6k": 910,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 910,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 910,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 58000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 58000,
      // Line 2b — Taxable interest
      "form-1040.line.2b": 910,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 58910,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 58910,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 58910,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 43160,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 4943,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 4943,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 910,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 910,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 4033,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 4033,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 5200,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 5200,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 5200,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 1167,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 1167,
    },
  },
};

export function yukiriExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
