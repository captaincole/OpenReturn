/*
 * nieda — LOCKED expected values, drafted from the engine's
 * output on 2026-11-28 (scripts/draftExpected.ts).
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
  "form-8900": {
    engineFields: {
      // Line 1 — Qualified railroad track maintenance expenditures paid or incurred
      "form-8900.0.line.1_track_maintenance_expenditures": 412500,
      // Line 2 — Enter 40% (0.40) of line 1
      "form-8900.0.line.2_forty_percent_of_line1": 165000,
      // Line 3a — Number of miles of railroad track owned or leased by you
      "form-8900.0.line.3a_miles_owned_or_leased": 52.5,
      // Line 3b — Less: number of miles of railroad track owned or leased by you and assigned to o
      "form-8900.0.line.3b_miles_assigned_to_others": 8,
      // Line 3c — Number of miles of railroad track assigned to you by the owner or lessee for pur
      "form-8900.0.line.3c_miles_assigned_to_you": 2.25,
      // Line 3d — Total. Combine lines 3a through 3c
      "form-8900.0.line.3d_total_miles": 46.75,
      // Line 4 — Multiply line 3d by $3,500
      "form-8900.0.line.4_miles_times_3500": 163625,
      // Line 5 — Enter the smaller of line 2 or line 4
      "form-8900.0.line.5_smaller_of_line2_or_line4": 163625,
      // Line 6 — Qualified railroad track maintenance credit from partnerships and S corporations
      "form-8900.0.line.6_credit_from_partnerships_s_corps": 2450,
      // Line 7 — Add lines 5 and 6
      "form-8900.0.line.7_total_credit": 166075,
    },
  },
  "form-3800": {
    engineFields: {
      // Line 7 — Regular tax before credits
      "form-3800.0.line.7_regular_tax_before_credits": 360226,
      // Line 9 — Add lines 7 and 8
      "form-3800.0.line.9_regular_tax_plus_amt": 360226,
      // Line 11 — Net income tax. Subtract line 10c from line 9
      "form-3800.0.line.11_net_income_tax": 360226,
      // Line 12 — Net regular tax. Subtract line 10c from line 7. If zero or less, enter -0-
      "form-3800.0.line.12_net_regular_tax": 360226,
      // Line 13 — Enter 25% (0.25) of the excess, if any, of line 12 (line 11 for corporations) ov
      "form-3800.0.line.13_25_percent_of_excess": 83807,
      // Line 27 — Subtract line 13 from line 11. If zero or less, enter -0-
      "form-3800.1.line.27_subtract_line_13_from_11": 276419,
      // Line 29 — Subtract line 28 from line 27. If zero or less, enter -0-
      "form-3800.1.line.29_subtract_line_28_from_27": 276419,
      // Line 30 — Enter the general business credit from line 5 of Part III: combine column (e) wi
      "form-3800.1.line.30_specified_general_business_credit": 166075,
      // Line 36 — Add lines 30, 33, 34, and 35
      "form-3800.1.line.36_add_lines_30_33_34_35": 166075,
      // Line 37 — Enter the smaller of line 29 or line 36. This is the amount allowed for specifie
      "form-3800.1.line.37_specified_credits_allowed": 166075,
      // Line 38 — Credit allowed for the current year. Add lines 28 and 37
      "form-3800.1.line.38_credit_allowed_current_year": 166075,
      // Line 4g — Form 8900: (a) No. of items
      "form-3800.3.part3.4g_form_8900_col_a": 2,
      // Line 4g — Form 8900: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.4g_form_8900_col_e": 166075,
      // Line 4g — Form 8900: (g) Combine columns (e) and (f) with the credit from column (d) allow
      "form-3800.3.part3.4g_form_8900_col_g": 166075,
      // Line 5 — Add lines 4a–4z: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.5_add_lines_4a_4z_col_e": 166075,
      // Line 5 — Add lines 4a–4z: (g) Combine columns (e) and (f) with the credit from column (d)
      "form-3800.3.part3.5_add_lines_4a_4z_col_g": 166075,
      // Line 6 — Add lines 2, 3, and 5: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.6_add_lines_2_3_5_col_e": 166075,
      // Line 6 — Add lines 2, 3, and 5: (g) Combine columns (e) and (f) with the credit from colum
      "form-3800.3.part3.6_add_lines_2_3_5_col_g": 166075,
      // Part V, line 1, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.1_breakdown_col_e": 2450,
      // Part V, line 2, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.2_breakdown_col_e": 163625,
      // Line 1 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.1_breakdown_col_g": 2450,
      // Line 1 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.1_breakdown_col_h2": 2450,
      // Line 1 — (i)(1) Amount of column (h)(2) applied against tax in Part II
      "form-3800.7.part5.1_breakdown_col_i1": 2450,
      // Line 2 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.2_breakdown_col_g": 163625,
      // Line 2 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.2_breakdown_col_h2": 163625,
      // Line 2 — (i)(1) Amount of column (h)(2) applied against tax in Part II
      "form-3800.7.part5.2_breakdown_col_i1": 163625,
    },
  },
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 3400000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 3400000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 3400000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 3400000,
      // Line 21 — Repairs and maintenance
      "schedule-c.0.line.21": 262500,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 85000,
      // Line 23 — Taxes and licenses
      "schedule-c.0.line.23": 95000,
      // Line 13 — Depreciation and section 179 expense deduction (not included in Part III)
      "schedule-c.0.line.13": 186625,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 140000,
      // Line 25 — Utilities
      "schedule-c.0.line.25": 30000,
      // Line 26 — Wages (less employment credits)
      "schedule-c.0.line.26": 1250000,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 2049125,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 1350875,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 1350875,
    },
  },
  "form-4562": {
    engineFields: {
      // Line 17 — MACRS deductions for assets placed in service in tax years beginning before 2025
      "form-4562.0.line.17_macrs_prior_years": 180000,
      // Line 19c (7-year property) — (c) Basis for depreciation (business/investment use only)
      "form-4562.0.line.19c_basis": 46375,
      // Line 19c (7-year property) — (g) Depreciation deduction
      "form-4562.0.line.19c_deduction": 6625,
      // Line 22 — Total. Add amounts from line 12, lines 14 through 17, lines 19 and 20 in column
      "form-4562.1.line.22_total": 186625,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 1350875,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 1350875,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 1247533,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 1247533,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 1247533,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 21836,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 36178,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 58014,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 29007,
    },
  },
  "schedule-e": {
    engineFields: {
      // Line 28 row A — (k) Nonpassive income from Schedule K-1
      "schedule-e.1.line.28_row_a_col_k_nonpassive_income": 48000,
      // Line 29a — Totals, column (k) nonpassive income
      "schedule-e.1.line.29a_totals_col_k": 48000,
      // Line 30 — Add columns (h) and (k) of line 29a
      "schedule-e.1.line.30_add_income_columns": 48000,
      // Line 32 — Total partnership and S corporation income or (loss). Combine lines 30 and 31
      "schedule-e.1.line.32_total_partnership_s_corp_income": 48000,
      // Line 41 — Total income or (loss). Combine lines 26, 32, 37, 39, and 40
      "schedule-e.1.line.41_total_income_or_loss": 48000,
    },
  },
  "form-8995-a": {
    engineFields: {
      // Line 2 — Qualified business income from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.2_a": 1321868,
      // Line 3 — Multiply line 2 by 20% (0.20) (Column A)
      "form-8995-a.0.line.3_a": 264374,
      // Line 4 — Allocable share of W-2 wages from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.4_a": 1250000,
      // Line 5 — Multiply line 4 by 50% (0.50) (Column A)
      "form-8995-a.0.line.5_a": 625000,
      // Line 6 — Multiply line 4 by 25% (0.25) (Column A)
      "form-8995-a.0.line.6_a": 312500,
      // Line 7 — Allocable share of the unadjusted basis immediately after acquisition (UBIA) of a
      "form-8995-a.0.line.7_a": 2400000,
      // Line 8 — Multiply line 7 by 2.5% (0.025) (Column A)
      "form-8995-a.0.line.8_a": 60000,
      // Line 9 — Add lines 6 and 8 (Column A)
      "form-8995-a.0.line.9_a": 372500,
      // Line 10 — Enter the greater of line 5 or line 9 (Column A)
      "form-8995-a.0.line.10_a": 625000,
      // Line 11 — W-2 wage and UBIA of qualified property limitation. Enter the smaller of line 3
      "form-8995-a.0.line.11_a": 264374,
      // Line 13 — Qualified business income deduction before patron reduction. Enter the greater o
      "form-8995-a.0.line.13_a": 264374,
      // Line 15 — Qualified business income component. Subtract line 14 from line 13 (Column A)
      "form-8995-a.0.line.15_a": 264374,
      // Line 16 — Total qualified business income component. Add all amounts reported on line 15
      "form-8995-a.0.line.16": 264374,
      // Line 27 — Total qualified business income component from all qualified trades, businesses,
      "form-8995-a.1.line.27": 264374,
      // Line 32 — Qualified business income deduction before the income limitation. Add lines 27 a
      "form-8995-a.1.line.32": 264374,
      // Line 33 — Taxable income before qualified business income deduction
      "form-8995-a.1.line.33": 1354118,
      // Line 35 — Subtract line 34 from line 33. If zero or less, enter -0-
      "form-8995-a.1.line.35": 1354118,
      // Line 36 — Income limitation. Multiply line 35 by 20% (0.20)
      "form-8995-a.1.line.36": 270824,
      // Line 37 — Qualified business income deduction before the domestic production activities de
      "form-8995-a.1.line.37": 264374,
      // Line 39 — Total qualified business income deduction. Add lines 37 and 38
      "form-8995-a.1.line.39": 264374,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 1350875,
      // Line 5 — Rental real estate, royalties, partnerships, S corporations, trusts, etc. Attach
      "schedule-1.0.line.5": 48000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 1398875,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 29007,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 29007,
    },
  },
  "form-8959": {
    engineFields: {
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 200000,
      // Line 8 — Self-employment income from Schedule SE (Form 1040), Part I, line 6
      "form-8959.0.line.8_self_employment_income": 1247533,
      // Line 9 — Enter the following amount for your filing status
      "form-8959.0.line.9_filing_status_threshold_se": 200000,
      // Line 11 — Subtract line 10 from line 9. If zero or less, enter -0-
      "form-8959.0.line.11_threshold_reduced_by_wages": 200000,
      // Line 12 — Subtract line 11 from line 8. If zero or less, enter -0-
      "form-8959.0.line.12_excess_se_income": 1047533,
      // Line 13 — Additional Medicare Tax on self-employment income. Multiply line 12 by 0.9% (0.0
      "form-8959.0.line.13_additional_medicare_tax_se": 9428,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 9428,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 58014,
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 9428,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 67442,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 6a — General business credit. Attach Form 3800
      "schedule-3.0.line.6a": 166075,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 166075,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 166075,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 1398875,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 1398875,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 29007,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 1369868,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 1369868,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 264374,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 280124,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 1089744,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 360226,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 360226,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 166075,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 166075,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 194151,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 67442,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 261593,
      // Line 26 — 2025 estimated tax payments and amount applied from 2024 return
      "form-1040.line.26": 360000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 360000,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 98407,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 98407,
    },
  },
};

export function niedaExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
