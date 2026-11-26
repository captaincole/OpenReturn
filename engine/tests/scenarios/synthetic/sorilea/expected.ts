/*
 * sorilea — LOCKED expected values, drafted from the engine's
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
      // Line 1e, column (b) — Total available qualified disaster distribution amount for this year
      "form-8915-f.1.line.1e_total_available_disaster_distribution_col_b": 22000,
      // Line 3, column (a) Available distributions for this year — Distributions from traditional
      "form-8915-f.1.line.3_traditional_ira_distributions_col_a": 33000,
      // Line 3, column (b) Qualified disaster distributions for the disasters in the Part I Disast
      "form-8915-f.1.line.3_traditional_ira_distributions_col_b": 22000,
      // Line 5a, column (a) — The total distributions from lines 2 through 4 in column (a) that ar
      "form-8915-f.1.line.5a_distributions_not_disaster_col_a": 11000,
      // Line 5b, column (a) — The sum of lines 2 through 4 in column (a) reduced by the amount on
      "form-8915-f.1.line.5b_distributions_less_line_5a_col_a": 22000,
      // Line 5b, column (b) — The smaller of the amount on line 5b, column (a), or line 1e
      "form-8915-f.1.line.5b_distributions_less_line_5a_col_b": 22000,
      // Line 6 — Total qualified disaster distributions. Enter the amount from line 5b, column (b)
      "form-8915-f.1.line.6_total_qualified_disaster_distributions": 22000,
      // Line 7 — Taxable amount. Enter the excess of the sum of lines 2 through 4 in column (a) ov
      "form-8915-f.1.line.7_taxable_amount": 11000,
      // Line 18 — Enter the amount, if any, from this year's Form 8606, line 15b
      "form-8915-f.2.line.18_form_8606_line_15b": 20000,
      // Line 21 — Add lines 18, 19, and 20. This is the taxable amount of your IRA qualified disas
      "form-8915-f.2.line.21_taxable_amount_ira": 20000,
      // Line 22 — If you elect NOT to spread the taxable amount over 3 years, enter the amount fro
      "form-8915-f.2.line.22_taxable_amount_this_year": 6667,
      // Line 24 — Add lines 22 and 23. This is your total income this year from IRA qualified disa
      "form-8915-f.2.line.24_total_income_this_year": 6667,
      // Line 26 — Amount subject to tax. Subtract line 25 from line 24. If zero or less, enter -0-
      "form-8915-f.2.line.26_amount_subject_to_tax": 6667,
    },
    renderedChecked: [
      "form-8915-f.0.header.item_b_disaster_year_2025",
      "form-8915-f.2.line.8_amount_on_line_2_col_b_no",
      "form-8915-f.2.line.17_ira_distribution_on_form_8606_yes",
    ],
    // One disaster, on no earlier form: lines 1a to 1d are skipped (line-1e::b01). The IRA is on Form 8606, so line 20 is blank.
    renderedBlank: [
      "form-8915-f.1.line.1a_disaster_distribution_limit_col_b",
      "form-8915-f.1.line.1d_limit_for_new_disasters_col_b",
      "form-8915-f.2.line.20_amount_from_line_3_col_b",
    ],
  },
  "form-8606": {
    engineFields: {
      // Line 2 — Enter your total basis in traditional IRAs
      "form-8606.0.line.2_total_traditional_basis": 3000,
      // Line 3 — Add lines 1 and 2
      "form-8606.0.line.3_total_contributions_and_basis": 3000,
      // Line 5 — Subtract line 4 from line 3
      "form-8606.0.line.5_basis_less_2026_contributions": 3000,
      // Line 7 — Enter your distributions from traditional IRAs in 2025
      "form-8606.0.line.7_traditional_ira_distributions": 33000,
      // Line 9 — Add lines 6, 7, and 8
      "form-8606.0.line.9_total_value_distributions_conversions": 33000,
      // Line 12 — Multiply line 7 by line 10. This is the nontaxable portion of your distributions
      "form-8606.0.line.12_nontaxable_distribution_portion": 3000,
      // Line 13 — Add lines 11 and 12. This is the nontaxable portion of all your distributions
      "form-8606.0.line.13_total_nontaxable_distributions": 3000,
      // Line 15a — Subtract line 12 from line 7
      "form-8606.1.line.15a_line_7_minus_line_12": 30000,
      // Line 15b — Enter the amount on line 15a attributable to qualified disaster distributions,
      "form-8606.1.line.15b_qualified_disaster_distributions": 20000,
      // Line 15c — Taxable amount. Subtract line 15b from line 15a. Reduce that amount by certain
      "form-8606.1.line.15c_taxable_traditional_distributions": 10000,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 40000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 40000,
      // Line 4a — IRA distributions
      "form-1040.line.4a": 33000,
      // Line 4b — Taxable amount
      "form-1040.line.4b": 16667,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 56667,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 56667,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 56667,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 40917,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 4673,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 4673,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 4673,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 4673,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 3100,
      // Line 25b — Federal income tax withheld from Form(s) 1099
      "form-1040.line.25b": 3300,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 6400,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 6400,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 1727,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 1727,
    },
  },
};

export function sorileaExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
