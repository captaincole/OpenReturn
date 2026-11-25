/*
 * berelain — LOCKED expected values, drafted from the engine's
 * output on 2026-11-24 (scripts/draftExpected.ts).
 *
 * UNVERIFIED: no CPA return or filed-return check stands behind these
 * values. They are engine output, checked by hand, so a failure means
 * "the engine changed", not "the engine is wrong".
 *
 * 2026-11-24: Form 8995 and Form 1040 lines 13a to 37 changed by hand when
 * QBI took the shop's Form 4797 ordinary gain (README, "Hand check").
 *
 * Edit by hand. Change a value only after you verify it against the form
 * instructions or a filed return (scripts/compareFiled).
 */

import type { ExpectedResults } from "../../../types.js";

const EXPECTED: Record<string, Partial<ExpectedResults>> = {
  "form-4797": {
    engineFields: {
      // Line 1a — Enter the gross proceeds from sales or exchanges reported to you for 2025 on For
      "form-4797.0.line.1a_gross_proceeds_1099b_1099s": 350000,
      // Line 1c — Enter the total amount of loss that you are including on lines 2 and 10 due to t
      "form-4797.0.line.1c_loss_macrs_partial_dispositions": 9000,
      // Line 2, row 1 — (d) Gross sales price
      "form-4797.0.line.2_row1_col_d": 70000,
      // Line 2, row 1 — (f) Cost or other basis, plus improvements and expense of sale
      "form-4797.0.line.2_row1_col_f": 56200,
      // Line 2, row 1 — (g) Gain or (loss). Subtract (f) from the sum of (d) and (e)
      "form-4797.0.line.2_row1_col_g": 13800,
      // Line 2, row 2 — (d) Gross sales price
      "form-4797.0.line.2_row2_col_d": 1500,
      // Line 2, row 2 — (e) Depreciation allowed or allowable since acquisition
      "form-4797.0.line.2_row2_col_e": 21000,
      // Line 2, row 2 — (f) Cost or other basis, plus improvements and expense of sale
      "form-4797.0.line.2_row2_col_f": 25000,
      // Line 2, row 2 — (g) Gain or (loss). Subtract (f) from the sum of (d) and (e)
      "form-4797.0.line.2_row2_col_g": -2500,
      // Line 2, row 3 — (d) Gross sales price
      "form-4797.0.line.2_row3_col_d": 200,
      // Line 2, row 3 — (e) Depreciation allowed or allowable since acquisition
      "form-4797.0.line.2_row3_col_e": 2800,
      // Line 2, row 3 — (f) Cost or other basis, plus improvements and expense of sale
      "form-4797.0.line.2_row3_col_f": 12000,
      // Line 2, row 3 — (g) Gain or (loss). Subtract (f) from the sum of (d) and (e)
      "form-4797.0.line.2_row3_col_g": -9000,
      // Line 6 — Gain, if any, from line 32, from other than casualty or theft
      "form-4797.0.line.6_gain_from_line_32": 92660,
      // Line 7 — Combine lines 2 through 6. Enter the gain or (loss) here and on the appropriate l
      "form-4797.0.line.7_net_section_1231_gain_loss": 94960,
      // Line 8 — Nonrecaptured net section 1231 losses from prior years
      "form-4797.0.line.8_nonrecaptured_section_1231_losses": 15000,
      // Line 9 — Subtract line 8 from line 7. If zero or less, enter -0-
      "form-4797.0.line.9_line_7_minus_line_8": 79960,
      // Line 10, row 1 — (d) Gross sales price
      "form-4797.0.line.10_row1_col_d": 900,
      // Line 10, row 1 — (e) Depreciation allowed or allowable since acquisition
      "form-4797.0.line.10_row1_col_e": 2400,
      // Line 10, row 1 — (f) Cost or other basis, plus improvements and expense of sale
      "form-4797.0.line.10_row1_col_f": 2400,
      // Line 10, row 1 — (g) Gain or (loss). Subtract (f) from the sum of (d) and (e)
      "form-4797.0.line.10_row1_col_g": 900,
      // Line 12 — Gain, if any, from line 7 or amount from line 8, if applicable
      "form-4797.0.line.12_gain_from_line_7_or_8": 15000,
      // Line 13 — Gain, if any, from line 31
      "form-4797.0.line.13_gain_from_line_31": 30500,
      // Line 17 — Combine lines 10 through 16
      "form-4797.0.line.17_ordinary_gain_loss_total": 46400,
      // Line 18b — Redetermine the gain or (loss) on line 17 excluding the loss, if any, on line 1
      "form-4797.0.line.18b_redetermined_ordinary_gain_loss": 46400,
      // Line 20 — Gross sales price — Property A
      "form-4797.1.line.20_gross_sales_price_col_a": 260000,
      // Line 20 — Gross sales price — Property B
      "form-4797.1.line.20_gross_sales_price_col_b": 20000,
      // Line 20 — Gross sales price — Property C
      "form-4797.1.line.20_gross_sales_price_col_c": 18500,
      // Line 20 — Gross sales price — Property D
      "form-4797.1.line.20_gross_sales_price_col_d": 64000,
      // Line 21 — Cost or other basis plus expense of sale — Property A
      "form-4797.1.line.21_cost_basis_plus_expense_col_a": 225600,
      // Line 21 — Cost or other basis plus expense of sale — Property B
      "form-4797.1.line.21_cost_basis_plus_expense_col_b": 25200,
      // Line 21 — Cost or other basis plus expense of sale — Property C
      "form-4797.1.line.21_cost_basis_plus_expense_col_c": 42000,
      // Line 21 — Cost or other basis plus expense of sale — Property D
      "form-4797.1.line.21_cost_basis_plus_expense_col_d": 50000,
      // Line 22 — Depreciation (or depletion) allowed or allowable — Property A
      "form-4797.1.line.22_depreciation_allowed_col_a": 48460,
      // Line 22 — Depreciation (or depletion) allowed or allowable — Property B
      "form-4797.1.line.22_depreciation_allowed_col_b": 24000,
      // Line 22 — Depreciation (or depletion) allowed or allowable — Property C
      "form-4797.1.line.22_depreciation_allowed_col_c": 31000,
      // Line 23 — Adjusted basis. Subtract line 22 from line 21 — Property A
      "form-4797.1.line.23_adjusted_basis_col_a": 177140,
      // Line 23 — Adjusted basis. Subtract line 22 from line 21 — Property B
      "form-4797.1.line.23_adjusted_basis_col_b": 1200,
      // Line 23 — Adjusted basis. Subtract line 22 from line 21 — Property C
      "form-4797.1.line.23_adjusted_basis_col_c": 11000,
      // Line 23 — Adjusted basis. Subtract line 22 from line 21 — Property D
      "form-4797.1.line.23_adjusted_basis_col_d": 50000,
      // Line 24 — Total gain. Subtract line 23 from line 20 — Property A
      "form-4797.1.line.24_total_gain_col_a": 82860,
      // Line 24 — Total gain. Subtract line 23 from line 20 — Property B
      "form-4797.1.line.24_total_gain_col_b": 18800,
      // Line 24 — Total gain. Subtract line 23 from line 20 — Property C
      "form-4797.1.line.24_total_gain_col_c": 7500,
      // Line 24 — Total gain. Subtract line 23 from line 20 — Property D
      "form-4797.1.line.24_total_gain_col_d": 14000,
      // Line 25a — If section 1245 property: Depreciation allowed or allowable from line 22 — Prop
      "form-4797.1.line.25a_sec_1245_depreciation_col_c": 31000,
      // Line 25b — If section 1245 property: Enter the smaller of line 24 or 25a — Property C
      "form-4797.1.line.25b_sec_1245_smaller_amount_col_c": 7500,
      // Line 26a — If section 1250 property: Additional depreciation after 1975 — Property B
      "form-4797.1.line.26a_sec_1250_additional_depreciation_after_1975_col_b": 14400,
      // Line 26b — If section 1250 property: Applicable percentage multiplied by the smaller of li
      "form-4797.1.line.26b_sec_1250_applicable_percentage_amount_col_b": 14400,
      // Line 26c — If section 1250 property: Subtract line 26a from line 24 — Property B
      "form-4797.1.line.26c_sec_1250_gain_less_26a_col_b": 4400,
      // Line 26g, property A: straight line depreciation, "enter -0- on line 26g" (verified zero).
      "form-4797.1.line.26g_sec_1250_total_col_a": 0,
      // Lines 26d and 26e, property B: no additional depreciation before 1976 (verified zeros).
      "form-4797.1.line.26d_sec_1250_additional_depreciation_1970_1975_col_b": 0,
      "form-4797.1.line.26e_sec_1250_smaller_amount_col_b": 0,
      // Line 26g — If section 1250 property: Add lines 26b, 26e, and 26f — Property B
      "form-4797.1.line.26g_sec_1250_total_col_b": 14400,
      // Line 27a — If section 1252 property: Soil, water, and land clearing expenses — Property D
      "form-4797.1.line.27a_sec_1252_land_clearing_expenses_col_d": 9000,
      // Line 27b — If section 1252 property: Line 27a multiplied by applicable percentage — Proper
      "form-4797.1.line.27b_sec_1252_applicable_percentage_amount_col_d": 3600,
      // Line 27c — If section 1252 property: Enter the smaller of line 24 or 27b — Property D
      "form-4797.1.line.27c_sec_1252_smaller_amount_col_d": 3600,
      // Line 29a — If section 1255 property: Applicable percentage of payments excluded from incom
      "form-4797.1.line.29a_sec_1255_excluded_payments_percentage_col_d": 5000,
      // Line 29b — If section 1255 property: Enter the smaller of line 24 or 29a — Property D
      "form-4797.1.line.29b_sec_1255_smaller_amount_col_d": 5000,
      // Line 30 — Total gains for all properties. Add property columns A through D, line 24
      "form-4797.1.line.30_total_gains_all_properties": 123160,
      // Line 31 — Add property columns A through D, lines 25b, 26g, 27c, 28b, and 29b
      "form-4797.1.line.31_total_recapture_amounts": 30500,
      // Line 32 — Subtract line 31 from line 30
      "form-4797.1.line.32_gain_less_recapture": 92660,
      // Line 33 — Section 179 expense deduction or depreciation allowable in prior years — (a) Sec
      "form-4797.1.line.33_sec_179_or_depreciation_prior_years_col_a": 15000,
      // Line 33 — Section 179 expense deduction or depreciation allowable in prior years — (b) Sec
      "form-4797.1.line.33_sec_179_or_depreciation_prior_years_col_b": 16618,
      // Line 34 — Recomputed depreciation — (a) Section 179
      "form-4797.1.line.34_recomputed_depreciation_col_a": 6866,
      // Line 34 — Recomputed depreciation — (b) Section 280F(b)(2)
      "form-4797.1.line.34_recomputed_depreciation_col_b": 12600,
      // Line 35 — Recapture amount. Subtract line 34 from line 33 — (a) Section 179
      "form-4797.1.line.35_recapture_amount_col_a": 8134,
      // Line 35 — Recapture amount. Subtract line 34 from line 33 — (b) Section 280F(b)(2)
      "form-4797.1.line.35_recapture_amount_col_b": 4018,
    },
  },
  "schedule-b": {
    engineFields: {
      // Line 5 — Amount (row 1)
      "schedule-b.0.line.5_amount_1": 3200,
      // Line 6 — Add the amounts on line 5. Enter the total here and on Form 1040 or 1040-SR, line
      "schedule-b.0.line.6_total_ordinary_dividends": 3200,
    },
  },
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 60000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 60000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 60000,
      // Line 6 — Other income, including federal and state gasoline or fuel tax credit or refund
      "schedule-c.0.line.6": 12152,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 72152,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 12000,
      // Line 13 — Depreciation and section 179 expense deduction (not included in Part III)
      "schedule-c.0.line.13": 5000,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 2400,
      // Line 25 — Utilities
      "schedule-c.0.line.25": 3600,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 23000,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 49152,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 49152,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 49152,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 49152,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 45392,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 45392,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 45392,
      // Line 8a — Total social security wages and tips (total of boxes 3 and 7 on Form(s) W-2) and
      "schedule-se.0.line.8a": 12000,
      // Line 8d — Add lines 8a, 8b, and 8c
      "schedule-se.0.line.8d": 12000,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 164100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 5629,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 1316,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 6945,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 3473,
    },
  },
  "schedule-d": {
    engineFields: {
      // Line 11 — Gain from Form 4797, Part I; long-term gain from Forms 2439 and 6252; and long-t
      "schedule-d.0.line.11_long_term_gain_other_forms": 79960,
      // Line 13 — Capital gain distributions
      "schedule-d.0.line.13_capital_gain_distributions": 1500,
      // Line 15 — Net long-term capital gain or (loss). Combine lines 8a through 14 in column (h)
      "schedule-d.0.line.15_net_long_term_gain_loss": 81460,
      // Line 16 — Combine lines 7 and 15 and enter the result
      "schedule-d.1.line.16_combined_gain_loss": 81460,
      // Line 19 — If you are required to complete the Unrecaptured Section 1250 Gain Worksheet, en
      "schedule-d.1.line.19_unrecaptured_sec1250_gain": 38460,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) QBI: Schedule C 49,152 + Form 4797 ordinary 46,400 − SE deduction 3,473 (README).
      "form-8995.0.line.1i_c": 92079,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": 92079,
      // Line 4 — Total qualified business income. Combine lines 2 and 3. If zero or less, enter -0
      "form-8995.0.line.4": 92079,
      // Line 5 — Qualified business income component. Multiply line 4 by 20% (0.20): 18,415.80
      "form-8995.0.line.5": 18416,
      // Line 10 — Qualified business income deduction before the income limitation. Add lines 5 an
      "form-8995.0.line.10": 18416,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 172989,
      // Line 12 — Enter your net capital gain, if any, increased by any qualified dividends
      "form-8995.0.line.12": 84260,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 88729,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 17746,
      // Line 15 — Qualified business income deduction. Enter the smaller of line 10 or line 14
      "form-8995.0.line.15": 17746,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 49152,
      // Line 4 — Other gains or (losses)
      "schedule-1.0.line.4": 46400,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 95552,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 3473,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 3473,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 6945,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 6945,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 12000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 12000,
      // Line 3a — Qualified dividends
      "form-1040.line.3a": 2800,
      // Line 3b — Ordinary dividends
      "form-1040.line.3b": 3200,
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": 81460,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 95552,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 192212,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 3473,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 188739,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 188739,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 17746,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 33496,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 155243,
      // Line 16 — Tax: the Schedule D Tax Worksheet's line 47 (README).
      "form-1040.line.16": 25983,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 25983,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 25983,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 6945,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 32928,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 900,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 900,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 900,
      // Line 37 — Amount you owe
      "form-1040.line.37": 32028,
    },
  },
};

export function berelainExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
