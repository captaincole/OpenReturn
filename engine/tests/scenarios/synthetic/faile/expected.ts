/*
 * faile — LOCKED expected values, drafted from the engine's
 * output on 2026-11-23 (scripts/draftExpected.ts).
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
  "schedule-3": {
    engineFields: {
      // Line 1 — Foreign tax credit. Attach Form 1116 if required
      "schedule-3.0.line.1": 150,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 150,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 72000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 72000,
      // Line 2b — Taxable interest
      "form-1040.line.2b": 780,
      // Line 3a — Qualified dividends
      "form-1040.line.3a": 3100,
      // Line 3b — Ordinary dividends
      "form-1040.line.3b": 4200,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 76980,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 76980,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 76980,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 61230,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 8167,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 8167,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 150,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 150,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 8017,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 8017,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 6900,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 6900,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 6900,
      // Line 37 — Amount you owe
      "form-1040.line.37": 1117,
    },
  },
  "schedule-b": {
    engineFields: {
      // Line 1 — Amount (row 1)
      "schedule-b.0.line.1_amount_1": 780,
      // Line 2 — Add the amounts on line 1
      "schedule-b.0.line.2_total_interest": 780,
      // Line 4 — Subtract line 3 from line 2. Enter the result here and on Form 1040 or 1040-SR, l
      "schedule-b.0.line.4_taxable_interest": 780,
      // Line 5 — Amount (row 1)
      "schedule-b.0.line.5_amount_1": 4200,
      // Line 6 — Add the amounts on line 5. Enter the total here and on Form 1040 or 1040-SR, line
      "schedule-b.0.line.6_total_ordinary_dividends": 4200,
    },
  },
};

export function faileExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
