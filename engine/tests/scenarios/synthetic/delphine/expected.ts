/*
 * delphine — LOCKED expected values, drafted from the engine's
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
  "form-4137": {
    engineFields: {
      // Line 1, row A, column (c) — Total cash and charge tips you received (including unreported
      "form-4137.0.line.1_row_a_employer_tips_col_c": 12650,
      // Line 1, row A, column (d) — Total cash and charge tips you reported to your employer
      "form-4137.0.line.1_row_a_employer_tips_col_d": 9400,
      // Line 1, row B, column (c) — Total cash and charge tips you received (including unreported
      "form-4137.0.line.1_row_b_employer_tips_col_c": 1490,
      // Line 1, row B, column (d) — Total cash and charge tips you reported to your employer
      "form-4137.0.line.1_row_b_employer_tips_col_d": 1150,
      // Line 1, row C, column (c) — Total cash and charge tips you received (including unreported
      "form-4137.0.line.1_row_c_employer_tips_col_c": 4370,
      // Line 1, row C, column (d) — Total cash and charge tips you reported to your employer
      "form-4137.0.line.1_row_c_employer_tips_col_d": 3050,
      // Line 2 — Total cash and charge tips you received in 2025. Add the amounts from line 1, col
      "form-4137.0.line.2_total_tips_received": 18510,
      // Line 3 — Total cash and charge tips you reported to your employer(s) in 2025. Add the amou
      "form-4137.0.line.3_total_tips_reported": 13600,
      // Line 4 — Subtract line 3 from line 2
      "form-4137.0.line.4_unreported_tips": 4910,
      // Line 5 — Cash and charge tips you received but didn't report to your employer because the
      "form-4137.0.line.5_tips_under_20_month": 52,
      // Line 6 — Unreported tips subject to Medicare tax. Subtract line 5 from line 4
      "form-4137.0.line.6_tips_subject_medicare_tax": 4858,
      // Line 8 — Total social security wages and social security tips (total of your Form(s) W-2,
      "form-4137.0.line.8_social_security_wages_tips": 66800,
      // Line 9 — Subtract line 8 from line 7. If line 8 is more than line 7, enter -0-
      "form-4137.0.line.9_remaining_social_security_base": 109300,
      // Line 10 — Unreported tips subject to social security tax. Enter the smaller of line 6 or l
      "form-4137.0.line.10_tips_subject_social_security_tax": 4858,
      // Line 11 — Multiply line 10 by 0.062 (social security tax rate)
      "form-4137.0.line.11_social_security_tax": 301,
      // Line 12 — Multiply line 6 by 0.0145 (Medicare tax rate)
      "form-4137.0.line.12_medicare_tax": 70,
      // Line 13 — Add lines 11 and 12
      "form-4137.0.line.13_total_tax_unreported_tips": 371,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 5 — Social security and Medicare tax on unreported tip income. Attach Form 4137
      "schedule-2.0.line.5_ss_medicare_tax_unreported_tips": 371,
      // Line 7 — Total additional social security and Medicare tax. Add lines 5 and 6
      "schedule-2.0.line.7_total_additional_ss_medicare_tax": 371,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 371,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 66800,
      // Line 1c — Tip income not reported on line 1a
      "form-1040.line.1c": 5150,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 71950,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 71950,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 71950,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 71950,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 56200,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 7284,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 7284,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 7284,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 371,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 7655,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 3900,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 3900,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 3900,
      // Line 37 — Amount you owe
      "form-1040.line.37": 3755,
    },
  },
};

export function delphineExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
