/*
 * elaida — LOCKED expected values, drafted from the engine's
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
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 900,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 900,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 900,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 900,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 720,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 720,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 180,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 180,
    },
  },
  "form-7203": {
    engineFields: {
      // Line 1 — Stock basis at the beginning of the corporation's tax year
      "form-7203.0.line.1_stock_basis_beginning": 20000,
      // Line 2 — Basis from any capital contributions made or additional stock acquired during the
      "form-7203.0.line.2_capital_contributions_additional_stock": 15000,
      // Line 5 — Stock basis before distributions. Add lines 1, 2, and 4
      "form-7203.0.line.5_stock_basis_before_distributions": 35000,
      // Line 6 — Distributions (excluding dividend distributions)
      "form-7203.0.line.6_distributions": 4000,
      // Line 7 — Stock basis after distributions. Subtract line 6 from line 5
      "form-7203.0.line.7_stock_basis_after_distributions": 31000,
      // Line 8a — Nondeductible expenses
      "form-7203.0.line.8a_nondeductible_expenses": 500,
      // Line 9 — Add lines 8a through 8c
      "form-7203.0.line.9_total_basis_decreases": 500,
      // Line 10 — Stock basis before loss and deduction items. Subtract line 9 from line 7
      "form-7203.0.line.10_stock_basis_before_loss_items": 30500,
      // Line 11 — Allowable loss and deduction items. Enter the amount from line 47, column (c)
      "form-7203.0.line.11_allowable_loss_deduction_items": 30500,
      // Line 14 — Add lines 11, 12, and 13
      "form-7203.0.line.14_total_loss_restoration_other": 30500,
      // Line 35 — Ordinary business loss — (a) Current year losses and deductions
      "form-7203.1.line.35_ordinary_business_loss_col_a": 60000,
      // Line 35 — Ordinary business loss — (c) Allowable loss from stock basis
      "form-7203.1.line.35_ordinary_business_loss_col_c": 29233,
      // Line 35 — Ordinary business loss — (e) Carryover amounts
      "form-7203.1.line.35_ordinary_business_loss_col_e": 30767,
      // Line 38 — Net capital loss — (a) Current year losses and deductions
      "form-7203.1.line.38_net_capital_loss_col_a": 1500,
      // Line 38 — Net capital loss — (c) Allowable loss from stock basis
      "form-7203.1.line.38_net_capital_loss_col_c": 731,
      // Line 38 — Net capital loss — (e) Carryover amounts
      "form-7203.1.line.38_net_capital_loss_col_e": 769,
      // Line 42 — Charitable contributions — (a) Current year losses and deductions
      "form-7203.1.line.42_charitable_contributions_col_a": 1100,
      // Line 42 — Charitable contributions — (c) Allowable loss from stock basis
      "form-7203.1.line.42_charitable_contributions_col_c": 536,
      // Line 42 — Charitable contributions — (e) Carryover amounts
      "form-7203.1.line.42_charitable_contributions_col_e": 564,
      // Line 47 — Total loss. Add lines 35 through 46 for each column — (a) Current year losses an
      "form-7203.1.line.47_total_loss_col_a": 62600,
      // Line 47 — Total loss. Add lines 35 through 46 for each column — (c) Allowable loss from st
      "form-7203.1.line.47_total_loss_col_c": 30500,
      // Line 47 — Total loss. Add lines 35 through 46 for each column — (e) Carryover amounts
      "form-7203.1.line.47_total_loss_col_e": 32100,
    },
  },
  "schedule-e": {
    engineFields: {
      // Line 28 row A — (i) Nonpassive loss allowed (see Schedule K-1)
      "schedule-e.1.line.28_row_a_col_i_nonpassive_loss_allowed": 29233,
      // Line 29b — Totals, column (i) nonpassive loss allowed
      "schedule-e.1.line.29b_totals_col_i": 29233,
      // Line 31 — Add columns (g), (i), and (j) of line 29b
      "schedule-e.1.line.31_add_loss_columns": 29233,
      // Line 32 — Total partnership and S corporation income or (loss). Combine lines 30 and 31
      "schedule-e.1.line.32_total_partnership_s_corp_income": -29233,
      // Line 41 — Total income or (loss). Combine lines 26, 32, 37, 39, and 40
      "schedule-e.1.line.41_total_income_or_loss": -29233,
    },
  },
  "schedule-d": {
    engineFields: {
      // Line 12 — Net long-term gain or (loss) from partnerships, S corporations, estates, and tru
      "schedule-d.0.line.12_net_long_term_passthrough": -731,
      // Line 15 — Net long-term capital gain or (loss). Combine lines 8a through 14 in column (h)
      "schedule-d.0.line.15_net_long_term_gain_loss": -731,
      // Line 16 — Combine lines 7 and 15 and enter the result
      "schedule-d.1.line.16_combined_gain_loss": -731,
      // Line 21 — If line 16 is a loss, enter here and on Form 1040, 1040-SR, or 1040-NR, line 7a,
      "schedule-d.1.line.21_allowable_loss": 731,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": 180,
      // Line 1ii — (c) Qualified business income or (loss)
      "form-8995.0.line.1ii_c": 220,
      // Line 1iii — (c) Qualified business income or (loss)
      "form-8995.0.line.1iii_c": -29233,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": -28833,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": -21064,
      // Line 16 — Total qualified business (loss) carryforward. Combine lines 2 and 3. If greater
      "form-8995.0.line.16": 28833,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 400,
      // Line 5 — Rental real estate, royalties, partnerships, S corporations, trusts, etc. Attach
      "schedule-1.0.line.5": -29233,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": -28833,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 40000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 40000,
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": -731,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": -28833,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 10436,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 10436,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 10436,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 31500,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 31500,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 2400,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 2400,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 2400,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 2400,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 2400,
    },
  },
};

export function elaidaExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
