/*
 * moiraine — LOCKED expected values, drafted from the engine's
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
  "form-8888": {
    engineFields: {
      // Line 1a — Amount to be deposited in first account
      "form-8888.0.line.1a_first_account_amount": 1500,
      // Line 2a — Amount to be deposited in second account
      "form-8888.0.line.2a_second_account_amount": 1000,
      // Line 3a — Amount to be deposited in third account
      "form-8888.0.line.3a_third_account_amount": 885,
      // Line 5 — Add lines 1a, 2a, and 3a. The total must equal the refund amount shown on your ta
      "form-8888.0.line.5_total_allocation_refund": 3385,
    },
    renderedText: {
      // The calendar year of the return, last two digits
      "form-8888.0.header.calendar_year": "25",
      "form-8888.0.header.taxpayer_name": "Moiraine Thistlewood",
      "form-8888.0.header.ssn": "400-00-8888",
      // Lines 1b and 1d — the sample-check routing number; the hyphen stays
      "form-8888.0.line.1b_first_account_routing_number": "250250025",
      "form-8888.0.line.1d_first_account_number": "4410-2286-5501",
      // Lines 2b and 2d — the spaces of "RX 55102 93066 41700" are left out
      "form-8888.0.line.2b_second_account_routing_number": "091999996",
      "form-8888.0.line.2d_second_account_number": "RX551029306641700",
      // Lines 3b and 3d
      "form-8888.0.line.3b_third_account_routing_number": "321999990",
      "form-8888.0.line.3d_third_account_number": "7788123450",
    },
    // Line c — one box per account
    renderedChecked: [
      "form-8888.0.line.1c_first_account_savings",
      "form-8888.0.line.2c_second_account_savings",
      "form-8888.0.line.3c_third_account_checking",
    ],
    renderedBlank: [
      "form-8888.0.line.1c_first_account_checking",
      "form-8888.0.line.2c_second_account_checking",
      "form-8888.0.line.3c_third_account_savings",
    ],
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 68000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 68000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 68000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 68000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 68000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 52250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 6415,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 6415,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 6415,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 6415,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 9800,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 9800,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 9800,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 3385,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 3385,
    },
    // Line 35a box — Form 8888 is attached; lines 35b–35d stay blank
    renderedChecked: ["form-1040.line.35a_form_8888_attached"],
    renderedBlank: ["form-1040.line.35b_routing_number", "form-1040.line.35d_account_number"],
  },
};

export function moiraineExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
