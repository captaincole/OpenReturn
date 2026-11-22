/*
 * birgitte — LOCKED expected values, drafted from the engine's
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
  "form-8936": {
    engineFields: {
      // Line 1a — Enter the amount from line 11a of your 2025 Form 1040, 1040-SR, or 1040-NR
      "form-8936.0.line.1a_2025_form_1040_line_11a": 162000,
      // Line 2 — Add lines 1a through 1e
      "form-8936.0.line.2_2025_magi": 162000,
      // Line 3a — Enter the amount from line 11 of your 2024 Form 1040, 1040-SR, or 1040-NR
      "form-8936.0.line.3a_2024_form_1040_line_11": 155000,
      // Line 4 — Add lines 3a through 3e
      "form-8936.0.line.4_2024_magi": 155000,
    },
    renderedText: {
      "form-8936.0.header.taxpayer_name": "Birgitte Solvang",
      "form-8936.0.header.identifying_number": "400-00-8938",
      "form-8936.0.line.5_2024_filing_status": "S",
    },
    // Both credits went to the dealer and are repaid: Parts II–V stay blank.
    renderedBlank: [
      "form-8936.0.line.6_business_use_credit_schedule_a",
      "form-8936.0.line.9_personal_use_credit_schedule_a",
      "form-8936.0.line.13_personal_use_credit",
      "form-8936.0.line.14_previously_owned_credit_schedule_a",
      "form-8936.0.line.18_previously_owned_vehicle_credit",
    ],
  },
  "schedule-2": {
    engineFields: {
      // Line 1b — Repayment of new clean vehicle credit(s) transferred to a registered dealer from
      "schedule-2.0.line.1b_new_clean_vehicle_credit_repayment": 7500,
      // Line 1c — Repayment of previously owned clean vehicle credit(s) transferred to a registere
      "schedule-2.0.line.1c_previously_owned_clean_vehicle_credit_repayment": 4000,
      // Line 1z — Add lines 1a through 1y
      "schedule-2.0.line.1z_total_lines_1a_through_1y": 11500,
      // Line 3 — Add lines 1z and 2. Enter here and on Form 1040, 1040-SR, or 1040-NR, line 17
      "schedule-2.0.line.3_total_lines_1z_and_2": 11500,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 162000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 162000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 162000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 162000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 162000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 146250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 27947,
      // Line 17 — Amount from Schedule 2, line 3
      "form-1040.line.17": 11500,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 39447,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 39447,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 39447,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 40000,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 40000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 40000,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 553,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 553,
    },
  },
};

export function birgitteExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
