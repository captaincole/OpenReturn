/*
 * adine — LOCKED expected values, drafted from the engine's
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
  "schedule-f": {
    engineFields: {
      // Line 2 — Sales of livestock, produce, grains, and other products you raised
      "schedule-f.0.line.2_sales_products_raised": 268500,
      // Line 4a — Agricultural program payments
      "schedule-f.0.line.4a_agricultural_program_payments": 6200,
      // Line 4b — Agricultural program payments: Taxable amount
      "schedule-f.0.line.4b_agricultural_program_taxable": 6200,
      // Line 6a — Crop insurance proceeds and federal crop disaster payments: Amount received in 2
      "schedule-f.0.line.6a_crop_insurance_received": 9400,
      // Line 6b — Crop insurance proceeds and federal crop disaster payments: Taxable amount
      "schedule-f.0.line.6b_crop_insurance_taxable": 9400,
      // Line 7 — Custom hire (machine work) income
      "schedule-f.0.line.7_custom_hire_income": 3100,
      // Line 9 — Gross income. Add amounts in the right column (lines 1c, 2, 3b, 4b, 5a, 5c, 6b, 6
      "schedule-f.0.line.9_gross_income": 287200,
      // Line 11 — Chemicals
      "schedule-f.0.line.11_chemicals": 7400,
      // Line 12 — Conservation expenses
      "schedule-f.0.line.12_conservation_expenses": 2000,
      // Line 24b — Rent or lease: Other (land, animals, etc.)
      "schedule-f.0.line.24b_rent_other": 12000,
      // Line 13 — Custom hire (machine work)
      "schedule-f.0.line.13_custom_hire_expense": 6800,
      // Line 25 — Repairs and maintenance
      "schedule-f.0.line.25_repairs_maintenance": 7300,
      // Line 26 — Seeds and plants
      "schedule-f.0.line.26_seeds_plants": 8900,
      // Line 14 — Depreciation and section 179 expense
      "schedule-f.0.line.14_depreciation_section_179": 15200,
      // Line 28 — Supplies
      "schedule-f.0.line.28_supplies": 2600,
      // Line 29 — Taxes
      "schedule-f.0.line.29_taxes": 3500,
      // Line 16 — Feed
      "schedule-f.0.line.16_feed": 9600,
      // Line 30 — Utilities
      "schedule-f.0.line.30_utilities": 2100,
      // Line 17 — Fertilizers and lime
      "schedule-f.0.line.17_fertilizers_lime": 18300,
      // Line 31 — Veterinary, breeding, and medicine
      "schedule-f.0.line.31_veterinary_breeding_medicine": 1900,
      // Line 18 — Freight and trucking
      "schedule-f.0.line.18_freight_trucking": 2900,
      // Line 19 — Gasoline, fuel, and oil
      "schedule-f.0.line.19_gasoline_fuel_oil": 11200,
      // Line 32a — Other expenses (specify): amount
      "schedule-f.0.line.32a_other_expenses_amount": 1500,
      // Line 20 — Insurance (other than health)
      "schedule-f.0.line.20_insurance_other_than_health": 6400,
      // Line 21b — Interest: Other
      "schedule-f.0.line.21b_interest_other": 4100,
      // Line 33 — Total expenses. Add lines 10 through 32f
      "schedule-f.0.line.33_total_expenses": 123700,
      // Line 34 — Net farm profit or (loss). Subtract line 33 from line 9
      "schedule-f.0.line.34_net_farm_profit_loss": 163500,
    },
  },
  "form-4797": {
    engineFields: {
      // Line 6 — Gain, if any, from line 32, from other than casualty or theft
      "form-4797.0.line.6_gain_from_line_32": 24000,
      // Line 7 — Combine lines 2 through 6. Enter the gain or (loss) here and on the appropriate l
      "form-4797.0.line.7_net_section_1231_gain_loss": 24000,
      // Line 20 — Gross sales price — Property A
      "form-4797.1.line.20_gross_sales_price_col_a": 24000,
      // Line 24 — Total gain. Subtract line 23 from line 20 — Property A
      "form-4797.1.line.24_total_gain_col_a": 24000,
      // Line 30 — Total gains for all properties. Add property columns A through D, line 24
      "form-4797.1.line.30_total_gains_all_properties": 24000,
      // Line 32 — Subtract line 31 from line 30
      "form-4797.1.line.32_gain_less_recapture": 24000,
    },
  },
  "schedule-d": {
    engineFields: {
      // Line 11 — Gain from Form 4797, Part I; long-term gain from Forms 2439 and 6252; and long-t
      "schedule-d.0.line.11_long_term_gain_other_forms": 24000,
      // Line 15 — Net long-term capital gain or (loss). Combine lines 8a through 14 in column (h)
      "schedule-d.0.line.15_net_long_term_gain_loss": 24000,
      // Line 16 — Combine lines 7 and 15 and enter the result
      "schedule-d.1.line.16_combined_gain_loss": 24000,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 1a — Net farm profit or (loss) from Schedule F, line 34, and farm partnerships, Sched
      "schedule-se.0.line.1a": 163500,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 163500,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 150992,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 150992,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 150992,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 18723,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 4379,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 23102,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 11551,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 6 — Farm income or (loss). Attach Schedule F
      "schedule-1.0.line.6": 163500,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 163500,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 11551,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 11551,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": 151949,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": 151949,
      // Line 4 — Total qualified business income. Combine lines 2 and 3. If zero or less, enter -0
      "form-8995.0.line.4": 151949,
      // Line 5 — Qualified business income component. Multiply line 4 by 20% (0.20)
      "form-8995.0.line.5": 30390,
      // Line 10 — Qualified business income deduction before the income limitation. Add lines 5 an
      "form-8995.0.line.10": 30390,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 161299,
      // Line 12 — Enter your net capital gain, if any, increased by any qualified dividends
      "form-8995.0.line.12": 24000,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 137299,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 27460,
      // Line 15 — Qualified business income deduction. Enter the smaller of line 10 or line 14
      "form-8995.0.line.15": 27460,
    },
  },
  "schedule-j": {
    engineFields: {
      // Line 1 — Enter the taxable income from your 2025 Form 1040, 1040-SR, or 1040-NR, line 15
      "schedule-j.0.line.1_taxable_income_2025": 133839,
      // Line 2a — Enter your elected farm income. Do not enter more than the amount on line 1
      "schedule-j.0.line.2a_elected_farm_income": 100000,
      // Line 2b — Capital gain included on line 2a: excess, if any, of net long-term capital gain
      "schedule-j.0.line.2b_net_capital_gain_included": 24000,
      // Line 3 — Subtract line 2a from line 1
      "schedule-j.0.line.3_income_less_elected_farm": 33839,
      // Line 4 — Figure the tax on the amount on line 3 using the 2025 tax rates
      "schedule-j.0.line.4_tax_on_line3_2025": 3821,
      // Line 5 — If you used Schedule J to figure your tax for 2024, enter the amount from your 20
      "schedule-j.0.line.5_base_year_income_2022": 21400,
      // Line 6 — Divide the amount on line 2a by 3.0
      "schedule-j.0.line.6_one_third_farm_income": 33333,
      // Line 7 — Combine lines 5 and 6. If zero or less, enter -0-
      "schedule-j.0.line.7_combined_income_2022": 54733,
      // Line 8 — Figure the tax on the amount on line 7 using the 2022 tax rates
      "schedule-j.0.line.8_tax_on_line7_2022": 7098,
      // Line 9 — If you used Schedule J to figure your tax for 2024, enter the amount from your 20
      "schedule-j.0.line.9_base_year_income_2023": 34250,
      // Line 10 — Enter the amount from line 6
      "schedule-j.0.line.10_amount_from_line6": 33333,
      // Line 11 — Combine lines 9 and 10. If less than zero, enter as a negative amount
      "schedule-j.0.line.11_combined_income_2023": 67583,
      // Line 12 — Figure the tax on the amount on line 11 using the 2023 tax rates
      "schedule-j.0.line.12_tax_on_line11_2023": 9616,
      // Line 13 — If you used Schedule J to figure your tax for 2024, enter the amount from your 2
      "schedule-j.0.line.13_base_year_income_2024": 52800,
      // Line 14 — Enter the amount from line 6
      "schedule-j.0.line.14_amount_from_line6": 33333,
      // Line 15 — Combine lines 13 and 14. If less than zero, enter as a negative amount
      "schedule-j.0.line.15_combined_income_2024": 86133,
      // Line 16 — Figure the tax on the amount on line 15 using the 2024 tax rates
      "schedule-j.0.line.16_tax_on_line15_2024": 13316,
      // Line 17 — Add lines 4, 8, 12, and 16
      "schedule-j.0.line.17_total_base_year_tax": 33851,
      // Line 18 — Amount from line 17
      "schedule-j.1.line.18_amount_from_line_17": 33851,
      // Line 19 — If you used Schedule J to figure your tax for: 2024, enter the amount from your
      "schedule-j.1.line.19_base_year_2022_tax": 2366,
      // Line 20 — If you used Schedule J to figure your tax for: 2024, enter the amount from your
      "schedule-j.1.line.20_base_year_2023_tax": 3893,
      // Line 21 — If you used Schedule J to figure your tax for 2024, enter the amount from your 2
      "schedule-j.1.line.21_base_year_2024_tax": 6549,
      // Line 22 — Add lines 19 through 21
      "schedule-j.1.line.22_add_lines_19_through_21": 12808,
      // Line 23 — Tax. Subtract line 22 from line 18
      "schedule-j.1.line.23_tax": 21043,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 23102,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 23102,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 2b — Taxable interest
      "form-1040.line.2b": 1100,
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": 24000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 163500,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 188600,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 11551,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 177049,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 177049,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 27460,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 43210,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 133839,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 21043,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 21043,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 21043,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 23102,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 44145,
      // Line 26 — 2025 estimated tax payments and amount applied from 2024 return
      "form-1040.line.26": 48000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 48000,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 3855,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 3855,
    },
  },
};

export function adineExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
