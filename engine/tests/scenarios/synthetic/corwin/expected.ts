/*
 * corwin — LOCKED expected values, drafted from the engine's
 * output on 2026-11-22 (scripts/draftExpected.ts).
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
  "form-3903": {
    engineFields: {
      // Line 1 — Transportation and storage of household goods and personal effects
      "form-3903.0.line.1_transportation_storage_household_goods": 2790,
      // Line 2 — Travel (including lodging) from your old home to your new home. Do not include th
      "form-3903.0.line.2_travel_lodging": 210,
      // Line 3 — Add lines 1 and 2
      "form-3903.0.line.3_total_moving_expenses": 3000,
      // Line 4 — Enter the total amount the government paid you for the expenses listed on lines 1
      "form-3903.0.line.4_government_paid_amount": 4200,
    },
    renderedText: {
      "form-3903.0.header.taxpayer_name": "Corwin Marchetti",
      "form-3903.0.header.ssn": "400-00-3904",
    },
    // Line 3 (3,000) is not more than line 4 (4,200): No, no deduction, line 5 blank.
    renderedChecked: [
      "form-3903.0.header.armed_forces_move_certification",
      "form-3903.0.line.5_line_3_more_than_line_4_no",
    ],
    renderedBlank: [
      "form-3903.0.line.5_line_3_more_than_line_4_yes",
      "form-3903.0.line.5_moving_expense_deduction",
    ],
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 52300,
      // Line 1h — Other earned income amount: Form 3903 line 4 − line 3
      "form-1040.line.1h_amount": 1200,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 53500,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 53500,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 53500,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 53500,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 37750,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 4295,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 4295,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 4295,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 4295,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 4000,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 4000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 4000,
      // Line 37 — Amount you owe
      "form-1040.line.37": 295,
    },
    // No Schedule 1 files: no adjustment, so line 10 stays blank.
    renderedBlank: ["form-1040.line.10"],
  },
};

export function corwinExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
