/*
 * dena — LOCKED expected values, drafted from the engine's
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
  "form-6765": {
    engineFields: {
      // Line 14 — Certain amounts paid or incurred to energy consortia
      "form-6765.0.line.14_energy_consortia_amounts": 4000,
      // Line 18 — Add lines 14 and 17
      "form-6765.0.line.18_add_lines": 4000,
      // Line 19 — Multiply line 18 by 20% (0.20)
      "form-6765.0.line.19_multiply_18_by_20": 800,
      // Line 20 — Total qualified research expenses (QREs). Enter amount from line 48
      "form-6765.0.line.20_total_qres_from_line_48": 787000,
      // Line 21 — Enter your total QREs for the prior 3 tax years
      "form-6765.0.line.21_prior_3_years_qres": 1230000,
      // Line 22 — Divide line 21 by 6.0
      "form-6765.0.line.22_divide_21_by_6": 205000,
      // Line 23 — Subtract line 22 from line 20. If zero or less, enter -0-
      "form-6765.0.line.23_subtract_22_from_20": 582000,
      // Line 24 — Multiply line 23 by 14% (0.14). If you skipped lines 22 and 23, multiply line 20
      "form-6765.0.line.24_multiply_23_by_14": 81480,
      // Line 25 — Add lines 19 and 24
      "form-6765.0.line.25_add_lines": 82280,
      // Line 26 — If you elect to reduce the credit under section 280C, then multiply line 25 by 7
      "form-6765.0.line.26_alternative_simplified_credit": 65001,
      // Line 28 — Subtract line 27 from line 13 or line 26 (whichever applies). If zero or less, e
      "form-6765.1.line.28_subtract_27_from_13_or_26": 65001,
      // Line 30 — Add lines 28 and 29
      "form-6765.1.line.30_total_current_year_credit": 65001,
      // Line 34 — Enter the portion of line 28 elected as a payroll tax credit (do not enter more
      "form-6765.1.line.34_elected_payroll_tax_credit": 20000,
      // Line 35 — General business credit carryforward from the current year
      "form-6765.1.line.35_gbc_carryforward_current_year": 8460,
      // Line 36 — Partnerships and S corporations, enter the smaller of line 28 or line 34. All ot
      "form-6765.1.line.36_payroll_tax_credit_amount": 8460,
      // Line 37 — Enter the number of business components generating the QREs on line 5 or line 20
      "form-6765.1.line.37_business_components_count": 4,
      // Line 42 — Total wages for qualified services for all business components (do not include a
      "form-6765.1.line.42_total_qualified_wages": 640000,
      // Line 43 — Total costs of supplies for all business components
      "form-6765.1.line.43_total_supplies_cost": 70000,
      // Line 44 — Total rental or lease cost of computers for all business components
      "form-6765.1.line.44_total_computer_rental_cost": 12000,
      // Line 45 — Total applicable amount of contract research for all business components (do not
      "form-6765.1.line.45_contract_research_amount": 65000,
      // Line 47 — Add line 45 and line 46
      "form-6765.1.line.47_add_lines": 65000,
      // Line 48 — Add lines 42, 43, 44, and 47, then enter line 48 on either line 5 or line 20, wh
      "form-6765.1.line.48_total_qres": 787000,
    },
  },
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 3900000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 3900000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 3900000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 3900000,
      // Line 8 — Advertising
      "schedule-c.0.line.8": 30000,
      // Line 18 — Office expense
      "schedule-c.0.line.18": 40000,
      // Line 20a — Rent or lease: Vehicles, machinery, and equipment
      "schedule-c.0.line.20a": 60000,
      // Line 11 — Contract labor
      "schedule-c.0.line.11": 180000,
      // Line 20b — Rent or lease: Other business property
      "schedule-c.0.line.20b": 240000,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 300000,
      // Line 23 — Taxes and licenses
      "schedule-c.0.line.23": 190000,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 60000,
      // Line 25 — Utilities
      "schedule-c.0.line.25": 50000,
      // Line 26 — Wages (less employment credits)
      "schedule-c.0.line.26": 2340000,
      // Line 17 — Legal and professional services
      "schedule-c.0.line.17": 30000,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 3520000,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 380000,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 380000,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 380000,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 380000,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 350930,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 350930,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 350930,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 21836,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 10177,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 32013,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 16007,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 380000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 380000,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 16007,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 16007,
    },
  },
  "form-8995-a": {
    engineFields: {
      // Line 2 — Qualified business income from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.2_a": 363993,
      // Line 3 — Multiply line 2 by 20% (0.20) (Column A)
      "form-8995-a.0.line.3_a": 72799,
      // Line 4 — Allocable share of W-2 wages from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.4_a": 2340000,
      // Line 5 — Multiply line 4 by 50% (0.50) (Column A)
      "form-8995-a.0.line.5_a": 1170000,
      // Line 6 — Multiply line 4 by 25% (0.25) (Column A)
      "form-8995-a.0.line.6_a": 585000,
      // Line 9 — Add lines 6 and 8 (Column A)
      "form-8995-a.0.line.9_a": 585000,
      // Line 10 — Enter the greater of line 5 or line 9 (Column A)
      "form-8995-a.0.line.10_a": 1170000,
      // Line 11 — W-2 wage and UBIA of qualified property limitation. Enter the smaller of line 3
      "form-8995-a.0.line.11_a": 72799,
      // Line 13 — Qualified business income deduction before patron reduction. Enter the greater o
      "form-8995-a.0.line.13_a": 72799,
      // Line 15 — Qualified business income component. Subtract line 14 from line 13 (Column A)
      "form-8995-a.0.line.15_a": 72799,
      // Line 16 — Total qualified business income component. Add all amounts reported on line 15
      "form-8995-a.0.line.16": 72799,
      // Line 27 — Total qualified business income component from all qualified trades, businesses,
      "form-8995-a.1.line.27": 72799,
      // Line 32 — Qualified business income deduction before the income limitation. Add lines 27 a
      "form-8995-a.1.line.32": 72799,
      // Line 33 — Taxable income before qualified business income deduction
      "form-8995-a.1.line.33": 348243,
      // Line 35 — Subtract line 34 from line 33. If zero or less, enter -0-
      "form-8995-a.1.line.35": 348243,
      // Line 36 — Income limitation. Multiply line 35 by 20% (0.20)
      "form-8995-a.1.line.36": 69649,
      // Line 37 — Qualified business income deduction before the domestic production activities de
      "form-8995-a.1.line.37": 69649,
      // Line 39 — Total qualified business income deduction. Add lines 37 and 38
      "form-8995-a.1.line.39": 69649,
    },
  },
  "form-3800": {
    engineFields: {
      // Line 7 — Regular tax before credits
      "form-3800.0.line.7_regular_tax_before_credits": 67055,
      // Line 9 — Add lines 7 and 8
      "form-3800.0.line.9_regular_tax_plus_amt": 67055,
      // Line 11 — Net income tax. Subtract line 10c from line 9
      "form-3800.0.line.11_net_income_tax": 67055,
      // Line 12 — Net regular tax. Subtract line 10c from line 7. If zero or less, enter -0-
      "form-3800.0.line.12_net_regular_tax": 67055,
      // Line 13 — Enter 25% (0.25) of the excess, if any, of line 12 (line 11 for corporations) ov
      "form-3800.0.line.13_25_percent_of_excess": 10514,
      // Line 27 — Subtract line 13 from line 11. If zero or less, enter -0-
      "form-3800.1.line.27_subtract_line_13_from_11": 56541,
      // Line 29 — Subtract line 28 from line 27. If zero or less, enter -0-
      "form-3800.1.line.29_subtract_line_28_from_27": 56541,
      // Line 30 — Enter the general business credit from line 5 of Part III: combine column (e) wi
      "form-3800.1.line.30_specified_general_business_credit": 65001,
      // Line 36 — Add lines 30, 33, 34, and 35
      "form-3800.1.line.36_add_lines_30_33_34_35": 65001,
      // Line 37 — Enter the smaller of line 29 or line 36. This is the amount allowed for specifie
      "form-3800.1.line.37_specified_credits_allowed": 56541,
      // Line 38 — Credit allowed for the current year. Add lines 28 and 37
      "form-3800.1.line.38_credit_allowed_current_year": 56541,
      // Line 4i — Form 6765 (ESB): (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.4i_form_6765_esb_col_e": 65001,
      // Line 4i — Form 6765 (ESB): (g) Combine columns (e) and (f) with the credit from column (d)
      "form-3800.3.part3.4i_form_6765_esb_col_g": 65001,
      // Line 5 — Add lines 4a–4z: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.5_add_lines_4a_4z_col_e": 65001,
      // Line 5 — Add lines 4a–4z: (g) Combine columns (e) and (f) with the credit from column (d)
      "form-3800.3.part3.5_add_lines_4a_4z_col_g": 65001,
      // Line 6 — Add lines 2, 3, and 5: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.6_add_lines_2_3_5_col_e": 65001,
      // Line 6 — Add lines 2, 3, and 5: (g) Combine columns (e) and (f) with the credit from colum
      "form-3800.3.part3.6_add_lines_2_3_5_col_g": 65001,
    },
  },
  "form-8959": {
    engineFields: {
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 200000,
      // Line 8 — Self-employment income from Schedule SE (Form 1040), Part I, line 6
      "form-8959.0.line.8_self_employment_income": 350930,
      // Line 9 — Enter the following amount for your filing status
      "form-8959.0.line.9_filing_status_threshold_se": 200000,
      // Line 11 — Subtract line 10 from line 9. If zero or less, enter -0-
      "form-8959.0.line.11_threshold_reduced_by_wages": 200000,
      // Line 12 — Subtract line 11 from line 8. If zero or less, enter -0-
      "form-8959.0.line.12_excess_se_income": 150930,
      // Line 13 — Additional Medicare Tax on self-employment income. Multiply line 12 by 0.9% (0.0
      "form-8959.0.line.13_additional_medicare_tax_se": 1358,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 1358,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 32013,
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 1358,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 33371,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 6a — General business credit. Attach Form 3800
      "schedule-3.0.line.6a": 56541,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 56541,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 56541,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 380000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 380000,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 16007,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 363993,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 363993,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 69649,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 85399,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 278594,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 67055,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 67055,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 56541,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 56541,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 10514,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 33371,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 43885,
      // Line 26 — 2025 estimated tax payments and amount applied from 2024 return
      "form-1040.line.26": 88000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 88000,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 44115,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 44115,
    },
  },
};

export function denaExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
