/*
 * wren — LOCKED expected values, drafted from the engine's
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
  "form-8839": {
    engineFields: {
      // Line 2, Child 1 — Maximum adoption credit per child. Enter $17,280
      "form-8839.0.line.2_maximum_adoption_credit_child_1": 17280,
      // Line 2, Child 2 — Maximum adoption credit per child. Enter $17,280
      "form-8839.0.line.2_maximum_adoption_credit_child_2": 17280,
      // Line 2, Child 3 — Maximum adoption credit per child. Enter $17,280
      "form-8839.0.line.2_maximum_adoption_credit_child_3": 17280,
      // Line 3, Child 3 — Did you file Form 8839 for a prior year for the same child? Amount
      "form-8839.0.line.3_prior_year_amount_child_3": 2400,
      // Line 4, Child 1 — Subtract line 3 from line 2
      "form-8839.0.line.4_credit_limit_remaining_child_1": 17280,
      // Line 4, Child 2 — Subtract line 3 from line 2
      "form-8839.0.line.4_credit_limit_remaining_child_2": 17280,
      // Line 4, Child 3 — Subtract line 3 from line 2
      "form-8839.0.line.4_credit_limit_remaining_child_3": 14880,
      // Line 5, Child 1 — Qualified adoption expenses
      "form-8839.0.line.5_qualified_adoption_expenses_child_1": 17280,
      // Line 5, Child 2 — Qualified adoption expenses
      "form-8839.0.line.5_qualified_adoption_expenses_child_2": 11026,
      // Line 5, Child 3 — Qualified adoption expenses
      "form-8839.0.line.5_qualified_adoption_expenses_child_3": 6820,
      // Line 6, Child 1 — Enter the smaller of line 4 or line 5
      "form-8839.0.line.6_smaller_of_4_or_5_child_1": 17280,
      // Line 6, Child 2 — Enter the smaller of line 4 or line 5
      "form-8839.0.line.6_smaller_of_4_or_5_child_2": 11026,
      // Line 6, Child 3 — Enter the smaller of line 4 or line 5
      "form-8839.0.line.6_smaller_of_4_or_5_child_3": 6820,
      // Line 7 — Enter modified adjusted gross income
      "form-8839.0.line.7_modified_adjusted_gross_income": 269221,
      // Line 8 — Is line 7 more than $259,190? Yes. Subtract $259,190 from line 7
      "form-8839.0.line.8_magi_excess_amount": 10031,
      // Line 10, Child 1 — Multiply each amount on line 6 by line 9
      "form-8839.0.line.10_phaseout_reduction_child_1": 4337,
      // Line 10, Child 2 — Multiply each amount on line 6 by line 9
      "form-8839.0.line.10_phaseout_reduction_child_2": 2768,
      // Line 10, Child 3 — Multiply each amount on line 6 by line 9
      "form-8839.0.line.10_phaseout_reduction_child_3": 1712,
      // Line 11a, Child 1 — Subtract line 10 from line 6
      "form-8839.0.line.11a_credit_after_phaseout_child_1": 12943,
      // Line 11a, Child 2 — Subtract line 10 from line 6
      "form-8839.0.line.11a_credit_after_phaseout_child_2": 8258,
      // Line 11a, Child 3 — Subtract line 10 from line 6
      "form-8839.0.line.11a_credit_after_phaseout_child_3": 5108,
      // Line 11b, Child 1 — Enter the smaller of the amount on line 11a or $5,000
      "form-8839.0.line.11b_smaller_of_11a_or_5000_child_1": 5000,
      // Line 11b, Child 2 — Enter the smaller of the amount on line 11a or $5,000
      "form-8839.0.line.11b_smaller_of_11a_or_5000_child_2": 5000,
      // Line 11b, Child 3 — Enter the smaller of the amount on line 11a or $5,000
      "form-8839.0.line.11b_smaller_of_11a_or_5000_child_3": 5000,
      // Line 11c — Add the amounts on line 11b
      "form-8839.0.line.11c_total_line_11b": 15000,
      // Line 12 — Add the amounts on line 11a
      "form-8839.0.line.12_total_line_11a": 26309,
      // Line 13 — Refundable adoption credit. Enter the amount from line 11(c)
      "form-8839.0.line.13_refundable_adoption_credit": 15000,
      // Line 14 — Subtract line 13 from line 12. If zero or less, enter -0-
      "form-8839.0.line.14_credit_less_refundable": 11309,
      // Line 15 — Credit carryforward, if any, from prior years
      "form-8839.0.line.15_credit_carryforward_prior_years": 1150,
      // Line 16 — Add lines 14 and 15
      "form-8839.0.line.16_add_lines_14_and_15": 12459,
      // Line 17 — Enter the amount from line 5 of the Credit Limit Worksheet in the instructions
      "form-8839.0.line.17_credit_limit_worksheet_amount": 12459,
      // Line 18 — Nonrefundable adoption credit. Enter the smaller of line 16 or line 17
      "form-8839.0.line.18_nonrefundable_adoption_credit": 12459,
      // Line 19 — Maximum exclusion per child. Enter $17,280 (Child 1)
      "form-8839.1.line.19_maximum_exclusion_child_1": 17280,
      // Line 19 — Maximum exclusion per child. Enter $17,280 (Child 2)
      "form-8839.1.line.19_maximum_exclusion_child_2": 17280,
      // Line 19 — Maximum exclusion per child. Enter $17,280 (Child 3)
      "form-8839.1.line.19_maximum_exclusion_child_3": 17280,
      // Line 20 — Employer-provided adoption benefits received for a prior year for the same child
      "form-8839.1.line.20_prior_year_benefits_child_1": 2000,
      // Line 21 — Subtract line 20 from line 19 (Child 1)
      "form-8839.1.line.21_subtract_line_20_child_1": 15280,
      // Line 21 — Subtract line 20 from line 19 (Child 2)
      "form-8839.1.line.21_subtract_line_20_child_2": 17280,
      // Line 21 — Subtract line 20 from line 19 (Child 3)
      "form-8839.1.line.21_subtract_line_20_child_3": 17280,
      // Line 22 — Employer-provided adoption benefits you received in 2025 (Child 1)
      "form-8839.1.line.22_employer_benefits_received_child_1": 3000,
      // Line 22 — Employer-provided adoption benefits you received in 2025 (Child 2)
      "form-8839.1.line.22_employer_benefits_received_child_2": 12500,
      // Line 23 — Add the amounts on line 22
      "form-8839.1.line.23_total_employer_benefits": 15500,
      // Line 24 — Enter the smaller of line 21 or line 22. But if the child was a child with speci
      "form-8839.1.line.24_smaller_of_21_or_22_child_1": 15280,
      // Line 24 — Enter the smaller of line 21 or line 22. But if the child was a child with speci
      "form-8839.1.line.24_smaller_of_21_or_22_child_2": 12500,
      // Line 25 — Enter modified adjusted gross income (from the worksheet in the instructions)
      "form-8839.1.line.25_modified_agi": 281500,
      // Line 26 — Subtract $259,190 from line 25
      "form-8839.1.line.26_magi_over_259190": 22310,
      // Line 28 — Multiply each amount on line 24 by line 27 (Child 1)
      "form-8839.1.line.28_multiply_line_24_child_1": 8526,
      // Line 28 — Multiply each amount on line 24 by line 27 (Child 2)
      "form-8839.1.line.28_multiply_line_24_child_2": 6975,
      // Line 29 — Excluded benefits. Subtract line 28 from line 24 (Child 1)
      "form-8839.1.line.29_excluded_benefits_child_1": 6754,
      // Line 29 — Excluded benefits. Subtract line 28 from line 24 (Child 2)
      "form-8839.1.line.29_excluded_benefits_child_2": 5525,
      // Line 30 — Add the amounts on line 29
      "form-8839.1.line.30_total_excluded_benefits": 12279,
      // Line 31 — Taxable benefits
      "form-8839.1.line.31_taxable_benefits": 3221,
      /* Verified zeros (hand added): "No. Enter -0-" for a child with no prior form or benefits, and Rowan's Part III column, which has no benefits. */
      "form-8839.0.line.3_prior_year_amount_child_1": 0,
      "form-8839.0.line.3_prior_year_amount_child_2": 0,
      "form-8839.1.line.20_prior_year_benefits_child_2": 0,
      "form-8839.1.line.20_prior_year_benefits_child_3": 0,
      "form-8839.1.line.22_employer_benefits_received_child_3": 0,
      "form-8839.1.line.24_smaller_of_21_or_22_child_3": 0,
      "form-8839.1.line.28_multiply_line_24_child_3": 0,
      "form-8839.1.line.29_excluded_benefits_child_3": 0,
    },
    renderedText: {
      "form-8839.0.header.taxpayer_name": "Wren Albescu & Tobiah Albescu",
      "form-8839.0.header.ssn": "400-00-8839",
      "form-8839.0.line.1_row1_col_a_first": "Juniper",
      "form-8839.0.line.1_row1_col_b": "2017",
      "form-8839.0.line.1_row1_col_f": "400-00-8841",
      "form-8839.0.line.1_row2_col_a_first": "Ines",
      "form-8839.0.line.1_row3_col_a_last": "Pell",
      "form-8839.0.line.1_row3_col_f": "900-93-8843",
      // Line 9: 10,031 / 40,000 = 0.250775, three places
      "form-8839.0.line.9_phaseout_decimal_whole": "0",
      "form-8839.0.line.9_phaseout_decimal_fraction": "251",
      // Line 27: 22,310 / 40,000 = 0.55775, three places
      "form-8839.1.line.27_phaseout_decimal_whole": "0",
      "form-8839.1.line.27_phaseout_decimal_fraction": "558",
    },
    renderedChecked: [
      "form-8839.0.line.1_row1_col_d",
      "form-8839.0.line.1_row1_col_g",
      "form-8839.0.line.1_row2_col_e",
      "form-8839.0.line.1_row2_col_g",
      "form-8839.0.line.3_prior_year_form_8839_yes",
      "form-8839.0.line.8_magi_over_threshold_yes",
      "form-8839.1.line.20_prior_year_benefits_yes",
      "form-8839.1.line.26_more_than_259190_yes",
      "form-8839.1.line.31_line_30_more_than_23_no",
    ],
    // Juniper is not disabled; Rowan's adoption is not final.
    renderedBlank: [
      "form-8839.0.line.1_row1_col_c",
      "form-8839.0.line.1_row3_col_g",
      "form-8839.0.line.3_prior_year_form_8839_no",
      "form-8839.1.line.31_line_30_more_than_23_yes",
    ],
  },
  "schedule-3": {
    engineFields: {
      // Line 6c — Adoption credit. Attach Form 8839
      "schedule-3.0.line.6c": 12459,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 12459,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 12459,
    },
  },
  "schedule-b": {
    engineFields: {
      // Line 1 — Amount (row 1)
      "schedule-b.0.line.1_amount_1": 34000,
      // Line 2 — Add the amounts on line 1
      "schedule-b.0.line.2_total_interest": 34000,
      // Line 4 — Subtract line 3 from line 2. Enter the result here and on Form 1040 or 1040-SR, l
      "schedule-b.0.line.4_taxable_interest": 34000,
    },
  },
  "form-8960": {
    engineFields: {
      // Line 1 — Taxable interest (see instructions)
      "form-8960.0.line.1": 34000,
      // Line 8 — Total investment income. Combine lines 1, 2, 3, 4c, 5d, 6, and 7
      "form-8960.0.line.8": 34000,
      // Line 12 — Net investment income. Subtract Part II, line 11, from Part I, line 8. If zero o
      "form-8960.0.line.12": 34000,
      // Line 13 — Modified adjusted gross income (see instructions)
      "form-8960.0.line.13": 269221,
      // Line 14 — Threshold based on filing status (see instructions)
      "form-8960.0.line.14": 250000,
      // Line 15 — Subtract line 14 from line 13. If zero or less, enter -0-
      "form-8960.0.line.15": 19221,
      // Line 16 — Enter the smaller of line 12 or line 15
      "form-8960.0.line.16": 19221,
      // Line 17 — Net investment income tax for individuals. Multiply line 16 by 3.8% (0.038)
      "form-8960.0.line.17": 730,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 12 — Net investment income tax. Attach Form 8960
      "schedule-2.0.line.12_net_investment_income_tax": 730,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 730,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 232000,
      // Line 1f — Employer-provided adoption benefits from Form 8839, line 31
      "form-1040.line.1f": 3221,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 235221,
      // Line 2b — Taxable interest
      "form-1040.line.2b": 34000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 269221,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 269221,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 269221,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 31500,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 31500,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 237721,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 42747,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 42747,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 12459,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 12459,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 30288,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 730,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 31018,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 38200,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 38200,
      // Line 30 — Refundable adoption credit from Form 8839, line 13
      "form-1040.line.30": 15000,
      // Line 32 — Add lines 27a, 28, 29, 30, and 31. Total other payments and refundable credits
      "form-1040.line.32": 15000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 53200,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 22182,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 22182,
    },
  },
};

export function wrenExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
