/*
 * perrin — LOCKED expected values, drafted from the engine's
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
  "form-8863": {
    engineFields: {
      // Line 1 — After completing Part III for each student, enter the total of all amounts from a
      "form-8863.0.line.1_total_part3_line_30": 2500,
      // Line 2 — Enter $180,000 if married filing jointly; or $90,000 if single, head of household
      "form-8863.0.line.2_filing_status_limit": 180000,
      // Line 3 — Enter the amount from Form 1040 or 1040-SR, line 11b
      "form-8863.0.line.3_modified_agi": 171500,
      // Line 4 — Subtract line 3 from line 2. If zero or less, stop; you can't take any education
      "form-8863.0.line.4_limit_minus_agi": 8500,
      // Line 5 — Enter $20,000 if married filing jointly; or $10,000 if single, head of household,
      "form-8863.0.line.5_phaseout_range": 20000,
      // Line 7 — Multiply line 1 by line 6
      "form-8863.0.line.7_tentative_american_opportunity_credit": 1063,
      // Line 8 — Refundable American opportunity credit. Multiply line 7 by 40% (0.40)
      "form-8863.0.line.8_refundable_american_opportunity_credit": 425,
      // Line 9 — Subtract line 8 from line 7
      "form-8863.0.line.9_nonrefundable_american_opportunity_credit": 638,
      // Line 10 — After completing Part III for each student, enter the total of all amounts from
      "form-8863.0.line.10_total_part3_line_31": 7400,
      // Line 11 — Enter the smaller of line 10 or $10,000
      "form-8863.0.line.11_smaller_of_line_10_or_10000": 7400,
      // Line 12 — Multiply line 11 by 20% (0.20)
      "form-8863.0.line.12_tentative_lifetime_learning_credit": 1480,
      // Line 13 — Enter $180,000 if married filing jointly; or $90,000 if single, head of househol
      "form-8863.0.line.13_filing_status_limit": 180000,
      // Line 14 — Enter the amount from Form 1040 or 1040-SR, line 11b
      "form-8863.0.line.14_modified_agi": 171500,
      // Line 15 — Subtract line 14 from line 13
      "form-8863.0.line.15_limit_minus_agi": 8500,
      // Line 16 — Enter $20,000 if married filing jointly; or $10,000 if single, head of household
      "form-8863.0.line.16_phaseout_range": 20000,
      // Line 18 — Multiply line 12 by line 17
      "form-8863.0.line.18_lifetime_learning_credit_after_phaseout": 629,
      // Line 19 — Nonrefundable education credits. Enter the amount from line 7 of the Credit Limi
      "form-8863.0.line.19_nonrefundable_education_credits": 1267,
      // Line 27 — American Opportunity Credit: Adjusted qualified education expenses. Don't enter
      "form-8863.1.line.27_aoc_adjusted_qualified_expenses": 4000,
      // Line 28 — Subtract $2,000 from line 27. If zero or less, enter -0-
      "form-8863.1.line.28_subtract_2000_from_line27": 2000,
      // Line 29 — Multiply line 28 by 25% (0.25)
      "form-8863.1.line.29_multiply_line28_by_25_percent": 500,
      // Line 30 — If line 28 is zero, enter the amount from line 27. Otherwise, add $2,000 to the
      "form-8863.1.line.30_aoc_tentative_credit_student": 2500,
    },
    renderedText: {
      // Lines 6 and 17 — (180,000 − 171,500) / 20,000 = 0.425
      "form-8863.0.line.6_phaseout_decimal_whole": "0",
      "form-8863.0.line.6_phaseout_decimal_fraction": "425",
      "form-8863.0.line.17_phaseout_decimal_whole": "0",
      "form-8863.0.line.17_phaseout_decimal_fraction": "425",
      // Part III on the first page 2: Perrin, two institutions
      "form-8863.1.line.20_student_name": "Perrin Quillfeather",
      "form-8863.1.line.21_student_ssn_part3": "8863",
      "form-8863.1.line.22a_first_institution_name": "Rio Grande Valley State University",
      "form-8863.1.line.22b_second_institution_name": "Sunland Park Community College",
      "form-8863.1.line.22a_4_first_institution_ein_digit9": "6",
      "form-8863.1.line.22b_4_second_institution_ein_digit9": "7",
    },
    renderedBlank: [
      // A filer of 24 or more, on a joint return: the line 7 box stays clear
      "form-8863.0.line.7_under_24_no_refundable_credit",
      // Perrin takes the American opportunity credit, so line 31 stays blank
      "form-8863.1.line.31_llc_adjusted_qualified_expenses",
    ],
    renderedChecked: [
      "form-8863.1.line.22a_2_received_1098t_2025_yes",
      "form-8863.1.line.22a_3_received_1098t_2024_box7_no",
      "form-8863.1.line.22b_2_received_1098t_2025_yes",
      "form-8863.1.line.23_aoc_claimed_4_prior_years_no",
      "form-8863.1.line.24_enrolled_at_least_half_time_yes",
      "form-8863.1.line.25_completed_first_4_years_no",
      "form-8863.1.line.26_felony_drug_conviction_no",
    ],
  },
  "schedule-3": {
    engineFields: {
      // Line 3 — Education credits from Form 8863, line 19
      "schedule-3.0.line.3": 1267,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 1267,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 171500,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 171500,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 171500,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 171500,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 171500,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 31500,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 31500,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 140000,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 20628,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 20628,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 1267,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 1267,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 19361,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 19361,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 16000,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 16000,
      // Line 29 — American opportunity credit from Form 8863, line 8
      "form-1040.line.29": 425,
      // Line 32 — Add lines 27a, 28, 29, 30, and 31. Total other payments and refundable credits
      "form-1040.line.32": 425,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 16425,
      // Line 37 — Amount you owe
      "form-1040.line.37": 2936,
    },
  },
};

export function perrinExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
