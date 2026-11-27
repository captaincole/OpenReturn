/*
 * hari — LOCKED expected values, drafted from the engine's
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
  "form-8881": {
    engineFields: {
      // Line A — Enter the number of qualifying employees
      "form-8881.0.line.a_qualifying_employees": 12,
      // Line 1 — Qualified startup costs incurred during the tax year
      "form-8881.0.line.1_qualified_startup_costs": 1250,
      // Line 2 — Employers with 1–50 employees enter the amount from line 1. Employers with 51–100
      "form-8881.0.line.2_startup_costs_by_employer_size": 1250,
      // Line 3 — Enter the number of employees eligible to participate in the pension plan
      "form-8881.0.line.3_eligible_employees": 1,
      // Line 3 — Number of eligible employees x $250
      "form-8881.0.line.3_multiply_eligible_employees_by_250": 250,
      // Line 4 — Enter the greater of $500 or the amount from line 3 (Do not enter more than $5,00
      "form-8881.0.line.4_greater_of_500_or_3": 500,
      // Line 5 — Enter the smaller of line 2 or line 4
      "form-8881.0.line.5_smaller_of_2_or_4": 500,
      // Line 6a — Enter the number of employees from the preceding tax year
      "form-8881.0.line.6a_preceding_year_employees": 12,
      // Line 6b — Enter employer contributions made to the plan, but don't include (i) elective de
      "form-8881.0.line.6b_employer_contributions": 1900,
      // Line 6c — For employees for whom you made matching and nonelective contributions of more t
      "form-8881.0.line.6c_contributions_over_1000": 2000,
      // Line 6d — Add lines 6b and 6c
      "form-8881.0.line.6d_add_lines": 3900,
      // Line 6f — If you did NOT complete line 6e, enter the amount from line 6d. If you completed
      "form-8881.0.line.6f_contributions_after_phaseout": 3900,
      // Line 6g — Applicable percentages: first or second year of the plan, enter the amount from
      "form-8881.0.line.6g_applicable_percentage_amount": 3900,
      // Line 8 — Add lines 5, 6g, and 7
      "form-8881.0.line.8_total_part_i_credits": 4400,
    },
  },
  "schedule-f": {
    engineFields: {
      // Line 2 — Sales of livestock, produce, grains, and other products you raised
      "schedule-f.0.line.2_sales_products_raised": 610000,
      // Line 9 — Gross income. Add amounts in the right column (lines 1c, 2, 3b, 4b, 5a, 5c, 6b, 6
      "schedule-f.0.line.9_gross_income": 610000,
      // Line 23 — Pension and profit-sharing plans
      "schedule-f.0.line.23_pension_profit_sharing": 1750,
      // Line 11 — Chemicals
      "schedule-f.0.line.11_chemicals": 48000,
      // Line 25 — Repairs and maintenance
      "schedule-f.0.line.25_repairs_maintenance": 22800,
      // Line 26 — Seeds and plants
      "schedule-f.0.line.26_seeds_plants": 33400,
      // Line 29 — Taxes
      "schedule-f.0.line.29_taxes": 18600,
      // Line 30 — Utilities
      "schedule-f.0.line.30_utilities": 7300,
      // Line 17 — Fertilizers and lime
      "schedule-f.0.line.17_fertilizers_lime": 61000,
      // Line 19 — Gasoline, fuel, and oil
      "schedule-f.0.line.19_gasoline_fuel_oil": 39500,
      // Line 20 — Insurance (other than health)
      "schedule-f.0.line.20_insurance_other_than_health": 14200,
      // Line 22 — Labor hired (less employment credits)
      "schedule-f.0.line.22_labor_hired": 236000,
      // Line 33 — Total expenses. Add lines 10 through 32f
      "schedule-f.0.line.33_total_expenses": 482550,
      // Line 34 — Net farm profit or (loss). Subtract line 33 from line 9
      "schedule-f.0.line.34_net_farm_profit_loss": 127450,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 1a — Net farm profit or (loss) from Schedule F, line 34, and farm partnerships, Sched
      "schedule-se.0.line.1a": 127450,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 127450,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 117700,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 117700,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 117700,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 14595,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 3413,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 18008,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 9004,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 6 — Farm income or (loss). Attach Schedule F
      "schedule-1.0.line.6": 127450,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 127450,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 9004,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 9004,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": 118446,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": 118446,
      // Line 4 — Total qualified business income. Combine lines 2 and 3. If zero or less, enter -0
      "form-8995.0.line.4": 118446,
      // Line 5 — Qualified business income component. Multiply line 4 by 20% (0.20)
      "form-8995.0.line.5": 23689,
      // Line 10 — Qualified business income deduction before the income limitation. Add lines 5 an
      "form-8995.0.line.10": 23689,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 102696,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 102696,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 20539,
      // Line 15 — Qualified business income deduction. Enter the smaller of line 10 or line 14
      "form-8995.0.line.15": 20539,
    },
  },
  "form-6251": {
    engineFields: {
      // Line 1a — Subtract Schedule 1-A (Form 1040), line 37, from Form 1040, 1040-SR, or 1040-NR,
      "form-6251.0.line.1a_deductions_less_schedule_1a": 36289,
      // Line 1b — Subtract line 1a from Form 1040, 1040-SR, or 1040-NR, line 11b (if less than zer
      "form-6251.0.line.1b_taxable_income_start": 82157,
      // Line 2a — If filing Schedule A (Form 1040), enter the taxes from Schedule A, line 7; other
      "form-6251.0.line.2a_taxes_or_standard_deduction": 15750,
      // Line 4 — Alternative minimum taxable income. Combine lines 1b through 3
      "form-6251.0.line.4_alternative_minimum_taxable_income": 97907,
      // Line 5 — Exemption
      "form-6251.0.line.5_exemption": 88100,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-6251.0.line.6_amti_less_exemption": 9807,
      // Line 7 — Tax on line 6: complete Part III and enter line 40 if you have capital gain distr
      "form-6251.0.line.7_tax_on_line_6": 2550,
      // Line 9 — Tentative minimum tax. Subtract line 8 from line 7
      "form-6251.0.line.9_tentative_minimum_tax": 2550,
      // Line 10 — Add Form 1040 or 1040-SR, line 16 (minus any tax from Form 4972), and Schedule 2
      "form-6251.0.line.10_regular_tax_less_credits": 12993,
    },
  },
  "form-3800": {
    engineFields: {
      // Line 1 — Credits not subject to the passive activity limit from Part III, line 2: combine
      "form-3800.0.line.1_credits_not_passive_limited": 4400,
      // Line 6 — Add lines 1, 3, 4, and 5
      "form-3800.0.line.6_total_credits_not_allowed_tmt": 4400,
      // Line 7 — Regular tax before credits
      "form-3800.0.line.7_regular_tax_before_credits": 12993,
      // Line 9 — Add lines 7 and 8
      "form-3800.0.line.9_regular_tax_plus_amt": 12993,
      // Line 11 — Net income tax. Subtract line 10c from line 9
      "form-3800.0.line.11_net_income_tax": 12993,
      // Line 12 — Net regular tax. Subtract line 10c from line 7. If zero or less, enter -0-
      "form-3800.0.line.12_net_regular_tax": 12993,
      // Line 14 — Tentative minimum tax
      "form-3800.0.line.14_tentative_minimum_tax": 2550,
      // Line 15 — Enter the greater of line 13 or line 14
      "form-3800.0.line.15_greater_of_line_13_or_14": 2550,
      // Line 16 — Subtract line 15 from line 11. If zero or less, enter -0-
      "form-3800.0.line.16_net_income_tax_less_line_15": 10443,
      // Line 17 — Enter the smaller of line 6 or line 16. This is the amount of your credit allowe
      "form-3800.0.line.17_credit_allowed_after_38c1_limit": 4400,
      // Line 27 — Subtract line 13 from line 11. If zero or less, enter -0-
      "form-3800.1.line.27_subtract_line_13_from_11": 12993,
      // Line 28 — Add lines 17 and 26
      "form-3800.1.line.28_add_lines_17_and_26": 4400,
      // Line 29 — Subtract line 28 from line 27. If zero or less, enter -0-
      "form-3800.1.line.29_subtract_line_28_from_27": 8593,
      // Line 38 — Credit allowed for the current year. Add lines 28 and 37
      "form-3800.1.line.38_credit_allowed_current_year": 4400,
      // Line 1j — Form 8881, Part I — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.1j_form_8881_part_i_col_e": 4400,
      // Line 1j — Form 8881, Part I — (g) Combine columns (e) and (f) with the credit from column
      "form-3800.2.part3.1j_form_8881_part_i_col_g": 4400,
      // Line 2 — Add lines 1a–1zz — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.2_add_lines_1a_1zz_col_e": 4400,
      // Line 2 — Add lines 1a–1zz — (g) Combine columns (e) and (f) with the credit from column (d
      "form-3800.2.part3.2_add_lines_1a_1zz_col_g": 4400,
      // Line 6 — Add lines 2, 3, and 5: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.6_add_lines_2_3_5_col_e": 4400,
      // Line 6 — Add lines 2, 3, and 5: (g) Combine columns (e) and (f) with the credit from colum
      "form-3800.3.part3.6_add_lines_2_3_5_col_g": 4400,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 18008,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 18008,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 6a — General business credit. Attach Form 3800
      "schedule-3.0.line.6a": 4400,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 4400,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 4400,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 127450,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 127450,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 9004,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 118446,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 118446,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 20539,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 36289,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 82157,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 12993,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 12993,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 4400,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 4400,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 8593,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 18008,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 26601,
      // Line 26 — 2025 estimated tax payments and amount applied from 2024 return
      "form-1040.line.26": 28000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 28000,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 1399,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 1399,
    },
  },
};

export function hariExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
