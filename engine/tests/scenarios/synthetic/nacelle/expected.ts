/*
 * nacelle — LOCKED expected values, drafted from the engine's
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
  "schedule-3": {
    engineFields: {
      // Line 10 — Amount paid with request for extension to file
      "schedule-3.0.line.10": 2000,
      // Line 11 — Excess social security and tier 1 RRTA tax withheld
      "schedule-3.0.line.11": 970,
      // Line 15 — Add lines 9 through 12 and 14. Enter here and on Form 1040, line 31
      "schedule-3.0.line.15": 2970,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 191750,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 191750,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 191750,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 191750,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 191750,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 176000,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 35087,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 35087,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 35087,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 35087,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 31200,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 31200,
      // Line 31 — Amount from Schedule 3, line 15
      "form-1040.line.31": 2970,
      // Line 32 — Add lines 27a, 28, 29, 30, and 31. Total other payments and refundable credits
      "form-1040.line.32": 2970,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 34170,
      // Line 37 — Amount you owe
      "form-1040.line.37": 917,
    },
  },
};

export function nacelleExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
