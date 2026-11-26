/*
 * dagdara — LOCKED expected values, drafted from the engine's
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
      "schedule-c.0.line.1": 285000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 285000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 285000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 285000,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 110000,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 9000,
      // Line 25 — Utilities
      "schedule-c.0.line.25": 6000,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 125000,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 160000,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 160000,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 160000,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 160000,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 147760,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 147760,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 147760,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 18322,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 4285,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 22607,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 11304,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": 148696,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": 148696,
      // Line 4 — Total qualified business income. Combine lines 2 and 3. If zero or less, enter -0
      "form-8995.0.line.4": 148696,
      // Line 5 — Qualified business income component. Multiply line 4 by 20% (0.20)
      "form-8995.0.line.5": 29739,
      // Line 10 — Qualified business income deduction before the income limitation. Add lines 5 an
      "form-8995.0.line.10": 29739,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 132946,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 132946,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 26589,
      // Line 15 — Qualified business income deduction. Enter the smaller of line 10 or line 14
      "form-8995.0.line.15": 26589,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 160000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 160000,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 11304,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 11304,
    },
  },
  "form-8697": {
    engineFields: {
      // Line 1 — Taxable income or loss for the prior years shown on tax return (or as previously
      "form-8697.0.part1.1_prior_year_taxable_income_filing_year": 106357,
      // Line 1 — Taxable income or loss for the prior years shown on tax return (or as previously
      "form-8697.0.part1.1_prior_year_taxable_income_col_a": 120000,
      // Line 1 — Taxable income or loss for the prior years shown on tax return (or as previously
      "form-8697.0.part1.1_prior_year_taxable_income_col_b": 135000,
      // Line 2 — Adjustment to income to reflect the difference between: (a) the amount of income
      "form-8697.0.part1.2_adjustment_to_income_filing_year": -25000,
      // Line 2 — Adjustment to income to reflect the difference between: (a) the amount of income
      "form-8697.0.part1.2_adjustment_to_income_col_a": 40000,
      // Line 2 — Adjustment to income to reflect the difference between: (a) the amount of income
      "form-8697.0.part1.2_adjustment_to_income_col_b": -15000,
      // Line 2 — Adjustment to income to reflect the difference between: (a) the amount of income
      "form-8697.0.part1.2_adjustment_to_income_col_c": 25000,
      // Line 3 — Adjusted taxable income for look-back purposes. Combine lines 1 and 2 — Filing ye
      "form-8697.0.part1.3_adjusted_taxable_income_filing_year": 81357,
      // Line 3 — Adjusted taxable income for look-back purposes. Combine lines 1 and 2 — column (a
      "form-8697.0.part1.3_adjusted_taxable_income_col_a": 160000,
      // Line 3 — Adjusted taxable income for look-back purposes. Combine lines 1 and 2 — column (b
      "form-8697.0.part1.3_adjusted_taxable_income_col_b": 120000,
      // Line 4 — Income tax liability on line 3 amount using tax rates in effect for the prior yea
      "form-8697.0.part1.4_tax_on_line_3_filing_year": 12817,
      // Line 4 — Income tax liability on line 3 amount using tax rates in effect for the prior yea
      "form-8697.0.part1.4_tax_on_line_3_col_a": 31800,
      // Line 4 — Income tax liability on line 3 amount using tax rates in effect for the prior yea
      "form-8697.0.part1.4_tax_on_line_3_col_b": 21843,
      // Line 5 — Income tax liability shown on return (or as previously adjusted) for the prior ye
      "form-8697.0.part1.5_tax_shown_on_return_col_a": 22200,
      // Line 5 — Income tax liability shown on return (or as previously adjusted) for the prior ye
      "form-8697.0.part1.5_tax_shown_on_return_col_b": 25443,
      // Line 6 — Increase or decrease in tax for the prior years on which interest is due (or is t
      "form-8697.0.part1.6_increase_or_decrease_in_tax_col_a": 9600,
      // Line 6 — Increase or decrease in tax for the prior years on which interest is due (or is t
      "form-8697.0.part1.6_increase_or_decrease_in_tax_col_b": -3600,
      // Line 7 — Interest due on increase, if any, shown on line 6 — column (a)
      "form-8697.0.part1.7_interest_due_on_increase_col_a": 1552,
      // Line 7 — Interest due on increase, if any, shown on line 6 — column (c) Totals
      "form-8697.0.part1.7_interest_due_on_increase_col_c": 1552,
      // Line 8 — Interest to be refunded on decrease, if any, shown on line 6 — column (b)
      "form-8697.0.part1.8_interest_refunded_on_decrease_col_b": 261,
      // Line 8 — Interest to be refunded on decrease, if any, shown on line 6 — column (c) Totals
      "form-8697.0.part1.8_interest_refunded_on_decrease_col_c": 261,
      // Line 10 — Net interest you owe. If line 7, column (c), is greater than line 8, column (c),
      "form-8697.0.part1.10_net_interest_owed": 1291,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 22607,
      // Line 17n — Look-back interest under section 167(g) or 460(b) from Form 8697 or 8866
      "schedule-2.1.line.17n_lookback_interest_section_167g_460b": 1291,
      // Line 18 — Total additional taxes. Add lines 17a through 17z
      "schedule-2.1.line.18_total_additional_taxes": 1291,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 23898,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 160000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 160000,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 11304,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 148696,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 148696,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 26589,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 42339,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 106357,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 18373,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 18373,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 18373,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 23898,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 42271,
      // Line 37 — Amount you owe
      "form-1040.line.37": 42271,
    },
  },
};

export function dagdaraExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
