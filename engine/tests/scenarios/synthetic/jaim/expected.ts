/*
 * jaim — LOCKED expected values, drafted from the engine's
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
  "form-8941": {
    engineFields: {
      // Line 1 — Enter the number of individuals you employed during the tax year who are consider
      "form-8941.0.line.1_number_of_employees": 14,
      // Line 2 — Enter the number of full-time equivalent employees (FTEs) you had for the tax yea
      "form-8941.0.line.2_full_time_equivalent_employees": 12,
      // Line 3 — Average annual wages you paid for the tax year (from Worksheet 3, line 3). This a
      "form-8941.0.line.3_average_annual_wages": 37000,
      // Line 4 — Premiums you paid during the tax year for employees included on line 1 for health
      "form-8941.0.line.4_premiums_paid_qualifying_arrangement": 58500,
      // Line 5 — Premiums you would have entered on line 4 if the total premium for each employee
      "form-8941.0.line.5_premiums_at_average_premium": 52178,
      // Line 6 — Enter the smaller of line 4 or line 5
      "form-8941.0.line.6_smaller_of_4_or_5": 52178,
      // Line 7 — Multiply line 6 by the applicable percentage: tax-exempt small employers, 35% (0.
      "form-8941.0.line.7_multiply_6_by_applicable_percentage": 26089,
      // Line 8 — If line 2 is 10 or less, enter the amount from line 7. Otherwise, enter the amoun
      "form-8941.0.line.8_fte_phaseout_amount": 22610,
      // Line 9 — If line 3 is $33,000 or less, enter the amount from line 8. Otherwise, enter the
      "form-8941.0.line.9_wage_phaseout_amount": 19711,
      // Line 10 — Enter the total amount of any state premium subsidies paid and any state tax cre
      "form-8941.0.line.10_state_subsidies_and_credits": 1200,
      // Line 11 — Subtract line 10 from line 4. If zero or less, enter -0-
      "form-8941.0.line.11_subtract_10_from_4": 57300,
      // Line 12 — Enter the smaller of line 9 or line 11
      "form-8941.0.line.12_smaller_of_9_or_11": 19711,
      // Line 13 — If line 12 is zero, skip lines 13 and 14 and go to line 15. Otherwise, enter the
      "form-8941.0.line.13_employees_with_premiums_paid": 8,
      // Line 14 — Enter the number of FTEs you would have entered on line 2 if you only included e
      "form-8941.0.line.14_ftes_for_line_13_employees": 8,
      // Line 15 — Credit for small employer health insurance premiums from partnerships, S corpora
      "form-8941.0.line.15_credit_from_pass_through_entities": 1850,
      // Line 16 — Add lines 12 and 15
      "form-8941.0.line.16_add_lines_12_and_15": 21561,
    },
  },
  "form-3800": {
    engineFields: {
      // Line 7 — Regular tax before credits
      "form-3800.0.line.7_regular_tax_before_credits": 62063,
      // Line 9 — Add lines 7 and 8
      "form-3800.0.line.9_regular_tax_plus_amt": 62063,
      // Line 11 — Net income tax. Subtract line 10c from line 9
      "form-3800.0.line.11_net_income_tax": 62063,
      // Line 12 — Net regular tax. Subtract line 10c from line 7. If zero or less, enter -0-
      "form-3800.0.line.12_net_regular_tax": 62063,
      // Line 13 — Enter 25% (0.25) of the excess, if any, of line 12 (line 11 for corporations) ov
      "form-3800.0.line.13_25_percent_of_excess": 9266,
      // Line 27 — Subtract line 13 from line 11. If zero or less, enter -0-
      "form-3800.1.line.27_subtract_line_13_from_11": 52797,
      // Line 29 — Subtract line 28 from line 27. If zero or less, enter -0-
      "form-3800.1.line.29_subtract_line_28_from_27": 52797,
      // Line 30 — Enter the general business credit from line 5 of Part III: combine column (e) wi
      "form-3800.1.line.30_specified_general_business_credit": 21561,
      // Line 36 — Add lines 30, 33, 34, and 35
      "form-3800.1.line.36_add_lines_30_33_34_35": 21561,
      // Line 37 — Enter the smaller of line 29 or line 36. This is the amount allowed for specifie
      "form-3800.1.line.37_specified_credits_allowed": 21561,
      // Line 38 — Credit allowed for the current year. Add lines 28 and 37
      "form-3800.1.line.38_credit_allowed_current_year": 21561,
      // Line 4h — Form 8941: (a) No. of items
      "form-3800.3.part3.4h_form_8941_col_a": 2,
      // Line 4h — Form 8941: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.4h_form_8941_col_e": 21561,
      // Line 4h — Form 8941: (g) Combine columns (e) and (f) with the credit from column (d) allow
      "form-3800.3.part3.4h_form_8941_col_g": 21561,
      // Line 5 — Add lines 4a–4z: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.5_add_lines_4a_4z_col_e": 21561,
      // Line 5 — Add lines 4a–4z: (g) Combine columns (e) and (f) with the credit from column (d)
      "form-3800.3.part3.5_add_lines_4a_4z_col_g": 21561,
      // Line 6 — Add lines 2, 3, and 5: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.6_add_lines_2_3_5_col_e": 21561,
      // Line 6 — Add lines 2, 3, and 5: (g) Combine columns (e) and (f) with the credit from colum
      "form-3800.3.part3.6_add_lines_2_3_5_col_g": 21561,
      // Part V, line 1, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.1_breakdown_col_e": 1850,
      // Part V, line 2, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.2_breakdown_col_e": 19711,
      // Line 1 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.1_breakdown_col_g": 1850,
      // Line 1 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.1_breakdown_col_h2": 1850,
      // Line 1 — (i)(1) Amount of column (h)(2) applied against tax in Part II
      "form-3800.7.part5.1_breakdown_col_i1": 1850,
      // Line 2 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.2_breakdown_col_g": 19711,
      // Line 2 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.2_breakdown_col_h2": 19711,
      // Line 2 — (i)(1) Amount of column (h)(2) applied against tax in Part II
      "form-3800.7.part5.2_breakdown_col_i1": 19711,
    },
  },
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 1020000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 1020000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 1020000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 1020000,
      // Line 8 — Advertising
      "schedule-c.0.line.8": 7500,
      // Line 21 — Repairs and maintenance
      "schedule-c.0.line.21": 22000,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 96000,
      // Line 23 — Taxes and licenses
      "schedule-c.0.line.23": 38000,
      // Line 14 — Employee benefit programs (other than on line 19)
      "schedule-c.0.line.14": 41789,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 18000,
      // Line 25 — Utilities
      "schedule-c.0.line.25": 6500,
      // Line 26 — Wages (less employment credits)
      "schedule-c.0.line.26": 457100,
      // Line 17 — Legal and professional services
      "schedule-c.0.line.17": 5200,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 692089,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 327911,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 327911,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 327911,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 327911,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 302826,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 302826,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 302826,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 21836,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 8782,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 30618,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 15309,
    },
  },
  "schedule-e": {
    engineFields: {
      // Line 28 row A — (k) Nonpassive income from Schedule K-1
      "schedule-e.1.line.28_row_a_col_k_nonpassive_income": 30000,
      // Line 29a — Totals, column (k) nonpassive income
      "schedule-e.1.line.29a_totals_col_k": 30000,
      // Line 30 — Add columns (h) and (k) of line 29a
      "schedule-e.1.line.30_add_income_columns": 30000,
      // Line 32 — Total partnership and S corporation income or (loss). Combine lines 30 and 31
      "schedule-e.1.line.32_total_partnership_s_corp_income": 30000,
      // Line 41 — Total income or (loss). Combine lines 26, 32, 37, 39, and 40
      "schedule-e.1.line.41_total_income_or_loss": 30000,
    },
  },
  "form-8995-a": {
    engineFields: {
      // Line 2 — Qualified business income from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.2_a": 312602,
      // Line 3 — Multiply line 2 by 20% (0.20) (Column A)
      "form-8995-a.0.line.3_a": 62520,
      // Line 4 — Allocable share of W-2 wages from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.4_a": 457100,
      // Line 5 — Multiply line 4 by 50% (0.50) (Column A)
      "form-8995-a.0.line.5_a": 228550,
      // Line 6 — Multiply line 4 by 25% (0.25) (Column A)
      "form-8995-a.0.line.6_a": 114275,
      // Line 9 — Add lines 6 and 8 (Column A)
      "form-8995-a.0.line.9_a": 114275,
      // Line 10 — Enter the greater of line 5 or line 9 (Column A)
      "form-8995-a.0.line.10_a": 228550,
      // Line 11 — W-2 wage and UBIA of qualified property limitation. Enter the smaller of line 3
      "form-8995-a.0.line.11_a": 62520,
      // Line 13 — Qualified business income deduction before patron reduction. Enter the greater o
      "form-8995-a.0.line.13_a": 62520,
      // Line 15 — Qualified business income component. Subtract line 14 from line 13 (Column A)
      "form-8995-a.0.line.15_a": 62520,
      // Line 16 — Total qualified business income component. Add all amounts reported on line 15
      "form-8995-a.0.line.16": 62520,
      // Line 27 — Total qualified business income component from all qualified trades, businesses,
      "form-8995-a.1.line.27": 62520,
      // Line 32 — Qualified business income deduction before the income limitation. Add lines 27 a
      "form-8995-a.1.line.32": 62520,
      // Line 33 — Taxable income before qualified business income deduction
      "form-8995-a.1.line.33": 326852,
      // Line 35 — Subtract line 34 from line 33. If zero or less, enter -0-
      "form-8995-a.1.line.35": 326852,
      // Line 36 — Income limitation. Multiply line 35 by 20% (0.20)
      "form-8995-a.1.line.36": 65370,
      // Line 37 — Qualified business income deduction before the domestic production activities de
      "form-8995-a.1.line.37": 62520,
      // Line 39 — Total qualified business income deduction. Add lines 37 and 38
      "form-8995-a.1.line.39": 62520,
    },
  },
  "form-8959": {
    engineFields: {
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 200000,
      // Line 8 — Self-employment income from Schedule SE (Form 1040), Part I, line 6
      "form-8959.0.line.8_self_employment_income": 302826,
      // Line 9 — Enter the following amount for your filing status
      "form-8959.0.line.9_filing_status_threshold_se": 200000,
      // Line 11 — Subtract line 10 from line 9. If zero or less, enter -0-
      "form-8959.0.line.11_threshold_reduced_by_wages": 200000,
      // Line 12 — Subtract line 11 from line 8. If zero or less, enter -0-
      "form-8959.0.line.12_excess_se_income": 102826,
      // Line 13 — Additional Medicare Tax on self-employment income. Multiply line 12 by 0.9% (0.0
      "form-8959.0.line.13_additional_medicare_tax_se": 925,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 925,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 327911,
      // Line 5 — Rental real estate, royalties, partnerships, S corporations, trusts, etc. Attach
      "schedule-1.0.line.5": 30000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 357911,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 15309,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 15309,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 30618,
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 925,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 31543,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 6a — General business credit. Attach Form 3800
      "schedule-3.0.line.6a": 21561,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 21561,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 21561,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 357911,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 357911,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 15309,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 342602,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 342602,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 62520,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 78270,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 264332,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 62063,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 62063,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 21561,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 21561,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 40502,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 31543,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 72045,
      // Line 26 — 2025 estimated tax payments and amount applied from 2024 return
      "form-1040.line.26": 72000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 72000,
      // Line 37 — Amount you owe
      "form-1040.line.37": 45,
    },
  },
};

export function jaimExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
