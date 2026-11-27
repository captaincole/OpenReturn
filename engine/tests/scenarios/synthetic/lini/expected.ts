/*
 * lini — LOCKED expected values, drafted from the engine's
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
      // Line 7 — Enter the number of days each child lived with you in the United States during th
      "form-8862.0.line.7_days_lived_in_us_child_1": 365,
      // Line 7 — Enter the number of days each child lived with you in the United States during th
      "form-8862.0.line.7_days_lived_in_us_child_2": 365,
      // Line 7 — Enter the number of days each child lived with you in the United States during th
      "form-8862.0.line.7_days_lived_in_us_child_3": 304,
    },
    renderedText: {
      "form-8862.0.header.taxpayer_name": "Lini Thornbury",
      "form-8862.0.header.ssn": "400-00-8862",
      // Line 1: the year of this return.
      "form-8862.0.line.1_tax_year_filing_form": "2025",
      // Line 5: the Schedule EIC children, in its order.
      "form-8862.0.line.5a_child_1_name": "Mira Thornbury",
      "form-8862.0.line.5b_child_2_name": "Owen Thornbury",
      "form-8862.0.line.5c_child_3_name": "Dara Thornbury",
      // Line 8: Owen was born 03/12/2025.
      "form-8862.0.line.8_child_2_birth_month": "03",
      "form-8862.0.line.8_child_2_birth_day": "12",
      // Lines 12 and 13: the Schedule 8812 children and other dependent.
      "form-8862.1.line.12a_ctc_child_1_name": "Mira Thornbury",
      "form-8862.1.line.12b_ctc_child_2_name": "Owen Thornbury",
      "form-8862.1.line.13a_odc_dependent_1_name": "Dara Thornbury",
      // Line 18: the Form 8863 student.
      "form-8862.2.line.18a_student_1_name": "Dara Thornbury",
    },
    renderedChecked: [
      "form-8862.0.line.2_claiming_eic",
      "form-8862.0.line.2_claiming_ctc_actc_odc",
      "form-8862.0.line.2_claiming_aotc",
      "form-8862.0.line.3_eic_only_income_misreported_no",
      "form-8862.0.line.4_qualifying_child_of_another_no",
      "form-8862.0.line.6_schedule_eic_qualifying_child_yes",
      "form-8862.1.line.14_child_1_lived_with_you_yes",
      "form-8862.1.line.14_child_2_lived_with_you_yes",
      "form-8862.1.line.15_child_1_qualifying_child_yes",
      "form-8862.1.line.15_child_2_qualifying_child_yes",
      "form-8862.1.line.16_child_1_your_dependent_yes",
      "form-8862.1.line.16_child_2_your_dependent_yes",
      "form-8862.1.line.16_other_dependent_1_your_dependent_yes",
      "form-8862.1.line.17_child_1_us_citizen_resident_yes",
      "form-8862.1.line.17_child_2_us_citizen_resident_yes",
      "form-8862.1.line.17_other_dependent_1_us_citizen_resident_yes",
      "form-8862.2.line.19a_student_1_eligible_yes",
      "form-8862.2.line.19b_student_1_prior_four_years_no",
    ],
    // Section B is for a filer without a qualifying child; no fourth child or second student.
    renderedBlank: [
      "form-8862.0.line.8_child_1_birth_month",
      "form-8862.1.line.9a_days_main_home_us",
      "form-8862.1.line.10a_your_age_year_end",
      "form-8862.1.line.12c_ctc_child_3_name",
      "form-8862.1.line.13b_odc_dependent_2_name",
      "form-8862.2.line.18b_student_2_name",
    ],
  },
  "schedule-eic": {
    engineFields: {
      // Line 6 — Number of months child lived with you in the United States during 2025, Child 1
      "schedule-eic.0.line.6_months_lived_in_us_child_1": 12,
      // Line 6 — Number of months child lived with you in the United States during 2025, Child 2
      "schedule-eic.0.line.6_months_lived_in_us_child_2": 12,
      // Line 6 — Number of months child lived with you in the United States during 2025, Child 3
      "schedule-eic.0.line.6_months_lived_in_us_child_3": 11,
    },
  },
  "schedule-8812": {
    engineFields: {
      // Line 1 — Enter the amount from line 11a of your Form 1040, 1040-SR, or 1040-NR
      "schedule-8812.0.line.1_form_1040_line_11a": 50000,
      // Line 3 — Add lines 1 and 2d
      "schedule-8812.0.line.3_modified_agi": 50000,
      // Line 4 — Number of qualifying children under age 17 with the required social security numb
      "schedule-8812.0.line.4_qualifying_children_under_17": 2,
      // Line 5 — Multiply line 4 by $2,200
      "schedule-8812.0.line.5_qualifying_children_times_2200": 4400,
      // Line 6 — Number of other dependents, including any qualifying children who are not under a
      "schedule-8812.0.line.6_other_dependents": 1,
      // Line 7 — Multiply line 6 by $500
      "schedule-8812.0.line.7_other_dependents_times_500": 500,
      // Line 8 — Add lines 5 and 7
      "schedule-8812.0.line.8_total_credit_before_limit": 4900,
      // Line 9 — Enter the amount shown below for your filing status. Married filing jointly—$400,
      "schedule-8812.0.line.9_filing_status_threshold": 200000,
      // Line 12 — Is the amount on line 8 more than the amount on line 11? Yes. Subtract line 11 f
      "schedule-8812.0.line.12_credit_after_phaseout": 4900,
      // Line 13 — Enter the amount from Credit Limit Worksheet A
      "schedule-8812.0.line.13_credit_limit_worksheet_a": 1325,
      // Line 14 — Enter the smaller of line 12 or line 13. This is your child tax credit and credi
      "schedule-8812.0.line.14_child_tax_credit_and_other_dependents": 1325,
      // Line 16a — Subtract line 14 from line 12. If zero, stop here; you cannot take the addition
      "schedule-8812.1.line.16a_line12_minus_line14": 3575,
      // Line 16b — Number of qualifying children under age 17 with the required social security nu
      "schedule-8812.1.line.16b_qualifying_children_count": 2,
      // Line 16b — Number of qualifying children under age 17 with the required social security nu
      "schedule-8812.1.line.16b_qualifying_children_times_1700": 3400,
      // Line 17 — Enter the smaller of line 16a or line 16b
      "schedule-8812.1.line.17_smaller_of_16a_16b": 3400,
      // Line 18a — Earned income (see instructions)
      "schedule-8812.1.line.18a_earned_income": 50000,
      // Line 19 — Is the amount on line 18a more than $2,500? Yes. Subtract $2,500 from the amount
      "schedule-8812.1.line.19_earned_income_over_2500": 47500,
      // Line 20 — Multiply the amount on line 19 by 15% (0.15) and enter the result
      "schedule-8812.1.line.20_line19_times_15_percent": 7125,
      // Line 27 — This is your additional child tax credit. Enter this amount on Form 1040, 1040-S
      "schedule-8812.1.line.27_additional_child_tax_credit": 3400,
    },
  },
  "form-8863": {
    engineFields: {
      // Line 1 — After completing Part III for each student, enter the total of all amounts from a
      "form-8863.0.line.1_total_part3_line_30": 2500,
      // Line 2 — Enter $180,000 if married filing jointly; or $90,000 if single, head of household
      "form-8863.0.line.2_filing_status_limit": 90000,
      // Line 3 — Enter the amount from Form 1040 or 1040-SR, line 11b
      "form-8863.0.line.3_modified_agi": 50000,
      // Line 4 — Subtract line 3 from line 2. If zero or less, stop; you can't take any education
      "form-8863.0.line.4_limit_minus_agi": 40000,
      // Line 5 — Enter $20,000 if married filing jointly; or $10,000 if single, head of household,
      "form-8863.0.line.5_phaseout_range": 10000,
      // Line 7 — Multiply line 1 by line 6
      "form-8863.0.line.7_tentative_american_opportunity_credit": 2500,
      // Line 8 — Refundable American opportunity credit. Multiply line 7 by 40% (0.40)
      "form-8863.0.line.8_refundable_american_opportunity_credit": 1000,
      // Line 9 — Subtract line 8 from line 7
      "form-8863.0.line.9_nonrefundable_american_opportunity_credit": 1500,
      // Line 19 — Nonrefundable education credits. Enter the amount from line 7 of the Credit Limi
      "form-8863.0.line.19_nonrefundable_education_credits": 1500,
      // Line 27 — American Opportunity Credit: Adjusted qualified education expenses. Don't enter
      "form-8863.1.line.27_aoc_adjusted_qualified_expenses": 4000,
      // Line 28 — Subtract $2,000 from line 27. If zero or less, enter -0-
      "form-8863.1.line.28_subtract_2000_from_line27": 2000,
      // Line 29 — Multiply line 28 by 25% (0.25)
      "form-8863.1.line.29_multiply_line28_by_25_percent": 500,
      // Line 30 — If line 28 is zero, enter the amount from line 27. Otherwise, add $2,000 to the
      "form-8863.1.line.30_aoc_tentative_credit_student": 2500,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 3 — Education credits from Form 8863, line 19
      "schedule-3.0.line.3": 1500,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 1500,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 50000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 50000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 50000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 50000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 50000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 23625,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 23625,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 26375,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 2825,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 2825,
      // Line 19 — Child tax credit or credit for other dependents from Schedule 8812
      "form-1040.line.19": 1325,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 1500,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 2825,
      // Line 22 — Subtract line 21 from line 18: the credits take the tax to 0 (checked by hand)
      "form-1040.line.22": 0,
      // Line 24 — Total tax (checked by hand)
      "form-1040.line.24": 0,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 2400,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 2400,
      // Line 27a — Earned income credit (EIC)
      "form-1040.line.27a": 2428,
      // Line 28 — Additional child tax credit (ACTC) from Schedule 8812
      "form-1040.line.28": 3400,
      // Line 29 — American opportunity credit from Form 8863, line 8
      "form-1040.line.29": 1000,
      // Line 32 — Add lines 27a, 28, 29, 30, and 31. Total other payments and refundable credits
      "form-1040.line.32": 6828,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 9228,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 9228,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 9228,
    },
  },
};

export function liniExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
