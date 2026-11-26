/*
 * agelmar — LOCKED expected values, drafted from the engine's
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
  "form-8915-f": {
    engineFields: {
      // Line 1a, column (b) — Qualified disaster distribution limit ($22,000, or $100,000 for 2020
      "form-8915-f.1.line.1a_disaster_distribution_limit_col_b": 22000,
      // Line 1b, column (b) — Enter the total qualified disaster distributions made to you in prio
      "form-8915-f.1.line.1b_prior_year_disaster_distributions_col_b": 8000,
      // Line 1c, column (b) — Subtract line 1b from line 1a
      "form-8915-f.1.line.1c_limit_less_prior_distributions_col_b": 14000,
      // Line 1d, column (b) — Enter $22,000 ($100,000 if you checked 2020 in item B) times the num
      "form-8915-f.1.line.1d_limit_for_new_disasters_col_b": 22000,
      // Line 1e, column (b) — Total available qualified disaster distribution amount for this year
      "form-8915-f.1.line.1e_total_available_disaster_distribution_col_b": 36000,
      // Line 2, column (a) Available distributions for this year — Distributions from retirement p
      "form-8915-f.1.line.2_retirement_plan_distributions_col_a": 27000,
      // Line 2, column (b) Qualified disaster distributions for the disasters in the Part I Disast
      "form-8915-f.1.line.2_retirement_plan_distributions_col_b": 15000,
      // Line 3, column (a) Available distributions for this year — Distributions from traditional
      "form-8915-f.1.line.3_traditional_ira_distributions_col_a": 25000,
      // Line 3, column (b) Qualified disaster distributions for the disasters in the Part I Disast
      "form-8915-f.1.line.3_traditional_ira_distributions_col_b": 21000,
      // Line 5a, column (a) — The total distributions from lines 2 through 4 in column (a) that ar
      "form-8915-f.1.line.5a_distributions_not_disaster_col_a": 12000,
      // Line 5b, column (a) — The sum of lines 2 through 4 in column (a) reduced by the amount on
      "form-8915-f.1.line.5b_distributions_less_line_5a_col_a": 40000,
      // Line 5b, column (b) — The smaller of the amount on line 5b, column (a), or line 1e
      "form-8915-f.1.line.5b_distributions_less_line_5a_col_b": 36000,
      // Line 6 — Total qualified disaster distributions. Enter the amount from line 5b, column (b)
      "form-8915-f.1.line.6_total_qualified_disaster_distributions": 36000,
      // Line 7 — Taxable amount. Enter the excess of the sum of lines 2 through 4 in column (a) ov
      "form-8915-f.1.line.7_taxable_amount": 4000,
      // Line 8 — Enter the amount from line 2, column (b)
      "form-8915-f.2.line.8_amount_from_line_2_col_b": 15000,
      // Line 9 — Enter the applicable cost of distributions, if any
      "form-8915-f.2.line.9_applicable_cost_of_distributions": 1200,
      // Line 10 — Subtract line 9 from line 8. This is the taxable amount of your other-than-IRA r
      "form-8915-f.2.line.10_taxable_amount_other_than_ira": 13800,
      // Line 11 — If you elect NOT to spread the taxable amount over 3 years, enter the amount fro
      "form-8915-f.2.line.11_taxable_amount_this_year": 4600,
      // Line 12 — Enter the amount, if any, from Worksheet 2 in the instructions. This is your inc
      "form-8915-f.2.line.12_income_for_prior_years": 2000,
      // Line 13 — Add lines 11 and 12. This is your total income this year from other-than-IRA ret
      "form-8915-f.2.line.13_total_income_this_year": 6600,
      // Line 14 — Total repayment. Enter the amount, if any, from Worksheet 3
      "form-8915-f.2.line.14_total_repayment": 1500,
      // Line 15 — Amount subject to tax this year. Subtract line 14 from line 13. If zero or less,
      "form-8915-f.2.line.15_amount_subject_to_tax": 5100,
      // Line 20 — Enter the amount from line 3, column (b), if any. Don't include on line 20 any a
      "form-8915-f.2.line.20_amount_from_line_3_col_b": 21000,
      // Line 21 — Add lines 18, 19, and 20. This is the taxable amount of your IRA qualified disas
      "form-8915-f.2.line.21_taxable_amount_ira": 21000,
      // Line 22 — If you elect NOT to spread the taxable amount over 3 years, enter the amount fro
      "form-8915-f.2.line.22_taxable_amount_this_year": 7000,
      // Line 23 — Enter the amount, if any, from Worksheet 4 in the instructions. This is your inc
      "form-8915-f.2.line.23_income_for_prior_years": 667,
      // Line 24 — Add lines 22 and 23. This is your total income this year from IRA qualified disa
      "form-8915-f.2.line.24_total_income_this_year": 7667,
      // Line 25 — Total repayment. Enter the amount, if any, from Worksheet 5
      "form-8915-f.2.line.25_total_repayment": 333,
      // Line 26 — Amount subject to tax. Subtract line 25 from line 24. If zero or less, enter -0-
      "form-8915-f.2.line.26_amount_subject_to_tax": 7334,
      // Line 28 — Enter the total amount of qualified distributions you received this year for the
      "form-8915-f.3.line.28_total_qualified_distributions": 12000,
      // Line 29 — Enter the applicable cost of distributions, if any
      "form-8915-f.3.line.29_applicable_cost_of_distributions": 600,
      // Line 30 — Subtract line 29 from line 28
      "form-8915-f.3.line.30_distributions_less_cost": 11400,
      // Line 31 — Enter the total amount of any repayments you made
      "form-8915-f.3.line.31_total_repayments": 5000,
      // Line 32 — Taxable amount. Subtract line 31 from line 30
      "form-8915-f.3.line.32_taxable_amount": 6400,
    },
    renderedText: {
      "form-8915-f.0.header.ssn": "400-00-8915",
      "form-8915-f.0.header.item_c_fema_number_1": "DR-9917-FL",
      "form-8915-f.0.header.item_c_fema_number_2": "DR-9922-FL",
      "form-8915-f.1.line.part1_disaster_table_row2_declaration_date": "01/10/2025",
      "form-8915-f.1.line.part1_distribution_dates_this_year": "02/14/2025, 03/03/2025",
      "form-8915-f.3.line.part4_disaster_row1_fema_number": "DR-9922-FL",
      "form-8915-f.3.line.part4_disaster_row1_ending_date": "01/31/2025",
      "form-8915-f.3.line.part4_qualified_distribution_dates": "01/20/2025",
    },
    renderedChecked: [
      "form-8915-f.0.header.item_a_tax_year_2025",
      "form-8915-f.0.header.item_b_disaster_year_2024",
      "form-8915-f.2.line.8_amount_on_line_2_col_b_yes",
      "form-8915-f.2.line.16_amount_on_line_3_or_4_col_b_yes",
      "form-8915-f.2.line.17_ira_distribution_on_form_8606_no",
      "form-8915-f.3.line.27_ira_distribution_on_8606_no",
    ],
    // Spread over 3 years: the line 11 and 22 boxes stay empty; no Form 8606, so lines 18 and 19 are blank.
    renderedBlank: [
      "form-8915-f.2.line.11_elect_not_to_spread",
      "form-8915-f.2.line.22_elect_not_to_spread",
      "form-8915-f.2.line.18_form_8606_line_15b",
      "form-8915-f.2.line.19_form_8606_line_25b",
    ],
  },
  "form-5329": {
    engineFields: {
      // Line 1 — Early distributions includible in income
      "form-5329.0.line.1_early_distributions_in_income": 10400,
      // Line 3 — Amount subject to additional tax. Subtract line 2 from line 1
      "form-5329.0.line.3_amount_subject_to_tax": 10400,
      // Line 4 — Additional tax. Enter 10% (0.10) of line 3
      "form-5329.0.line.4_additional_tax_early_distributions": 1040,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 8 — Additional tax on IRAs or other tax-favored accounts. Attach Form 5329 if require
      "schedule-2.0.line.8_additional_tax_iras_tax_favored_accounts": 1040,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 1040,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 68000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 68000,
      // Line 4a — IRA distributions
      "form-1040.line.4a": 25000,
      // Line 4b — Taxable amount
      "form-1040.line.4b": 11334,
      // Line 5a — Pensions and annuities
      "form-1040.line.5a": 27000,
      // Line 5b — Taxable amount
      "form-1040.line.5b": 11500,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 90834,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 90834,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 90834,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 75084,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 11431,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 11431,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 11431,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 1040,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 12471,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 7200,
      // Line 25b — Federal income tax withheld from Form(s) 1099
      "form-1040.line.25b": 7900,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 15100,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 15100,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 2629,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 2629,
    },
  },
};

export function agelmarExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
