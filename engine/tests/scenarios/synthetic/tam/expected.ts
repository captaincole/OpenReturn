/*
 * tam — LOCKED expected values, drafted from the engine's
 * output on 2026-11-23 (scripts/draftExpected.ts).
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
  "schedule-b": {
    engineFields: {
      // Line 1 — Amount (row 1)
      "schedule-b.0.line.1_amount_1": 1200,
      // Line 2 — Add the amounts on line 1
      "schedule-b.0.line.2_total_interest": 1200,
      // Line 4 — Subtract line 3 from line 2. Enter the result here and on Form 1040 or 1040-SR, l
      "schedule-b.0.line.4_taxable_interest": 1200,
      // Line 5 — Amount (row 1)
      "schedule-b.0.line.5_amount_1": 3000,
      // Line 6 — Add the amounts on line 5. Enter the total here and on Form 1040 or 1040-SR, line
      "schedule-b.0.line.6_total_ordinary_dividends": 3000,
    },
  },
  "schedule-d": {
    engineFields: {
      // Line 12 — Net long-term gain or (loss) from partnerships, S corporations, estates, and tru
      "schedule-d.0.line.12_net_long_term_passthrough": 6000,
      // Line 15 — Net long-term capital gain or (loss). Combine lines 8a through 14 in column (h)
      "schedule-d.0.line.15_net_long_term_gain_loss": 6000,
      // Line 16 — Combine lines 7 and 15 and enter the result
      "schedule-d.1.line.16_combined_gain_loss": 6000,
    },
  },
  "schedule-e": {
    engineFields: {
      // Line 28 row A — (h) Passive income from Schedule K-1
      "schedule-e.1.line.28_row_a_col_h_passive_income": 40000,
      // Line 29a — Totals, column (h) passive income
      "schedule-e.1.line.29a_totals_col_h": 40000,
      // Line 30 — Add columns (h) and (k) of line 29a
      "schedule-e.1.line.30_add_income_columns": 40000,
      // Line 32 — Total partnership and S corporation income or (loss). Combine lines 30 and 31
      "schedule-e.1.line.32_total_partnership_s_corp_income": 40000,
      // Line 41 — Total income or (loss). Combine lines 26, 32, 37, 39, and 40
      "schedule-e.1.line.41_total_income_or_loss": 40000,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": 40000,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": 40000,
      // Line 4 — Total qualified business income. Combine lines 2 and 3. If zero or less, enter -0
      "form-8995.0.line.4": 40000,
      // Line 5 — Qualified business income component. Multiply line 4 by 20% (0.20)
      "form-8995.0.line.5": 8000,
      // Line 10 — Qualified business income deduction before the income limitation. Add lines 5 an
      "form-8995.0.line.10": 8000,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 258700,
      // Line 12 — Enter your net capital gain, if any, increased by any qualified dividends
      "form-8995.0.line.12": 8000,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 250700,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 50140,
      // Line 15 — Qualified business income deduction. Enter the smaller of line 10 or line 14
      "form-8995.0.line.15": 8000,
    },
  },
  "form-8960": {
    engineFields: {
      // Line 1 — Taxable interest (see instructions)
      "form-8960.0.line.1": 1200,
      // Line 2 — Ordinary dividends (see instructions)
      "form-8960.0.line.2": 3000,
      // Line 4a — Rental real estate, royalties, partnerships, S corporations, trusts, trades or b
      "form-8960.0.line.4a": 40000,
      // Line 4c — Combine lines 4a and 4b
      "form-8960.0.line.4c": 40000,
      // Line 5a — Net gain or loss from disposition of property (see instructions)
      "form-8960.0.line.5a": 6000,
      // Line 5d — Combine lines 5a through 5c
      "form-8960.0.line.5d": 6000,
      // Line 8 — Total investment income. Combine lines 1, 2, 3, 4c, 5d, 6, and 7
      "form-8960.0.line.8": 50200,
      // Line 12 — Net investment income. Subtract Part II, line 11, from Part I, line 8. If zero o
      "form-8960.0.line.12": 50200,
      // Line 13 — Modified adjusted gross income (see instructions)
      "form-8960.0.line.13": 290200,
      // Line 14 — Threshold based on filing status (see instructions)
      "form-8960.0.line.14": 250000,
      // Line 15 — Subtract line 14 from line 13. If zero or less, enter -0-
      "form-8960.0.line.15": 40200,
      // Line 16 — Enter the smaller of line 12 or line 15
      "form-8960.0.line.16": 40200,
      // Line 17 — Net investment income tax for individuals. Multiply line 16 by 3.8% (0.038)
      "form-8960.0.line.17": 1528,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 5 — Rental real estate, royalties, partnerships, S corporations, trusts, etc. Attach
      "schedule-1.0.line.5": 40000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 40000,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 12 — Net investment income tax. Attach Form 8960
      "schedule-2.0.line.12_net_investment_income_tax": 1528,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 1528,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 240000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 240000,
      // Line 2a — Tax-exempt interest
      "form-1040.line.2a": 500,
      // Line 2b — Taxable interest
      "form-1040.line.2b": 1200,
      // Line 3a — Qualified dividends
      "form-1040.line.3a": 2000,
      // Line 3b — Ordinary dividends
      "form-1040.line.3b": 3000,
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": 6000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 40000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 290200,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 290200,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 290200,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 31500,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 8000,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 39500,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 250700,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 45142,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 45142,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 45142,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 1528,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 46670,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 48000,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 48000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 48000,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 1330,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 1330,
    },
  },
};

export function tamExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
