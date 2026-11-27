/*
 * jon — LOCKED expected values, drafted from the engine's
 * output on 2026-11-27 (scripts/draftExpected.ts).
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
  "form-8820": {
    engineFields: {
      // Line 1 — Qualified clinical testing expenses paid or incurred during the tax year (dollars
      "form-8820.0.line.1_qualified_clinical_testing_expenses_dollars": 169551,
      // Line 2a — If "Yes," multiply line 1 by 19.75% (0.1975). If "No," multiply line 1 by 25% (0
      "form-8820.0.line.2a_credit_amount_dollars": 33486,
      // Line 2b — Enter the portion of the credit from Form 8932, line 2, that is attributable to
      "form-8820.0.line.2b_form_8932_wages_portion_dollars": 900,
      // Line 2c — Subtract line 2b from line 2a. If zero or less, enter -0- (dollars)
      "form-8820.0.line.2c_subtract_2b_from_2a_dollars": 32586,
      // Line 3 — Orphan drug credit from partnerships, S corporations, estates, or trusts (dollars
      "form-8820.0.line.3_pass_through_orphan_drug_credit_dollars": 4250,
      // Line 4 — Add lines 2c and 3 (dollars)
      "form-8820.0.line.4_add_lines_2c_and_3_dollars": 36836,
    },
    // MANUAL EDIT: line 2a, Jon elects the reduced credit.
    renderedChecked: ["form-8820.0.line.2a_elect_reduced_credit_280c_yes"],
  },
  "form-3800": {
    engineFields: {
      // Line 1 — Credits not subject to the passive activity limit from Part III, line 2: combine
      "form-3800.0.line.1_credits_not_passive_limited": 39236,
      // Line 6 — Add lines 1, 3, 4, and 5
      "form-3800.0.line.6_total_credits_not_allowed_tmt": 39236,
      // Line 7 — Regular tax before credits
      "form-3800.0.line.7_regular_tax_before_credits": 71940,
      // Line 9 — Add lines 7 and 8
      "form-3800.0.line.9_regular_tax_plus_amt": 71940,
      // Line 11 — Net income tax. Subtract line 10c from line 9
      "form-3800.0.line.11_net_income_tax": 71940,
      // Line 12 — Net regular tax. Subtract line 10c from line 7. If zero or less, enter -0-
      "form-3800.0.line.12_net_regular_tax": 71940,
      // Line 13 — Enter 25% (0.25) of the excess, if any, of line 12 (line 11 for corporations) ov
      "form-3800.0.line.13_25_percent_of_excess": 11735,
      // Line 14 — Tentative minimum tax
      "form-3800.0.line.14_tentative_minimum_tax": 57253,
      // Line 15 — Enter the greater of line 13 or line 14
      "form-3800.0.line.15_greater_of_line_13_or_14": 57253,
      // Line 16 — Subtract line 15 from line 11. If zero or less, enter -0-
      "form-3800.0.line.16_net_income_tax_less_line_15": 14687,
      // Line 17 — Enter the smaller of line 6 or line 16. This is the amount of your credit allowe
      "form-3800.0.line.17_credit_allowed_after_38c1_limit": 14687,
      // Line 27 — Subtract line 13 from line 11. If zero or less, enter -0-
      "form-3800.1.line.27_subtract_line_13_from_11": 60205,
      // Line 28 — Add lines 17 and 26
      "form-3800.1.line.28_add_lines_17_and_26": 14687,
      // Line 29 — Subtract line 28 from line 27. If zero or less, enter -0-
      "form-3800.1.line.29_subtract_line_28_from_27": 45518,
      // Line 38 — Credit allowed for the current year. Add lines 28 and 37
      "form-3800.1.line.38_credit_allowed_current_year": 14687,
      // Line 1h — Form 8820 — (a) No. of items
      "form-3800.2.part3.1h_form_8820_col_a": 2,
      // Line 1h — Form 8820 — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.1h_form_8820_col_e": 36836,
      // Line 1h — Form 8820 — (g) Combine columns (e) and (f) with the credit from column (d) allo
      "form-3800.2.part3.1h_form_8820_col_g": 36836,
      // Line 1w — Form 8932 — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.1w_form_8932_col_e": 2400,
      // Line 1w — Form 8932 — (g) Combine columns (e) and (f) with the credit from column (d) allo
      "form-3800.2.part3.1w_form_8932_col_g": 2400,
      // Line 2 — Add lines 1a–1zz — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.2_add_lines_1a_1zz_col_e": 39236,
      // Line 2 — Add lines 1a–1zz — (g) Combine columns (e) and (f) with the credit from column (d
      "form-3800.2.part3.2_add_lines_1a_1zz_col_g": 39236,
      // Line 6 — Add lines 2, 3, and 5: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.6_add_lines_2_3_5_col_e": 39236,
      // Line 6 — Add lines 2, 3, and 5: (g) Combine columns (e) and (f) with the credit from colum
      "form-3800.3.part3.6_add_lines_2_3_5_col_g": 39236,
      // Part V, line 1, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.1_breakdown_col_e": 4250,
      // Part V, line 2, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.2_breakdown_col_e": 32586,
      // Line 1 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.1_breakdown_col_g": 4250,
      // Line 1 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.1_breakdown_col_h2": 4250,
      // Line 1 — (i)(1) Amount of column (h)(2) applied against tax in Part II
      "form-3800.7.part5.1_breakdown_col_i1": 4250,
      // Line 2 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.2_breakdown_col_g": 32586,
      // Line 2 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.2_breakdown_col_h2": 32586,
      // Line 2 — (i)(1) Amount of column (h)(2) applied against tax in Part II
      "form-3800.7.part5.2_breakdown_col_i1": 10437,
      // Line 2 — (k) Carryforward to 2026. Subtract column (i)(1) from column (h)(2)
      "form-3800.7.part5.2_breakdown_col_k": 22149,
    },
  },
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 820000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 820000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 820000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 820000,
      // Line 20a — Rent or lease: Vehicles, machinery, and equipment
      "schedule-c.0.line.20a": 9000,
      // Line 11 — Contract labor
      "schedule-c.0.line.11": 88000,
      // Line 20b — Rent or lease: Other business property
      "schedule-c.0.line.20b": 60000,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 46000,
      // Line 23 — Taxes and licenses
      "schedule-c.0.line.23": 17000,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 14000,
      // Line 25 — Utilities
      "schedule-c.0.line.25": 8000,
      // Line 26 — Wages (less employment credits)
      "schedule-c.0.line.26": 190000,
      // Line 17 — Legal and professional services
      "schedule-c.0.line.17": 18000,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 450000,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 370000,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 370000,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 370000,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 370000,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 341695,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 341695,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 341695,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 21836,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 9909,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 31745,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 15873,
    },
  },
  "schedule-e": {
    engineFields: {
      // Line 28 row A — (k) Nonpassive income from Schedule K-1
      "schedule-e.1.line.28_row_a_col_k_nonpassive_income": 25000,
      // Line 29a — Totals, column (k) nonpassive income
      "schedule-e.1.line.29a_totals_col_k": 25000,
      // Line 30 — Add columns (h) and (k) of line 29a
      "schedule-e.1.line.30_add_income_columns": 25000,
      // Line 32 — Total partnership and S corporation income or (loss). Combine lines 30 and 31
      "schedule-e.1.line.32_total_partnership_s_corp_income": 25000,
      // Line 41 — Total income or (loss). Combine lines 26, 32, 37, 39, and 40
      "schedule-e.1.line.41_total_income_or_loss": 25000,
    },
  },
  "form-8995-a": {
    engineFields: {
      // Line 2 — Qualified business income from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.2_a": 354127,
      // Line 3 — Multiply line 2 by 20% (0.20) (Column A)
      "form-8995-a.0.line.3_a": 70825,
      // Line 4 — Allocable share of W-2 wages from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.4_a": 190000,
      // Line 5 — Multiply line 4 by 50% (0.50) (Column A)
      "form-8995-a.0.line.5_a": 95000,
      // Line 6 — Multiply line 4 by 25% (0.25) (Column A)
      "form-8995-a.0.line.6_a": 47500,
      // Line 9 — Add lines 6 and 8 (Column A)
      "form-8995-a.0.line.9_a": 47500,
      // Line 10 — Enter the greater of line 5 or line 9 (Column A)
      "form-8995-a.0.line.10_a": 95000,
      // Line 11 — W-2 wage and UBIA of qualified property limitation. Enter the smaller of line 3
      "form-8995-a.0.line.11_a": 70825,
      // Line 13 — Qualified business income deduction before patron reduction. Enter the greater o
      "form-8995-a.0.line.13_a": 70825,
      // Line 15 — Qualified business income component. Subtract line 14 from line 13 (Column A)
      "form-8995-a.0.line.15_a": 70825,
      // Line 16 — Total qualified business income component. Add all amounts reported on line 15
      "form-8995-a.0.line.16": 70825,
      // Line 27 — Total qualified business income component from all qualified trades, businesses,
      "form-8995-a.1.line.27": 70825,
      // Line 32 — Qualified business income deduction before the income limitation. Add lines 27 a
      "form-8995-a.1.line.32": 70825,
      // Line 33 — Taxable income before qualified business income deduction
      "form-8995-a.1.line.33": 363377,
      // Line 35 — Subtract line 34 from line 33. If zero or less, enter -0-
      "form-8995-a.1.line.35": 363377,
      // Line 36 — Income limitation. Multiply line 35 by 20% (0.20)
      "form-8995-a.1.line.36": 72675,
      // Line 37 — Qualified business income deduction before the domestic production activities de
      "form-8995-a.1.line.37": 70825,
      // Line 39 — Total qualified business income deduction. Add lines 37 and 38
      "form-8995-a.1.line.39": 70825,
    },
  },
  "form-6251": {
    engineFields: {
      // Line 1a — Subtract Schedule 1-A (Form 1040), line 37, from Form 1040, 1040-SR, or 1040-NR,
      "form-6251.0.line.1a_deductions_less_schedule_1a": 86575,
      // Line 1b — Subtract line 1a from Form 1040, 1040-SR, or 1040-NR, line 11b (if less than zer
      "form-6251.0.line.1b_taxable_income_start": 292552,
      // Line 2a — If filing Schedule A (Form 1040), enter the taxes from Schedule A, line 7; other
      "form-6251.0.line.2a_taxes_or_standard_deduction": 15750,
      // Line 4 — Alternative minimum taxable income. Combine lines 1b through 3
      "form-6251.0.line.4_alternative_minimum_taxable_income": 308302,
      // Line 5 — Exemption
      "form-6251.0.line.5_exemption": 88100,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-6251.0.line.6_amti_less_exemption": 220202,
      // Line 7 — Tax on line 6: complete Part III and enter line 40 if you have capital gain distr
      "form-6251.0.line.7_tax_on_line_6": 57253,
      // Line 9 — Tentative minimum tax. Subtract line 8 from line 7
      "form-6251.0.line.9_tentative_minimum_tax": 57253,
      // Line 10 — Add Form 1040 or 1040-SR, line 16 (minus any tax from Form 4972), and Schedule 2
      "form-6251.0.line.10_regular_tax_less_credits": 71940,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 370000,
      // Line 5 — Rental real estate, royalties, partnerships, S corporations, trusts, etc. Attach
      "schedule-1.0.line.5": 25000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 395000,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 15873,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 15873,
    },
  },
  "form-8959": {
    engineFields: {
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 200000,
      // Line 8 — Self-employment income from Schedule SE (Form 1040), Part I, line 6
      "form-8959.0.line.8_self_employment_income": 341695,
      // Line 9 — Enter the following amount for your filing status
      "form-8959.0.line.9_filing_status_threshold_se": 200000,
      // Line 11 — Subtract line 10 from line 9. If zero or less, enter -0-
      "form-8959.0.line.11_threshold_reduced_by_wages": 200000,
      // Line 12 — Subtract line 11 from line 8. If zero or less, enter -0-
      "form-8959.0.line.12_excess_se_income": 141695,
      // Line 13 — Additional Medicare Tax on self-employment income. Multiply line 12 by 0.9% (0.0
      "form-8959.0.line.13_additional_medicare_tax_se": 1275,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 1275,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 31745,
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 1275,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 33020,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 6a — General business credit. Attach Form 3800
      "schedule-3.0.line.6a": 14687,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 14687,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 14687,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 395000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 395000,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 15873,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 379127,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 379127,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 70825,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 86575,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 292552,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 71940,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 71940,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 14687,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 14687,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 57253,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 33020,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 90273,
      // Line 26 — 2025 estimated tax payments and amount applied from 2024 return
      "form-1040.line.26": 60000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 60000,
      // Line 37 — Amount you owe
      "form-1040.line.37": 30273,
    },
  },
};

export function jonExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
