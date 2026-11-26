/*
 * elza — LOCKED expected values, drafted from the engine's
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
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 190000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 190000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 190000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 190000,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 70000,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 6000,
      // Line 25 — Utilities
      "schedule-c.0.line.25": 4000,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 80000,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 110000,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 110000,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 110000,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 110000,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 101585,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 101585,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 101585,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 12597,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 2946,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 15543,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 7772,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": 102228,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": 102228,
      // Line 4 — Total qualified business income. Combine lines 2 and 3. If zero or less, enter -0
      "form-8995.0.line.4": 102228,
      // Line 5 — Qualified business income component. Multiply line 4 by 20% (0.20)
      "form-8995.0.line.5": 20446,
      // Line 10 — Qualified business income deduction before the income limitation. Add lines 5 an
      "form-8995.0.line.10": 20446,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 86478,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 86478,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 17296,
      // Line 15 — Qualified business income deduction. Enter the smaller of line 10 or line 14
      "form-8995.0.line.15": 17296,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 110000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 110000,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 7772,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 7772,
    },
  },
  "form-8697": {
    engineFields: {
      // Line 1 — Adjustment to regular taxable income to reflect the difference between: (a) the a
      "form-8697.1.part2.1_regular_taxable_income_adjustment_col_a": -20000,
      // Line 1 — Adjustment to regular taxable income to reflect the difference between: (a) the a
      "form-8697.1.part2.1_regular_taxable_income_adjustment_col_b": -30000,
      // Line 1 — Adjustment to regular taxable income to reflect the difference between: (a) the a
      "form-8697.1.part2.1_regular_taxable_income_adjustment_col_c": 6000,
      // Line 2 — Regular tax increase or decrease for prior years. Multiply line 1 in each column
      "form-8697.1.part2.2_regular_tax_increase_decrease_col_a": -7400,
      // Line 2 — Regular tax increase or decrease for prior years. Multiply line 1 in each column
      "form-8697.1.part2.2_regular_tax_increase_decrease_col_b": -11100,
      // Line 2 — Regular tax increase or decrease for prior years. Multiply line 1 in each column
      "form-8697.1.part2.2_regular_tax_increase_decrease_col_c": 2220,
      // Line 3 — Adjustment to alternative minimum taxable income (AMTI) to reflect the difference
      "form-8697.1.part2.3_amti_adjustment_col_a": -20000,
      // Line 3 — Adjustment to alternative minimum taxable income (AMTI) to reflect the difference
      "form-8697.1.part2.3_amti_adjustment_col_b": -30000,
      // Line 3 — Adjustment to alternative minimum taxable income (AMTI) to reflect the difference
      "form-8697.1.part2.3_amti_adjustment_col_c": 10000,
      // Line 4 — Alternative minimum tax (AMT) increase or decrease for prior years. Multiply line
      "form-8697.1.part2.4_amt_increase_decrease_col_a": -5600,
      // Line 4 — Alternative minimum tax (AMT) increase or decrease for prior years. Multiply line
      "form-8697.1.part2.4_amt_increase_decrease_col_b": -8400,
      // Line 4 — Alternative minimum tax (AMT) increase or decrease for prior years. Multiply line
      "form-8697.1.part2.4_amt_increase_decrease_col_c": 2800,
      // Line 5 — Enter the larger of line 2 or line 4 — column (a)
      "form-8697.1.part2.5_larger_of_line_2_or_4_col_a": -7400,
      // Line 5 — Enter the larger of line 2 or line 4 — column (b)
      "form-8697.1.part2.5_larger_of_line_2_or_4_col_b": -11100,
      // Line 5 — Enter the larger of line 2 or line 4 — column (c)
      "form-8697.1.part2.5_larger_of_line_2_or_4_col_c": 2800,
      // Line 6 — Overpayment ceiling. For each column in which line 5 is a negative number, enter
      "form-8697.1.part2.6_overpayment_ceiling_col_a": 5000,
      // Line 6 — Overpayment ceiling. For each column in which line 5 is a negative number, enter
      "form-8697.1.part2.6_overpayment_ceiling_col_b": 40000,
      // Line 7 — Increase or decrease in tax for the prior years on which interest is due (or is t
      "form-8697.1.part2.7_tax_increase_decrease_prior_years_col_a": -5000,
      // Line 7 — Increase or decrease in tax for the prior years on which interest is due (or is t
      "form-8697.1.part2.7_tax_increase_decrease_prior_years_col_b": -11100,
      // Line 7 — Increase or decrease in tax for the prior years on which interest is due (or is t
      "form-8697.1.part2.7_tax_increase_decrease_prior_years_col_c": 2800,
      // Line 8 — Interest due on increase, if any, shown on line 7 — column (c)
      "form-8697.1.part2.8_interest_due_on_increase_col_c": 425,
      // Line 8 — Interest due on increase, if any, shown on line 7 — column (d) Totals (add column
      "form-8697.1.part2.8_interest_due_on_increase_col_d": 425,
      // Line 9 — Interest to be refunded on decrease, if any, shown on line 7 — column (a)
      "form-8697.1.part2.9_interest_refunded_on_decrease_col_a": 1430,
      // Line 9 — Interest to be refunded on decrease, if any, shown on line 7 — column (b)
      "form-8697.1.part2.9_interest_refunded_on_decrease_col_b": 2615,
      // Line 9 — Interest to be refunded on decrease, if any, shown on line 7 — column (d) Totals
      "form-8697.1.part2.9_interest_refunded_on_decrease_col_d": 4045,
      // Line 10a — Net interest to be refunded to you. If line 9, column (d), is greater than line
      "form-8697.1.part2.10a_net_interest_refunded": 3620,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 15543,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 15543,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 110000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 110000,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 7772,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 102228,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 102228,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 17296,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 33046,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 69182,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 10133,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 10133,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 10133,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 15543,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 25676,
      // Line 37 — Amount you owe
      "form-1040.line.37": 25676,
    },
  },
};

export function elzaExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
