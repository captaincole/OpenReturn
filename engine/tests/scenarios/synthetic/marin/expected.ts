/*
 * marin — LOCKED expected values, drafted from the engine's
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
  "form-8844": {
    engineFields: {
      // Line 1 — Enter the total qualified empowerment zone wages paid or incurred during the curr
      "form-8844.0.line.1_qualified_empowerment_zone_wages": 21500,
      // Line 2 — Multiply line 1 by 20% (0.20)
      "form-8844.0.line.2_multiply_1_by_20_percent": 4300,
      // Line 4 — Add lines 2 and 3
      "form-8844.0.line.4_add_lines": 4300,
    },
  },
  "schedule-f": {
    engineFields: {
      // Line 2 — Sales of livestock, produce, grains, and other products you raised
      "schedule-f.0.line.2_sales_products_raised": 184000,
      // Line 9 — Gross income. Add amounts in the right column (lines 1c, 2, 3b, 4b, 5a, 5c, 6b, 6
      "schedule-f.0.line.9_gross_income": 184000,
      // Line 25 — Repairs and maintenance
      "schedule-f.0.line.25_repairs_maintenance": 4000,
      // Line 30 — Utilities
      "schedule-f.0.line.30_utilities": 3000,
      // Line 17 — Fertilizers and lime
      "schedule-f.0.line.17_fertilizers_lime": 12000,
      // Line 19 — Gasoline, fuel, and oil
      "schedule-f.0.line.19_gasoline_fuel_oil": 6500,
      // Line 22 — Labor hired (less employment credits)
      "schedule-f.0.line.22_labor_hired": 41300,
      // Line 33 — Total expenses. Add lines 10 through 32f
      "schedule-f.0.line.33_total_expenses": 66800,
      // Line 34 — Net farm profit or (loss). Subtract line 33 from line 9
      "schedule-f.0.line.34_net_farm_profit_loss": 117200,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 1a — Net farm profit or (loss) from Schedule F, line 34, and farm partnerships, Sched
      "schedule-se.0.line.1a": 117200,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 117200,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 108234,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 108234,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 108234,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 13421,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 3139,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 16560,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 8280,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 6 — Farm income or (loss). Attach Schedule F
      "schedule-1.0.line.6": 117200,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 117200,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 8280,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 8280,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": 108920,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": 108920,
      // Line 4 — Total qualified business income. Combine lines 2 and 3. If zero or less, enter -0
      "form-8995.0.line.4": 108920,
      // Line 5 — Qualified business income component. Multiply line 4 by 20% (0.20)
      "form-8995.0.line.5": 21784,
      // Line 10 — Qualified business income deduction before the income limitation. Add lines 5 an
      "form-8995.0.line.10": 21784,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 93170,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 93170,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 18634,
      // Line 15 — Qualified business income deduction. Enter the smaller of line 10 or line 14
      "form-8995.0.line.15": 18634,
    },
  },
  "form-6251": {
    engineFields: {
      // Line 1a — Subtract Schedule 1-A (Form 1040), line 37, from Form 1040, 1040-SR, or 1040-NR,
      "form-6251.0.line.1a_deductions_less_schedule_1a": 34384,
      // Line 1b — Subtract line 1a from Form 1040, 1040-SR, or 1040-NR, line 11b (if less than zer
      "form-6251.0.line.1b_taxable_income_start": 74536,
      // Line 2a — If filing Schedule A (Form 1040), enter the taxes from Schedule A, line 7; other
      "form-6251.0.line.2a_taxes_or_standard_deduction": 15750,
      // Line 4 — Alternative minimum taxable income. Combine lines 1b through 3
      "form-6251.0.line.4_alternative_minimum_taxable_income": 90286,
      // Line 5 — Exemption
      "form-6251.0.line.5_exemption": 88100,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-6251.0.line.6_amti_less_exemption": 2186,
      // Line 7 — Tax on line 6: complete Part III and enter line 40 if you have capital gain distr
      "form-6251.0.line.7_tax_on_line_6": 568,
      // Line 9 — Tentative minimum tax. Subtract line 8 from line 7
      "form-6251.0.line.9_tentative_minimum_tax": 568,
      // Line 10 — Add Form 1040 or 1040-SR, line 16 (minus any tax from Form 4972), and Schedule 2
      "form-6251.0.line.10_regular_tax_less_credits": 11310,
    },
  },
  "form-3800": {
    engineFields: {
      // Line 7 — Regular tax before credits
      "form-3800.0.line.7_regular_tax_before_credits": 11310,
      // Line 9 — Add lines 7 and 8
      "form-3800.0.line.9_regular_tax_plus_amt": 11310,
      // Line 11 — Net income tax. Subtract line 10c from line 9
      "form-3800.0.line.11_net_income_tax": 11310,
      // Line 12 — Net regular tax. Subtract line 10c from line 7. If zero or less, enter -0-
      "form-3800.0.line.12_net_regular_tax": 11310,
      // Line 14 — Tentative minimum tax
      "form-3800.0.line.14_tentative_minimum_tax": 568,
      // Line 15 — Enter the greater of line 13 or line 14
      "form-3800.0.line.15_greater_of_line_13_or_14": 568,
      // Line 16 — Subtract line 15 from line 11. If zero or less, enter -0-
      "form-3800.0.line.16_net_income_tax_less_line_15": 10742,
      // Line 18 — Multiply line 14 by 75% (0.75)
      "form-3800.1.line.18_multiply_line_14_by_75_percent": 426,
      // Line 19 — Enter the greater of line 13 or line 18
      "form-3800.1.line.19_greater_of_line_13_or_18": 426,
      // Line 20 — Subtract line 19 from line 11. If zero or less, enter -0-
      "form-3800.1.line.20_subtract_line_19_from_11": 10884,
      // Line 21 — Subtract line 17 from line 20. If zero or less, enter -0-
      "form-3800.1.line.21_subtract_line_17_from_20": 10884,
      // Line 22 — Combine the amounts from Part III, line 3, column (e), with the amount from Part
      "form-3800.1.line.22_empowerment_zone_credit_combined": 4300,
      // Line 25 — Add lines 22 and 24
      "form-3800.1.line.25_add_lines_22_and_24": 4300,
      // Line 26 — Empowerment zone and renewal community employment credit allowed. Enter the smal
      "form-3800.1.line.26_empowerment_zone_credit_allowed": 4300,
      // Line 27 — Subtract line 13 from line 11. If zero or less, enter -0-
      "form-3800.1.line.27_subtract_line_13_from_11": 11310,
      // Line 28 — Add lines 17 and 26
      "form-3800.1.line.28_add_lines_17_and_26": 4300,
      // Line 29 — Subtract line 28 from line 27. If zero or less, enter -0-
      "form-3800.1.line.29_subtract_line_28_from_27": 7010,
      // Line 30 — Enter the general business credit from line 5 of Part III: combine column (e) wi
      "form-3800.1.line.30_specified_general_business_credit": 2400,
      // Line 36 — Add lines 30, 33, 34, and 35
      "form-3800.1.line.36_add_lines_30_33_34_35": 2400,
      // Line 37 — Enter the smaller of line 29 or line 36. This is the amount allowed for specifie
      "form-3800.1.line.37_specified_credits_allowed": 2400,
      // Line 38 — Credit allowed for the current year. Add lines 28 and 37
      "form-3800.1.line.38_credit_allowed_current_year": 6700,
      // Line 3 — Form 8844: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.3_form_8844_col_e": 4300,
      // Line 3 — Form 8844: (g) Combine columns (e) and (f) with the credit from column (d) allowe
      "form-3800.3.part3.3_form_8844_col_g": 4300,
      // Line 4b — Form 5884: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.4b_form_5884_col_e": 2400,
      // Line 4b — Form 5884: (g) Combine columns (e) and (f) with the credit from column (d) allow
      "form-3800.3.part3.4b_form_5884_col_g": 2400,
      // Line 5 — Add lines 4a–4z: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.5_add_lines_4a_4z_col_e": 2400,
      // Line 5 — Add lines 4a–4z: (g) Combine columns (e) and (f) with the credit from column (d)
      "form-3800.3.part3.5_add_lines_4a_4z_col_g": 2400,
      // Line 6 — Add lines 2, 3, and 5: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.6_add_lines_2_3_5_col_e": 6700,
      // Line 6 — Add lines 2, 3, and 5: (g) Combine columns (e) and (f) with the credit from colum
      "form-3800.3.part3.6_add_lines_2_3_5_col_g": 6700,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 16560,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 16560,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 6a — General business credit. Attach Form 3800
      "schedule-3.0.line.6a": 6700,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 6700,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 6700,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 117200,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 117200,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 8280,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 108920,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 108920,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 18634,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 34384,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 74536,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 11310,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 11310,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 6700,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 6700,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 4610,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 16560,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 21170,
      // Line 37 — Amount you owe
      "form-1040.line.37": 21170,
    },
  },
};

export function marinExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
