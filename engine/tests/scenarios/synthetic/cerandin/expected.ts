/*
 * cerandin — LOCKED expected values, drafted from the engine's
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
  "form-2210-f": {
    engineFields: {
      // Line 1 — Enter your 2025 tax after credits from Form 1040, 1040-SR, or 1040-NR, line 22; o
      "form-2210-f.0.line.1_tax_after_credits": 12927,
      // Line 2 — Other taxes, including self-employment tax and, if applicable, Additional Medicar
      "form-2210-f.0.line.2_other_taxes": 15826,
      // Line 3 — Add lines 1 and 2
      "form-2210-f.0.line.3_add_lines_1_2": 28753,
      // Line 4 — Refundable credits
      "form-2210-f.0.line.4_refundable_credits": 972,
      // Line 6 — Current year tax. Subtract line 4 from line 3
      "form-2210-f.0.line.6_current_year_tax": 27781,
      // Line 7 — Multiply line 6 by 66 2/3% (0.667)
      "form-2210-f.0.line.7_two_thirds_current_tax": 18530,
      // Line 8 — Withholding taxes. Don't include any estimated tax payments on this line
      "form-2210-f.0.line.8_withholding_taxes": 1200,
      // Line 9 — Subtract line 8 from line 6
      "form-2210-f.0.line.9_tax_less_withholding": 26581,
      // Line 10 — Enter the tax shown on your 2024 tax return
      "form-2210-f.0.line.10_prior_year_tax": 21400,
      // Line 11 — Required annual payment. Enter the smaller of line 7 or line 10
      "form-2210-f.0.line.11_required_annual_payment": 18530,
      // Line 12 — Enter the estimated tax payments you made by January 15, 2026, and any federal i
      "form-2210-f.0.line.12_estimated_payments_withholding": 10200,
      // Line 13 — Underpayment. Subtract line 12 from line 11
      "form-2210-f.0.line.13_underpayment": 8330,
      // Line 15 — Number of days from January 15, 2026, to the date on line 14
      "form-2210-f.0.line.15_days_from_jan_15": 64,
      // Line 16 — Penalty. Underpayment on line 13 × (Number of days on line 15 ÷ 365) × 0.07
      "form-2210-f.0.line.16_penalty": 62,
    },
    renderedText: {
      "form-2210-f.0.header.taxpayer_name": "Cerandin Marrowby",
      // Line 14 — the balance is paid with the return on March 20, 2026
      "form-2210-f.0.line.14_payment_date_month": "03",
      "form-2210-f.0.line.14_payment_date_day": "20",
    },
    // Box A — the request to waive part of the penalty (the barn fire)
    renderedChecked: ["form-2210-f.0.line.box_a_waiver_request"],
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 14000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 14000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 112000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 126000,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 7913,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 118087,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 118087,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 20467,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 36217,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 81870,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 12927,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 12927,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 12927,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 15826,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 28753,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 1200,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 1200,
      // Line 26 — 2025 estimated tax payments and amount applied from 2024 return
      "form-1040.line.26": 9000,
      // Line 31 — Amount from Schedule 3, line 15
      "form-1040.line.31": 972,
      // Line 32 — Add lines 27a, 28, 29, 30, and 31. Total other payments and refundable credits
      "form-1040.line.32": 972,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 11172,
      // Line 37 — Amount you owe
      "form-1040.line.37": 17643,
      // Line 38 — Estimated tax penalty (see instructions)
      "form-1040.line.38": 62,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 6 — Farm income or (loss). Attach Schedule F
      "schedule-1.0.line.6": 112000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 112000,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 7913,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 7913,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 15826,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 15826,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 12 — Credit for federal tax on fuels. Attach Form 4136
      "schedule-3.0.line.12": 972,
      // Line 15 — Add lines 9 through 12 and 14. Enter here and on Form 1040, line 31
      "schedule-3.0.line.15": 972,
    },
  },
  "schedule-f": {
    engineFields: {
      // Line 2 — Sales of livestock, produce, grains, and other products you raised
      "schedule-f.0.line.2_sales_products_raised": 248000,
      // Line 4a — Agricultural program payments
      "schedule-f.0.line.4a_agricultural_program_payments": 12000,
      // Line 4b — Agricultural program payments: Taxable amount
      "schedule-f.0.line.4b_agricultural_program_taxable": 12000,
      // Line 9 — Gross income. Add amounts in the right column (lines 1c, 2, 3b, 4b, 5a, 5c, 6b, 6
      "schedule-f.0.line.9_gross_income": 260000,
      // Line 25 — Repairs and maintenance
      "schedule-f.0.line.25_repairs_maintenance": 11200,
      // Line 26 — Seeds and plants
      "schedule-f.0.line.26_seeds_plants": 4300,
      // Line 14 — Depreciation and section 179 expense
      "schedule-f.0.line.14_depreciation_section_179": 21000,
      // Line 28 — Supplies
      "schedule-f.0.line.28_supplies": 7900,
      // Line 29 — Taxes
      "schedule-f.0.line.29_taxes": 5100,
      // Line 16 — Feed
      "schedule-f.0.line.16_feed": 52000,
      // Line 30 — Utilities
      "schedule-f.0.line.30_utilities": 3700,
      // Line 31 — Veterinary, breeding, and medicine
      "schedule-f.0.line.31_veterinary_breeding_medicine": 12000,
      // Line 19 — Gasoline, fuel, and oil
      "schedule-f.0.line.19_gasoline_fuel_oil": 14400,
      // Line 20 — Insurance (other than health)
      "schedule-f.0.line.20_insurance_other_than_health": 6800,
      // Line 21b — Interest: Other
      "schedule-f.0.line.21b_interest_other": 9600,
      // Line 33 — Total expenses. Add lines 10 through 32f
      "schedule-f.0.line.33_total_expenses": 148000,
      // Line 34 — Net farm profit or (loss). Subtract line 33 from line 9
      "schedule-f.0.line.34_net_farm_profit_loss": 112000,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 1a — Net farm profit or (loss) from Schedule F, line 34, and farm partnerships, Sched
      "schedule-se.0.line.1a": 112000,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 112000,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 103432,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 103432,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 103432,
      // Line 8a — Total social security wages and tips (total of boxes 3 and 7 on Form(s) W-2) and
      "schedule-se.0.line.8a": 14000,
      // Line 8d — Add lines 8a, 8b, and 8c
      "schedule-se.0.line.8d": 14000,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 162100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 12826,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 3000,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 15826,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 7913,
    },
  },
  "form-4136": {
    engineFields: {
      // (B) If "Yes," how many different business activities do you have that qualify for this cre
      "form-4136.0.header.b_number_of_business_activities": 1,
      // Line 3b — Nontaxable use of undyed diesel fuel, use on a farm for farming purposes: (c) Qu
      "form-4136.0.line.3b_undyed_diesel_farm_use_col_c": 4000,
      // Lines 3a and 3b — Nontaxable use of undyed diesel fuel: (d) Actual fuel cost from your rec
      "form-4136.0.line.3b_undyed_diesel_farm_use_col_d": 14400,
      // Lines 3a and 3b — Nontaxable use of undyed diesel fuel: (e) Amount of credit
      "form-4136.0.line.3b_undyed_diesel_farm_use_col_e": 972,
      // Line 17 — Total income tax credit claimed. Add lines 1 through 16, column (e) (dollars)
      "form-4136.3.line.17_total_income_tax_credit": 972,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": 104087,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": 104087,
      // Line 4 — Total qualified business income. Combine lines 2 and 3. If zero or less, enter -0
      "form-8995.0.line.4": 104087,
      // Line 5 — Qualified business income component. Multiply line 4 by 20% (0.20)
      "form-8995.0.line.5": 20817,
      // Line 10 — Qualified business income deduction before the income limitation. Add lines 5 an
      "form-8995.0.line.10": 20817,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 102337,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 102337,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 20467,
      // Line 15 — Qualified business income deduction. Enter the smaller of line 10 or line 14
      "form-8995.0.line.15": 20467,
    },
  },
};

export function cerandinExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
