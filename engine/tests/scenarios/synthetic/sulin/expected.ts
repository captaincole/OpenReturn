/*
 * sulin — LOCKED expected values, drafted from the engine's
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
      "form-8941.0.line.1_number_of_employees": 4,
      // Line 2 — Enter the number of full-time equivalent employees (FTEs) you had for the tax yea
      "form-8941.0.line.2_full_time_equivalent_employees": 3,
      // Line 3 — Average annual wages you paid for the tax year (from Worksheet 3, line 3). This a
      "form-8941.0.line.3_average_annual_wages": 32000,
      // Line 4 — Premiums you paid during the tax year for employees included on line 1 for health
      "form-8941.0.line.4_premiums_paid_qualifying_arrangement": 24800,
      // Line 5 — Premiums you would have entered on line 4 if the total premium for each employee
      "form-8941.0.line.5_premiums_at_average_premium": 22976,
      // Line 6 — Enter the smaller of line 4 or line 5
      "form-8941.0.line.6_smaller_of_4_or_5": 22976,
      // Line 7 — Multiply line 6 by the applicable percentage: tax-exempt small employers, 35% (0.
      "form-8941.0.line.7_multiply_6_by_applicable_percentage": 11488,
      // Line 8 — If line 2 is 10 or less, enter the amount from line 7. Otherwise, enter the amoun
      "form-8941.0.line.8_fte_phaseout_amount": 11488,
      // Line 9 — If line 3 is $33,000 or less, enter the amount from line 8. Otherwise, enter the
      "form-8941.0.line.9_wage_phaseout_amount": 11488,
      // Line 11 — Subtract line 10 from line 4. If zero or less, enter -0-
      "form-8941.0.line.11_subtract_10_from_4": 24800,
      // Line 12 — Enter the smaller of line 9 or line 11
      "form-8941.0.line.12_smaller_of_9_or_11": 11488,
      // Line 13 — If line 12 is zero, skip lines 13 and 14 and go to line 15. Otherwise, enter the
      "form-8941.0.line.13_employees_with_premiums_paid": 3,
      // Line 14 — Enter the number of FTEs you would have entered on line 2 if you only included e
      "form-8941.0.line.14_ftes_for_line_13_employees": 3,
      // Line 16 — Add lines 12 and 15
      "form-8941.0.line.16_add_lines_12_and_15": 11488,
    },
  },
  "form-3800": {
    engineFields: {
      // Line 7 — Regular tax before credits
      "form-3800.0.line.7_regular_tax_before_credits": 23545,
      // Line 9 — Add lines 7 and 8
      "form-3800.0.line.9_regular_tax_plus_amt": 23545,
      // Line 11 — Net income tax. Subtract line 10c from line 9
      "form-3800.0.line.11_net_income_tax": 23545,
      // Line 12 — Net regular tax. Subtract line 10c from line 7. If zero or less, enter -0-
      "form-3800.0.line.12_net_regular_tax": 23545,
      // Line 27 — Subtract line 13 from line 11. If zero or less, enter -0-
      "form-3800.1.line.27_subtract_line_13_from_11": 23545,
      // Line 29 — Subtract line 28 from line 27. If zero or less, enter -0-
      "form-3800.1.line.29_subtract_line_28_from_27": 23545,
      // Line 30 — Enter the general business credit from line 5 of Part III: combine column (e) wi
      "form-3800.1.line.30_specified_general_business_credit": 11488,
      // Line 36 — Add lines 30, 33, 34, and 35
      "form-3800.1.line.36_add_lines_30_33_34_35": 11488,
      // Line 37 — Enter the smaller of line 29 or line 36. This is the amount allowed for specifie
      "form-3800.1.line.37_specified_credits_allowed": 11488,
      // Line 38 — Credit allowed for the current year. Add lines 28 and 37
      "form-3800.1.line.38_credit_allowed_current_year": 11488,
      // Line 4h — Form 8941: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.4h_form_8941_col_e": 11488,
      // Line 4h — Form 8941: (g) Combine columns (e) and (f) with the credit from column (d) allow
      "form-3800.3.part3.4h_form_8941_col_g": 11488,
      // Line 5 — Add lines 4a–4z: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.5_add_lines_4a_4z_col_e": 11488,
      // Line 5 — Add lines 4a–4z: (g) Combine columns (e) and (f) with the credit from column (d)
      "form-3800.3.part3.5_add_lines_4a_4z_col_g": 11488,
      // Line 6 — Add lines 2, 3, and 5: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.6_add_lines_2_3_5_col_e": 11488,
      // Line 6 — Add lines 2, 3, and 5: (g) Combine columns (e) and (f) with the credit from colum
      "form-3800.3.part3.6_add_lines_2_3_5_col_g": 11488,
    },
  },
  "schedule-f": {
    engineFields: {
      // Line 2 — Sales of livestock, produce, grains, and other products you raised
      "schedule-f.0.line.2_sales_products_raised": 480000,
      // Line 9 — Gross income. Add amounts in the right column (lines 1c, 2, 3b, 4b, 5a, 5c, 6b, 6
      "schedule-f.0.line.9_gross_income": 480000,
      // Line 11 — Chemicals
      "schedule-f.0.line.11_chemicals": 18000,
      // Line 25 — Repairs and maintenance
      "schedule-f.0.line.25_repairs_maintenance": 14000,
      // Line 26 — Seeds and plants
      "schedule-f.0.line.26_seeds_plants": 38000,
      // Line 14 — Depreciation and section 179 expense
      "schedule-f.0.line.14_depreciation_section_179": 22000,
      // Line 15 — Employee benefit programs other than on line 23
      "schedule-f.0.line.15_employee_benefit_programs": 13312,
      // Line 29 — Taxes
      "schedule-f.0.line.29_taxes": 7500,
      // Line 30 — Utilities
      "schedule-f.0.line.30_utilities": 4200,
      // Line 17 — Fertilizers and lime
      "schedule-f.0.line.17_fertilizers_lime": 46000,
      // Line 19 — Gasoline, fuel, and oil
      "schedule-f.0.line.19_gasoline_fuel_oil": 21000,
      // Line 20 — Insurance (other than health)
      "schedule-f.0.line.20_insurance_other_than_health": 9000,
      // Line 22 — Labor hired (less employment credits)
      "schedule-f.0.line.22_labor_hired": 98000,
      // Line 33 — Total expenses. Add lines 10 through 32f
      "schedule-f.0.line.33_total_expenses": 291012,
      // Line 34 — Net farm profit or (loss). Subtract line 33 from line 9
      "schedule-f.0.line.34_net_farm_profit_loss": 188988,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 1a — Net farm profit or (loss) from Schedule F, line 34, and farm partnerships, Sched
      "schedule-se.0.line.1a": 188988,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 188988,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 174530,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 174530,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 174530,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 21642,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 5061,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 26703,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 13352,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 6 — Farm income or (loss). Attach Schedule F
      "schedule-1.0.line.6": 188988,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 188988,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 13352,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 13352,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": 175636,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": 175636,
      // Line 4 — Total qualified business income. Combine lines 2 and 3. If zero or less, enter -0
      "form-8995.0.line.4": 175636,
      // Line 5 — Qualified business income component. Multiply line 4 by 20% (0.20)
      "form-8995.0.line.5": 35127,
      // Line 10 — Qualified business income deduction before the income limitation. Add lines 5 an
      "form-8995.0.line.10": 35127,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 159886,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 159886,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 31977,
      // Line 15 — Qualified business income deduction. Enter the smaller of line 10 or line 14
      "form-8995.0.line.15": 31977,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 26703,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 26703,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 6a — General business credit. Attach Form 3800
      "schedule-3.0.line.6a": 11488,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 11488,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 11488,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 188988,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 188988,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 13352,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 175636,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 175636,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 31977,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 47727,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 127909,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 23545,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 23545,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 11488,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 11488,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 12057,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 26703,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 38760,
      // Line 26 — 2025 estimated tax payments and amount applied from 2024 return
      "form-1040.line.26": 36000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 36000,
      // Line 37 — Amount you owe
      "form-1040.line.37": 2760,
    },
  },
};

export function sulinExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
