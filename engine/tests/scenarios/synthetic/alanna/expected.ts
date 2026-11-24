/*
 * alanna — LOCKED expected values, drafted from the engine's
 * output on 2026-11-24 (scripts/draftExpected.ts).
 *
 * UNVERIFIED: no CPA return or filed-return check stands behind these
 * values. They are engine output, checked by hand, so a failure means
 * "the engine changed", not "the engine is wrong".
 *
 * Every value checked by hand against README.md ("Hand check"). This file
 * checks the first Form 4797; the second copy (the skid steer in Part III
 * column A) is checked in tests/unit/federal/4797/copies.test.ts.
 *
 * Edit by hand. Change a value only after you verify it against the form
 * instructions or a filed return (scripts/compareFiled).
 */

import type { ExpectedResults } from "../../../types.js";

const EXPECTED: Record<string, Partial<ExpectedResults>> = {
  "form-4797": {
    engineFields: {
      // Line 10, row 1 — (e) Depreciation allowed or allowable since acquisition
      "form-4797.0.line.10_row1_col_e": 1224,
      // Line 10, row 1 — (f) Cost or other basis, plus improvements and expense of sale
      "form-4797.0.line.10_row1_col_f": 1800,
      // Line 10, row 1 — (g) Gain or (loss). Subtract (f) from the sum of (d) and (e)
      "form-4797.0.line.10_row1_col_g": -576,
      // Line 10, row 2 — (e) Depreciation allowed or allowable since acquisition
      "form-4797.0.line.10_row2_col_e": 576,
      // Line 10, row 2 — (f) Cost or other basis, plus improvements and expense of sale
      "form-4797.0.line.10_row2_col_f": 1200,
      // Line 10, row 2 — (g) Gain or (loss). Subtract (f) from the sum of (d) and (e)
      "form-4797.0.line.10_row2_col_g": -624,
      // Line 13 — Gain, if any, from line 31
      "form-4797.0.line.13_gain_from_line_31": 40800,
      // Line 17 — Combine lines 10 through 16
      "form-4797.0.line.17_ordinary_gain_loss_total": 39600,
      // Line 18b — Redetermine the gain or (loss) on line 17 excluding the loss, if any, on line 1
      "form-4797.0.line.18b_redetermined_ordinary_gain_loss": 39600,
      // Line 20 — Gross sales price — Property A
      "form-4797.1.line.20_gross_sales_price_col_a": 6500,
      // Line 20 — Gross sales price — Property B
      "form-4797.1.line.20_gross_sales_price_col_b": 6000,
      // Line 20 — Gross sales price — Property C
      "form-4797.1.line.20_gross_sales_price_col_c": 2400,
      // Line 20 — Gross sales price — Property D
      "form-4797.1.line.20_gross_sales_price_col_d": 3100,
      // Line 21 — Cost or other basis plus expense of sale — Property A
      "form-4797.1.line.21_cost_basis_plus_expense_col_a": 14000,
      // Line 21 — Cost or other basis plus expense of sale — Property B
      "form-4797.1.line.21_cost_basis_plus_expense_col_b": 14000,
      // Line 21 — Cost or other basis plus expense of sale — Property C
      "form-4797.1.line.21_cost_basis_plus_expense_col_c": 5000,
      // Line 21 — Cost or other basis plus expense of sale — Property D
      "form-4797.1.line.21_cost_basis_plus_expense_col_d": 8000,
      // Line 22 — Depreciation (or depletion) allowed or allowable — Property A
      "form-4797.1.line.22_depreciation_allowed_col_a": 11200,
      // Line 22 — Depreciation (or depletion) allowed or allowable — Property B
      "form-4797.1.line.22_depreciation_allowed_col_b": 11200,
      // Line 22 — Depreciation (or depletion) allowed or allowable — Property C
      "form-4797.1.line.22_depreciation_allowed_col_c": 5000,
      // Line 22 — Depreciation (or depletion) allowed or allowable — Property D
      "form-4797.1.line.22_depreciation_allowed_col_d": 6400,
      // Line 23 — Adjusted basis. Subtract line 22 from line 21 — Property A
      "form-4797.1.line.23_adjusted_basis_col_a": 2800,
      // Line 23 — Adjusted basis. Subtract line 22 from line 21 — Property B
      "form-4797.1.line.23_adjusted_basis_col_b": 2800,
      // Line 23 — Adjusted basis. Subtract line 22 from line 21 — Property D
      "form-4797.1.line.23_adjusted_basis_col_d": 1600,
      // Line 24 — Total gain. Subtract line 23 from line 20 — Property A
      "form-4797.1.line.24_total_gain_col_a": 3700,
      // Line 24 — Total gain. Subtract line 23 from line 20 — Property B
      "form-4797.1.line.24_total_gain_col_b": 3200,
      // Line 24 — Total gain. Subtract line 23 from line 20 — Property C
      "form-4797.1.line.24_total_gain_col_c": 2400,
      // Line 24 — Total gain. Subtract line 23 from line 20 — Property D
      "form-4797.1.line.24_total_gain_col_d": 1500,
      // Line 25a — If section 1245 property: Depreciation allowed or allowable from line 22 — Prop
      "form-4797.1.line.25a_sec_1245_depreciation_col_a": 11200,
      // Line 25a — If section 1245 property: Depreciation allowed or allowable from line 22 — Prop
      "form-4797.1.line.25a_sec_1245_depreciation_col_b": 11200,
      // Line 25a — If section 1245 property: Depreciation allowed or allowable from line 22 — Prop
      "form-4797.1.line.25a_sec_1245_depreciation_col_c": 5000,
      // Line 25a — If section 1245 property: Depreciation allowed or allowable from line 22 — Prop
      "form-4797.1.line.25a_sec_1245_depreciation_col_d": 6400,
      // Line 25b — If section 1245 property: Enter the smaller of line 24 or 25a — Property A
      "form-4797.1.line.25b_sec_1245_smaller_amount_col_a": 3700,
      // Line 25b — If section 1245 property: Enter the smaller of line 24 or 25a — Property B
      "form-4797.1.line.25b_sec_1245_smaller_amount_col_b": 3200,
      // Line 25b — If section 1245 property: Enter the smaller of line 24 or 25a — Property C
      "form-4797.1.line.25b_sec_1245_smaller_amount_col_c": 2400,
      // Line 25b — If section 1245 property: Enter the smaller of line 24 or 25a — Property D
      "form-4797.1.line.25b_sec_1245_smaller_amount_col_d": 1500,
      // Line 30 — Total gains for all properties. Add property columns A through D, line 24
      "form-4797.1.line.30_total_gains_all_properties": 40800,
      // Line 31 — Add property columns A through D, lines 25b, 26g, 27c, 28b, and 29b
      "form-4797.1.line.31_total_recapture_amounts": 40800,
      // Line 32 — 40,800 − 40,800: every gain is recapture, so line 6 is blank (verified zero).
      "form-4797.1.line.32_gain_less_recapture": 0,
      // Line 23, property C — the trailer is fully depreciated: 5,000 − 5,000 (verified zero).
      "form-4797.1.line.23_adjusted_basis_col_c": 0,
    },
  },
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 96000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 96000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 96000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 96000,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 14000,
      // Line 13 — Depreciation and section 179 expense deduction (not included in Part III)
      "schedule-c.0.line.13": 6000,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 3600,
      // Line 25 — Utilities
      "schedule-c.0.line.25": 2400,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 26000,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 70000,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 70000,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 70000,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 70000,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 64645,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 64645,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 64645,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 8016,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 1875,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 9891,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 4946,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": 104654,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": 104654,
      // Line 4 — Total qualified business income. Combine lines 2 and 3. If zero or less, enter -0
      "form-8995.0.line.4": 104654,
      // Line 5 — Qualified business income component. Multiply line 4 by 20% (0.20)
      "form-8995.0.line.5": 20931,
      // Line 10 — Qualified business income deduction before the income limitation. Add lines 5 an
      "form-8995.0.line.10": 20931,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 88904,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 88904,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 17781,
      // Line 15 — Qualified business income deduction. Enter the smaller of line 10 or line 14
      "form-8995.0.line.15": 17781,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 70000,
      // Line 4 — Other gains or (losses)
      "schedule-1.0.line.4": 39600,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 109600,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 4946,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 4946,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 9891,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 9891,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 109600,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 109600,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 4946,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 104654,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 104654,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 17781,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 33531,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 71123,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 10562,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 10562,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 10562,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 9891,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 20453,
      // Line 37 — Amount you owe
      "form-1040.line.37": 20453,
    },
  },
};

export function alannaExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
