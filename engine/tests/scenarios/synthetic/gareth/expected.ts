/*
 * gareth — LOCKED expected values, drafted from the engine's
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
  "form-7203": {
    engineFields: {
      // Line 3a — Ordinary business income (enter losses in Part III)
      "form-7203.0.line.3a_ordinary_business_income": 45000,
      // Line 3d — Interest income
      "form-7203.0.line.3d_interest_income": 300,
      // Line 4 — Add lines 3a through 3m
      "form-7203.0.line.4_total_basis_increases": 45300,
      // Line 5 — Stock basis before distributions. Add lines 1, 2, and 4
      "form-7203.0.line.5_stock_basis_before_distributions": 45300,
      // Line 6 — Distributions (excluding dividend distributions)
      "form-7203.0.line.6_distributions": 20000,
      // Line 7 — Stock basis after distributions. Subtract line 6 from line 5
      "form-7203.0.line.7_stock_basis_after_distributions": 25300,
      // Line 10 — Stock basis before loss and deduction items. Subtract line 9 from line 7
      "form-7203.0.line.10_stock_basis_before_loss_items": 25300,
      // Line 11 — Allowable loss and deduction items. Enter the amount from line 47, column (c)
      "form-7203.0.line.11_allowable_loss_deduction_items": 13400,
      // Line 14 — Add lines 11, 12, and 13
      "form-7203.0.line.14_total_loss_restoration_other": 13400,
      // Line 15 — Stock basis at the end of the corporation's tax year. Subtract line 14 from line
      "form-7203.0.line.15_stock_basis_end": 11900,
      // Line 35 — Ordinary business loss — (b) Carryover amounts (column (e)) from the previous ye
      "form-7203.1.line.35_ordinary_business_loss_col_b": 12000,
      // Line 35 — Ordinary business loss — (c) Allowable loss from stock basis
      "form-7203.1.line.35_ordinary_business_loss_col_c": 12000,
      // Line 42 — Charitable contributions — (a) Current year losses and deductions
      "form-7203.1.line.42_charitable_contributions_col_a": 800,
      // Line 42 — Charitable contributions — (b) Carryover amounts (column (e)) from the previous
      "form-7203.1.line.42_charitable_contributions_col_b": 600,
      // Line 42 — Charitable contributions — (c) Allowable loss from stock basis
      "form-7203.1.line.42_charitable_contributions_col_c": 1400,
      // Line 47 — Total loss. Add lines 35 through 46 for each column — (a) Current year losses an
      "form-7203.1.line.47_total_loss_col_a": 800,
      // Line 47 — Total loss. Add lines 35 through 46 for each column — (b) Carryover amounts (col
      "form-7203.1.line.47_total_loss_col_b": 12600,
      // Line 47 — Total loss. Add lines 35 through 46 for each column — (c) Allowable loss from st
      "form-7203.1.line.47_total_loss_col_c": 13400,
    },
  },
  "schedule-e": {
    engineFields: {
      // Line 28 row A — (k) Nonpassive income from Schedule K-1
      "schedule-e.1.line.28_row_a_col_k_nonpassive_income": 45000,
      // Line 28 row B — (i) Nonpassive loss allowed (see Schedule K-1)
      "schedule-e.1.line.28_row_b_col_i_nonpassive_loss_allowed": 12000,
      // Line 29a — Totals, column (k) nonpassive income
      "schedule-e.1.line.29a_totals_col_k": 45000,
      // Line 29b — Totals, column (i) nonpassive loss allowed
      "schedule-e.1.line.29b_totals_col_i": 12000,
      // Line 30 — Add columns (h) and (k) of line 29a
      "schedule-e.1.line.30_add_income_columns": 45000,
      // Line 31 — Add columns (g), (i), and (j) of line 29b
      "schedule-e.1.line.31_add_loss_columns": 12000,
      // Line 32 — Total partnership and S corporation income or (loss). Combine lines 30 and 31
      "schedule-e.1.line.32_total_partnership_s_corp_income": 33000,
      // Line 41 — Total income or (loss). Combine lines 26, 32, 37, 39, and 40
      "schedule-e.1.line.41_total_income_or_loss": 33000,
    },
  },
  "schedule-a": {
    engineFields: {
      // Line 2 — Enter amount from Form 1040 or 1040-SR, line 11b
      "schedule-a.0.line.2_agi_from_1040": 123300,
      // Line 3 — Multiply line 2 by 7.5% (0.075)
      "schedule-a.0.line.3_agi_multiplied": 9248,
      // Line 5b — State and local real estate taxes (see instructions)
      "schedule-a.0.line.5b_real_estate_taxes": 6000,
      // Line 5d — Add lines 5a through 5c
      "schedule-a.0.line.5d_total_state_local_taxes": 6000,
      // Line 5e — Enter the smaller of line 5d or $40,000 ($20,000 if married filing separately)
      "schedule-a.0.line.5e_salt_cap": 6000,
      // Line 7 — Add lines 5e and 6
      "schedule-a.0.line.7_total_taxes": 6000,
      // Line 8a — Home mortgage interest and points reported to you on Form 1098
      "schedule-a.0.line.8a_mortgage_interest_form1098": 24000,
      // Line 8e — Add lines 8a through 8c
      "schedule-a.0.line.8e_total_mortgage_interest_points": 24000,
      // Line 10 — Add lines 8e and 9
      "schedule-a.0.line.10_total_interest": 24000,
      // Line 11 — Gifts by cash or check
      "schedule-a.0.line.11_gifts_cash_check": 3400,
      // Line 14 — Add lines 11 through 13
      "schedule-a.0.line.14_total_gifts": 3400,
      // Line 17 — Total Itemized Deductions. Add the amounts in the far right column for lines 4 t
      "schedule-a.0.line.17_total_itemized_deductions": 33400,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": 45000,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": 45000,
      // Line 3 — Qualified business net (loss) carryforward from the prior year
      "form-8995.0.line.3": 12000,
      // Line 4 — Total qualified business income. Combine lines 2 and 3. If zero or less, enter -0
      "form-8995.0.line.4": 33000,
      // Line 5 — Qualified business income component. Multiply line 4 by 20% (0.20)
      "form-8995.0.line.5": 6600,
      // Line 10 — Qualified business income deduction before the income limitation. Add lines 5 an
      "form-8995.0.line.10": 6600,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 89900,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 89900,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 17980,
      // Line 15 — Qualified business income deduction. Enter the smaller of line 10 or line 14
      "form-8995.0.line.15": 6600,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 5 — Rental real estate, royalties, partnerships, S corporations, trusts, etc. Attach
      "schedule-1.0.line.5": 33000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 33000,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 90000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 90000,
      // Line 2b — Taxable interest
      "form-1040.line.2b": 300,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 33000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 123300,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 123300,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 123300,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 33400,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 6600,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 40000,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 83300,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 9522,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 9522,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 9522,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 9522,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 9800,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 9800,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 9800,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 278,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 278,
    },
  },
};

export function garethExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
