/*
 * ewin — LOCKED expected values, drafted from the engine's
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
  "form-8609-a": {
    engineFields: {
      // Line 1 — Eligible basis of building
      "form-8609-a.0.line.1_eligible_basis_building": 2500000,
      // Line 3 — Qualified basis of low-income building. Multiply line 1 by line 2
      "form-8609-a.0.line.3_qualified_basis_building": 1975000,
      // Line 4 — Part-year adjustment for disposition or acquisition during the tax year
      "form-8609-a.0.line.4_part_year_adjustment_disposition": 1157945,
      // Line 6 — Multiply line 3 or line 4 by the percentage on line 5
      "form-8609-a.0.line.6_multiply_3_or_4_by_5": 46318,
      // Line 7 — Additions to qualified basis, if any
      "form-8609-a.0.line.7_additions_to_qualified_basis": 225000,
      // Line 8 — Part-year adjustment for disposition or acquisition during the tax year
      "form-8609-a.0.line.8_part_year_adjustment_disposition": 131918,
      // Line 10 — Multiply line 7 or line 8 by the percentage on line 9
      "form-8609-a.0.line.10_multiply_7_or_8_by_9": 1755,
      // Line 11 — no increase over 2024's qualified basis: worksheet line 3 is 0 (added by hand)
      "form-8609-a.0.line.11_section_42f3b_modification": 0,
      // Line 12 — Add lines 10 and 11
      "form-8609-a.0.line.12_add_lines": 1755,
      // Line 13 — Credit for building before line 14 reduction. Subtract line 12 from line 6
      "form-8609-a.0.line.13_credit_before_line_14_reduction": 44563,
      // Line 14 — Disallowed credit due to federal grants
      "form-8609-a.0.line.14_disallowed_credit_federal_grants": 1159,
      // Line 15 — Credit allowed for building for tax year. Subtract line 14 from line 13, but do
      "form-8609-a.0.line.15_credit_allowed_for_building": 43404,
      // Line 16 — Taxpayer's proportionate share of credit for the year
      "form-8609-a.0.line.16_proportionate_share_of_credit": 26042,
      // Line 18 — Taxpayer's credit. Combine lines 16 and 17
      "form-8609-a.0.line.18_taxpayers_credit": 26042,
    },
    renderedText: {
      // Item A — the BIN from Form 8609, item E
      "form-8609-a.0.line.a_building_identification_number": "WA-21-00377",
      // Line 2 — the floor space fraction 28,440 / 36,000 = .7900 (the unit fraction is .8000)
      "form-8609-a.0.line.2_low_income_portion_decimal": "7900",
      // Line 5 — Form 8609 line 2, 4%
      "form-8609-a.0.line.5_percentage_decimal": "0400",
      // Line 9 — one-third of .0400 = .0133
      "form-8609-a.0.line.9_percentage_decimal": "0133",
      // Line 18 cents box — whole dollars
      "form-8609-a.0.line.18_taxpayers_credit_cents": "00",
    },
    renderedBlank: [
      // Line 17 — no deferred first-year credit before the 11th year
      "form-8609-a.0.line.17_deferred_first_year_credit_adjustments",
    ],
    renderedChecked: [
      "form-8609-a.0.line.b_new_or_existing_building",
      "form-8609-a.0.line.c_original_form_8609_in_records",
      "form-8609-a.0.line.d_qualified_low_income_project",
    ],
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 185000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 185000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 185000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 185000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 185000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 169250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 33467,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 33467,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 33467,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 33467,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 36000,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 36000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 36000,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 2533,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 2533,
    },
  },
};

export function ewinExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
