/*
 * haral — LOCKED expected values, drafted from the engine's
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
      "form-8609-a.0.line.1_eligible_basis_building": 1200000,
      // Line 3 — Qualified basis of low-income building. Multiply line 1 by line 2
      "form-8609-a.0.line.3_qualified_basis_building": 1080000,
      // Line 16 — the 11th year has no credit of its own (DECISION in copies.ts; added by hand)
      "form-8609-a.0.line.16_proportionate_share_of_credit": 0,
      // Line 17 — 1,200,000 × (.9000 − .3750) × .0900
      "form-8609-a.0.line.17_deferred_first_year_credit_adjustments": 56700,
      // Line 18 — Taxpayer's credit. Combine lines 16 and 17
      "form-8609-a.0.line.18_taxpayers_credit": 56700,
    },
    renderedText: {
      "form-8609-a.0.line.a_building_identification_number": "FL-15-01126",
      // Line 2 — 27/30 units = .9000 (floor space .9176)
      "form-8609-a.0.line.2_low_income_portion_decimal": "9000",
      // Line 5 — Form 8609 line 2, 9%
      "form-8609-a.0.line.5_percentage_decimal": "0900",
    },
    renderedBlank: [
      "form-8609-a.0.line.4_part_year_adjustment_disposition",
      "form-8609-a.0.line.6_multiply_3_or_4_by_5",
      "form-8609-a.0.line.13_credit_before_line_14_reduction",
      "form-8609-a.0.line.15_credit_allowed_for_building",
    ],
    renderedChecked: [
      "form-8609-a.0.line.b_rehabilitation_expenditures",
      "form-8609-a.0.line.c_original_form_8609_in_records",
      "form-8609-a.0.line.d_qualified_low_income_project",
    ],
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 168000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 168000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 168000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 168000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 168000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 152250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 29387,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 29387,
      // Line 20 — Schedule 3 line 8: the low-income housing credit Form 8582-CR allows (re-locked by hand with Form 8586)
      "form-1040.line.20": 6000,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 6000,
      // Line 22 — 29,387 − 6,000 (re-locked by hand with Form 8586)
      "form-1040.line.22": 23387,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 23387,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 31000,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 31000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 31000,
      // Line 34 — 31,000 − 23,387 (re-locked by hand with Form 8586)
      "form-1040.line.34": 7613,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 7613,
    },
  },
  // Added by hand with Form 8586's rules (README.md, hand check).
  "form-8586": {
    engineFields: {
      // Line 1 — one Form 8609-A (the rehabilitation allocation)
      "form-8586.0.line.1_forms_8609a_attached": 1,
      // Line 3 — Form 8609-A line 18, the deferred first-year credit
      "form-8586.0.line.3_current_year_credit_8609a": 56700,
      // Line 5 — line 3 plus line 4 (blank)
      "form-8586.0.line.5_add_lines": 56700,
    },
    renderedChecked: ["form-8586.0.line.2_no"],
    renderedBlank: [
      "form-8586.0.line.2_yes",
      "form-8586.0.line.4_credit_from_pass_through",
      "form-8586.0.line.6_allocated_to_beneficiaries",
      "form-8586.0.line.7_subtract_6_from_5",
    ],
  },
  "form-8582-cr": {
    engineFields: {
      // Worksheet 3: placed in service after 1989
      "form-8582-cr.0.line.3a_low_income_post_1989_credits": 56700,
      "form-8582-cr.0.line.5_total_passive_credits": 56700,
      "form-8582-cr.0.line.7_credits_over_passive_tax": 56700,
      "form-8582-cr.1.line.34_smaller_of_3c_or_33": 56700,
      // Line 35 — tax on 152,250 less tax on 127,250: 25,000 × 24%
      "form-8582-cr.1.line.35_tax_remaining_special_allowance": 6000,
      "form-8582-cr.1.line.37_passive_activity_credit_allowed": 6000,
    },
  },
  "form-3800": {
    engineFields: {
      "form-3800.0.line.7_regular_tax_before_credits": 29387,
      // Line 13 — 25% of (29,387 − 25,000) = 1,096.75
      "form-3800.0.line.13_25_percent_of_excess": 1097,
      "form-3800.1.line.27_subtract_line_13_from_11": 28290,
      "form-3800.1.line.32_specified_passive_activity_credits": 56700,
      "form-3800.1.line.33_specified_passive_credits_allowed": 6000,
      "form-3800.1.line.38_credit_allowed_current_year": 6000,
      "form-3800.3.part3.4d_form_8586_col_d": 56700,
      "form-3800.3.part3.4d_form_8586_col_g": 6000,
    },
  },
  "schedule-3": {
    engineFields: {
      "schedule-3.0.line.6a": 6000,
      "schedule-3.0.line.8": 6000,
    },
  },
};

export function haralExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
