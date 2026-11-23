/*
 * bayle — LOCKED expected values, drafted from the engine's
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
  "form-8949": {
    engineFields: {
      // Row 1 — (d) Proceeds (sales price)
      "form-8949.1.part2.row1_proceeds": 18000,
      // Row 1 — (e) Cost or other basis
      "form-8949.1.part2.row1_cost_basis": 14000,
      // Row 1 — (h) Gain or (loss)
      "form-8949.1.part2.row1_gain_loss": 4000,
      // Line 2 Totals — (d) Proceeds (sales price)
      "form-8949.1.part2.totals_proceeds": 18000,
      // Line 2 Totals — (e) Cost or other basis
      "form-8949.1.part2.totals_cost_basis": 14000,
      // Line 2 Totals — (h) Gain or (loss)
      "form-8949.1.part2.totals_gain_loss": 4000,
    },
  },
  "schedule-d": {
    engineFields: {
      // Line 10 — Proceeds (sales price) — Totals for all transactions reported on Form(s) 8949 wi
      "schedule-d.0.line.10_proceeds": 18000,
      // Line 10 — Cost (or other basis) — Totals for all transactions reported on Form(s) 8949 wit
      "schedule-d.0.line.10_cost": 14000,
      // Line 10 — Gain or (loss) — Totals for all transactions reported on Form(s) 8949 with Box F
      "schedule-d.0.line.10_gain_loss": 4000,
      // Line 15 — Net long-term capital gain or (loss). Combine lines 8a through 14 in column (h)
      "schedule-d.0.line.15_net_long_term_gain_loss": 4000,
      // Line 16 — Combine lines 7 and 15 and enter the result
      "schedule-d.1.line.16_combined_gain_loss": 4000,
    },
  },
  "schedule-e": {
    engineFields: {
      // Line 28 row A — (i) Nonpassive loss allowed (see Schedule K-1)
      "schedule-e.1.line.28_row_a_col_i_nonpassive_loss_allowed": 15000,
      // Line 29b — Totals, column (i) nonpassive loss allowed
      "schedule-e.1.line.29b_totals_col_i": 15000,
      // Line 31 — Add columns (g), (i), and (j) of line 29b
      "schedule-e.1.line.31_add_loss_columns": 15000,
      // Line 32 — Total partnership and S corporation income or (loss). Combine lines 30 and 31
      "schedule-e.1.line.32_total_partnership_s_corp_income": -15000,
      // Line 41 — Total income or (loss). Combine lines 26, 32, 37, 39, and 40
      "schedule-e.1.line.41_total_income_or_loss": -15000,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 5 — Rental real estate, royalties, partnerships, S corporations, trusts, etc. Attach
      "schedule-1.0.line.5": -15000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": -15000,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 95000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 95000,
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": 4000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": -15000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 84000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 84000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 84000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 68250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 9655,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 9655,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 9655,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 9655,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 11000,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 11000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 11000,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 1345,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 1345,
    },
  },
};

export function bayleExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
