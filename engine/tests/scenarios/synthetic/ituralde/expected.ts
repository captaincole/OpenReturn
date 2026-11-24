/*
 * ituralde — LOCKED expected values, drafted from the engine's
 * output on 2026-11-24 (scripts/draftExpected.ts).
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
  "form-6198": {
    engineFields: {
      // Line 1 — Ordinary income (loss) from the activity
      "form-6198.0.line.1_ordinary_income_loss": -46000,
      // Line 5 — Current year profit (loss) from the activity. Combine lines 1 through 4
      "form-6198.0.line.5_current_year_profit_loss": -46000,
      // Line 16 — Increases since effective date or the end of your prior year
      "form-6198.0.line.16_increases_since": 30000,
      // Line 17 — Add lines 15 and 16
      "form-6198.0.line.17_add_lines_15_16": 30000,
      // Line 18 — Decreases since effective date or the end of your prior year
      "form-6198.0.line.18_decreases_since": 2000,
      // Line 19a — Subtract line 18 from line 17
      "form-6198.0.line.19a_subtract_line_18_from_17": 28000,
      // Line 19b — If line 19a is more than zero, enter that amount here. Otherwise, enter -0-
      "form-6198.0.line.19b_detailed_amount_at_risk": 28000,
      // Line 20 — Amount at risk. Enter the larger of line 10b or line 19b
      "form-6198.0.line.20_amount_at_risk": 28000,
      // Line 21 — Deductible loss. Enter the smaller of the line 5 loss (treated as a positive num
      "form-6198.0.line.21_deductible_loss": 28000,
    },
    // MANUAL EDIT: the first copy (the K-1) starts Part III from last year's form: boxes 15b, 16b, 18b.
    renderedChecked: [
      "form-6198.0.line.15b_from_prior_year_checkbox",
      "form-6198.0.line.16b_increases_since_prior_year_end_checkbox",
      "form-6198.0.line.18b_decreases_since_prior_year_end_checkbox",
    ],
  },
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 18000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 18000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 18000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 18000,
      // Line 20a — Rent or lease: Vehicles, machinery, and equipment
      "schedule-c.0.line.20a": 9000,
      // Line 11 — Contract labor
      "schedule-c.0.line.11": 21000,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 4000,
      // Line 24a — Travel and meals: Travel
      "schedule-c.0.line.24a": 6000,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 2000,
      // Line 17 — Legal and professional services
      "schedule-c.0.line.17": 3000,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 45000,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": -27000,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": -10000,
    },
    // MANUAL EDIT: box 32b, some investment is not at risk.
    renderedChecked: ["schedule-c.0.line.32b"],
  },
  "schedule-e": {
    engineFields: {
      // Line 28 row A — (i) Nonpassive loss allowed (see Schedule K-1)
      "schedule-e.1.line.28_row_a_col_i_nonpassive_loss_allowed": 24348,
      // Line 28 row B — (i) Nonpassive loss allowed (see Schedule K-1)
      "schedule-e.1.line.28_row_b_col_i_nonpassive_loss_allowed": 3652,
      // Line 29b — Totals, column (i) nonpassive loss allowed
      "schedule-e.1.line.29b_totals_col_i": 28000,
      // Line 31 — Add columns (g), (i), and (j) of line 29b
      "schedule-e.1.line.31_add_loss_columns": 28000,
      // Line 32 — Total partnership and S corporation income or (loss). Combine lines 30 and 31
      "schedule-e.1.line.32_total_partnership_s_corp_income": -28000,
      // Line 41 — Total income or (loss). Combine lines 26, 32, 37, 39, and 40
      "schedule-e.1.line.41_total_income_or_loss": -28000,
    },
    // MANUAL EDIT: line 27 Yes (the allowed carried at-risk loss) and column (f), amounts not at risk.
    renderedChecked: [
      "schedule-e.1.line.27_yes",
      "schedule-e.1.line.28_row_a_col_f_amount_not_at_risk",
    ],
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": -10000,
      // Line 5 — Rental real estate, royalties, partnerships, S corporations, trusts, etc. Attach
      "schedule-1.0.line.5": -28000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": -38000,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": -10000,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": -10000,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 96670,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 96670,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 19334,
      // Line 16 — Total qualified business (loss) carryforward. Combine lines 2 and 3. If greater
      "form-8995.0.line.16": 10000,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 150000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 150000,
      // Line 2b — Taxable interest
      "form-1040.line.2b": 420,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": -38000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 112420,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 112420,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 112420,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 96670,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 16183,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 16183,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 16183,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 16183,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 26000,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 26000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 26000,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 9817,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 9817,
    },
  },
};

export function ituraldeExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
