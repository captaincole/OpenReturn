/*
 * ghealdan — LOCKED expected values, drafted from the engine's
 * output on 2026-11-27 (scripts/draftExpected.ts).
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
  "form-8862": {
    engineFields: {
      // Line 9a — Enter the number of days during the year entered on line 1 that your main home w
      "form-8862.1.line.9a_days_main_home_us": 365,
      // Line 9b — If married filing jointly, enter the number of days during the year entered on l
      "form-8862.1.line.9b_spouse_days_main_home_us": 300,
      // Line 10a — Enter your age at the end of the year on line 1
      "form-8862.1.line.10a_your_age_year_end": 31,
      // Line 10b — Enter your spouse's age at the end of the year on line 1
      "form-8862.1.line.10b_spouse_age_year_end": 28,
    },
    renderedText: {
      "form-8862.0.header.taxpayer_name": "Corin Abelard & Nessa Abelard",
      "form-8862.0.header.ssn": "400-00-8875",
      "form-8862.0.line.1_tax_year_filing_form": "2025",
    },
    // Line 2: the EIC only; lines 4 and 11 are "No" on a joint return.
    renderedChecked: [
      "form-8862.0.line.2_claiming_eic",
      "form-8862.0.line.3_eic_only_income_misreported_no",
      "form-8862.0.line.4_qualifying_child_of_another_no",
      "form-8862.1.line.11a_you_claimed_as_dependent_no",
      "form-8862.1.line.11b_spouse_claimed_as_dependent_no",
    ],
    // Section A is for a filer with a qualifying child; Parts III and IV are not claimed.
    renderedBlank: [
      "form-8862.0.line.5a_child_1_name",
      "form-8862.0.line.7_days_lived_in_us_child_1",
      "form-8862.1.line.12a_ctc_child_1_name",
      "form-8862.2.line.18a_student_1_name",
    ],
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 15500,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 15500,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 15500,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 15500,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 15500,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 31500,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 31500,
      // Line 15 — Taxable income: 15,500 − 31,500 is below 0 (checked by hand)
      "form-1040.line.15": 0,
      // Line 16 — Tax (checked by hand)
      "form-1040.line.16": 0,
      // Line 24 — Total tax (checked by hand)
      "form-1040.line.24": 0,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 275,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 275,
      // Line 27a — Earned income credit (EIC)
      "form-1040.line.27a": 649,
      // Line 32 — Add lines 27a, 28, 29, 30, and 31. Total other payments and refundable credits
      "form-1040.line.32": 649,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 924,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 924,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 924,
    },
  },
};

export function ghealdanExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
