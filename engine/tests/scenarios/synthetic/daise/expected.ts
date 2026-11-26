/*
 * daise — LOCKED expected values, drafted from the engine's
 * output on 2026-11-26 (scripts/draftExpected.ts).
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
      // Line 1a — Sales of purchased livestock and other resale items
      "schedule-f.0.line.1a_sales_purchased_livestock": 64000,
      // Line 1b — Cost or other basis of purchased livestock or other items reported on line 1a
      "schedule-f.0.line.1b_cost_purchased_livestock": 41500,
      // Line 1c — Subtract line 1b from line 1a
      "schedule-f.0.line.1c_subtract_1b_from_1a": 22500,
      // Line 2 — Sales of livestock, produce, grains, and other products you raised
      "schedule-f.0.line.2_sales_products_raised": 286400,
      // Line 3a — Cooperative distributions (Form(s) 1099-PATR)
      "schedule-f.0.line.3a_cooperative_distributions": 4800,
      // Line 3b — Cooperative distributions: Taxable amount
      "schedule-f.0.line.3b_cooperative_distributions_taxable": 4200,
      // Line 4a — Agricultural program payments
      "schedule-f.0.line.4a_agricultural_program_payments": 21300,
      // Line 4b — Agricultural program payments: Taxable amount
      "schedule-f.0.line.4b_agricultural_program_taxable": 18000,
      // Line 5a — Commodity Credit Corporation (CCC) loans reported under election
      "schedule-f.0.line.5a_ccc_loans_under_election": 15000,
      // Line 5b — CCC loans forfeited
      "schedule-f.0.line.5b_ccc_loans_forfeited": 9000,
      // Line 5c — CCC loans forfeited: Taxable amount
      "schedule-f.0.line.5c_ccc_loans_forfeited_taxable": 800,
      // Line 6a — Crop insurance proceeds and federal crop disaster payments: Amount received in 2
      "schedule-f.0.line.6a_crop_insurance_received": 18600,
      // Line 6b — Crop insurance proceeds and federal crop disaster payments: Taxable amount
      "schedule-f.0.line.6b_crop_insurance_taxable": 11600,
      // Line 6d — Crop insurance proceeds and federal crop disaster payments: Amount deferred from
      "schedule-f.0.line.6d_amount_deferred_from_2024": 3250,
      // Line 7 — Custom hire (machine work) income
      "schedule-f.0.line.7_custom_hire_income": 6900,
      // Line 8 — Other income, including federal and state gasoline or fuel tax credit or refund
      "schedule-f.0.line.8_other_income": 1140,
      // Line 9 — Gross income. Add amounts in the right column (lines 1c, 2, 3b, 4b, 5a, 5c, 6b, 6
      "schedule-f.0.line.9_gross_income": 369790,
      // Line 23 — Pension and profit-sharing plans
      "schedule-f.0.line.23_pension_profit_sharing": 2600,
      // Line 10 — Car and truck expenses
      "schedule-f.0.line.10_car_truck_expenses": 4425,
      // Line 11 — Chemicals
      "schedule-f.0.line.11_chemicals": 3900,
      // Line 24a — Rent or lease: Vehicles, machinery, equipment
      "schedule-f.0.line.24a_rent_vehicles_machinery_equipment": 4100,
      // Line 12 — Conservation expenses
      "schedule-f.0.line.12_conservation_expenses": 7500,
      // Line 24b — Rent or lease: Other (land, animals, etc.)
      "schedule-f.0.line.24b_rent_other": 9000,
      // Line 13 — Custom hire (machine work)
      "schedule-f.0.line.13_custom_hire_expense": 5200,
      // Line 25 — Repairs and maintenance
      "schedule-f.0.line.25_repairs_maintenance": 8750,
      // Line 26 — Seeds and plants
      "schedule-f.0.line.26_seeds_plants": 6300,
      // Line 14 — Depreciation and section 179 expense
      "schedule-f.0.line.14_depreciation_section_179": 18400,
      // Line 27 — Storage and warehousing
      "schedule-f.0.line.27_storage_warehousing": 1850,
      // Line 28 — Supplies
      "schedule-f.0.line.28_supplies": 5400,
      // Line 15 — Employee benefit programs other than on line 23
      "schedule-f.0.line.15_employee_benefit_programs": 4800,
      // Line 29 — Taxes
      "schedule-f.0.line.29_taxes": 6900,
      // Line 16 — Feed
      "schedule-f.0.line.16_feed": 46700,
      // Line 30 — Utilities
      "schedule-f.0.line.30_utilities": 3800,
      // Line 17 — Fertilizers and lime
      "schedule-f.0.line.17_fertilizers_lime": 12300,
      // Line 31 — Veterinary, breeding, and medicine
      "schedule-f.0.line.31_veterinary_breeding_medicine": 7250,
      // Line 18 — Freight and trucking
      "schedule-f.0.line.18_freight_trucking": 3450,
      // Line 19 — Gasoline, fuel, and oil
      "schedule-f.0.line.19_gasoline_fuel_oil": 9800,
      // Line 32a — Other expenses (specify): amount
      "schedule-f.0.line.32a_other_expenses_amount": 2400,
      // Line 20 — Insurance (other than health)
      "schedule-f.0.line.20_insurance_other_than_health": 7600,
      // Line 32b — Other expenses (specify): amount
      "schedule-f.0.line.32b_other_expenses_amount": 380,
      // Line 32c — Other expenses (specify): amount
      "schedule-f.0.line.32c_other_expenses_amount": 960,
      // Line 21a — Interest: Mortgage (paid to banks, etc.)
      "schedule-f.0.line.21a_interest_mortgage": 14200,
      // Line 32d — Other expenses (specify): amount
      "schedule-f.0.line.32d_other_expenses_amount": 450,
      // Line 21b — Interest: Other
      "schedule-f.0.line.21b_interest_other": 3100,
      // Line 32e — Other expenses (specify): amount
      "schedule-f.0.line.32e_other_expenses_amount": 600,
      // Line 22 — Labor hired (less employment credits)
      "schedule-f.0.line.22_labor_hired": 52000,
      // Line 32f — Other expenses (specify): amount
      "schedule-f.0.line.32f_other_expenses_amount": -2200,
      // Line 33 — Total expenses. Add lines 10 through 32f
      "schedule-f.0.line.33_total_expenses": 251915,
      // Line 34 — Net farm profit or (loss). Subtract line 33 from line 9
      "schedule-f.0.line.34_net_farm_profit_loss": 117875,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 1a — Net farm profit or (loss) from Schedule F, line 34, and farm partnerships, Sched
      "schedule-se.0.line.1a": 117875,
      // Line 1b — If you received social security retirement or disability benefits, enter the amo
      "schedule-se.0.line.1b": 12000,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 105875,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 97776,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 97776,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 97776,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 12124,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 2836,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 14960,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 7480,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 6 — Farm income or (loss). Attach Schedule F
      "schedule-1.0.line.6": 117875,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 117875,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 7480,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 7480,
    },
  },
  "schedule-b": {
    engineFields: {
      // Line 1 — Amount (row 1)
      "schedule-b.0.line.1_amount_1": 85000,
      // Line 2 — Add the amounts on line 1
      "schedule-b.0.line.2_total_interest": 85000,
      // Line 4 — Subtract line 3 from line 2. Enter the result here and on Form 1040 or 1040-SR, l
      "schedule-b.0.line.4_taxable_interest": 85000,
    },
  },
  "schedule-1-a": {
    engineFields: {
      // Line 1 — Enter the amount from Form 1040, 1040-SR, or 1040-NR, line 11b
      "schedule-1-a.0.line.1_agi_form_1040": 224975,
      // Line 3 — Add lines 1 and 2e
      "schedule-1-a.0.line.3_modified_agi": 224975,
      // Line 31 — Enter the amount from line 3
      "schedule-1-a.1.line.31_magi_from_line_3": 224975,
      // Line 32 — Enter $75,000 ($150,000 if married filing jointly)
      "schedule-1-a.1.line.32_senior_threshold": 75000,
      // Line 33 — Subtract line 32 from line 31. If zero or less, enter $6,000 on line 35
      "schedule-1-a.1.line.33_magi_over_threshold": 149975,
      // Line 34 — Multiply line 33 by 6% (0.06)
      "schedule-1-a.1.line.34_senior_phaseout": 8999,
    },
  },
  "form-8995-a": {
    engineFields: {
      // Line 2 — Qualified business income from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.2_a": 110395,
      // Line 3 — Multiply line 2 by 20% (0.20) (Column A)
      "form-8995-a.0.line.3_a": 22079,
      // Line 4 — Allocable share of W-2 wages from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.4_a": 52000,
      // Line 5 — Multiply line 4 by 50% (0.50) (Column A)
      "form-8995-a.0.line.5_a": 26000,
      // Line 6 — Multiply line 4 by 25% (0.25) (Column A)
      "form-8995-a.0.line.6_a": 13000,
      // Line 7 — Allocable share of the unadjusted basis immediately after acquisition (UBIA) of a
      "form-8995-a.0.line.7_a": 310000,
      // Line 8 — Multiply line 7 by 2.5% (0.025) (Column A)
      "form-8995-a.0.line.8_a": 7750,
      // Line 9 — Add lines 6 and 8 (Column A)
      "form-8995-a.0.line.9_a": 20750,
      // Line 10 — Enter the greater of line 5 or line 9 (Column A)
      "form-8995-a.0.line.10_a": 26000,
      // Line 11 — W-2 wage and UBIA of qualified property limitation. Enter the smaller of line 3
      "form-8995-a.0.line.11_a": 22079,
      // Line 13 — Qualified business income deduction before patron reduction. Enter the greater o
      "form-8995-a.0.line.13_a": 22079,
      // Line 15 — Qualified business income component. Subtract line 14 from line 13 (Column A)
      "form-8995-a.0.line.15_a": 22079,
      // Line 16 — Total qualified business income component. Add all amounts reported on line 15
      "form-8995-a.0.line.16": 22079,
      // Line 27 — Total qualified business income component from all qualified trades, businesses,
      "form-8995-a.1.line.27": 22079,
      // Line 32 — Qualified business income deduction before the income limitation. Add lines 27 a
      "form-8995-a.1.line.32": 22079,
      // Line 33 — Taxable income before qualified business income deduction
      "form-8995-a.1.line.33": 207225,
      // Line 35 — Subtract line 34 from line 33. If zero or less, enter -0-
      "form-8995-a.1.line.35": 207225,
      // Line 36 — Income limitation. Multiply line 35 by 20% (0.20)
      "form-8995-a.1.line.36": 41445,
      // Line 37 — Qualified business income deduction before the domestic production activities de
      "form-8995-a.1.line.37": 22079,
      // Line 39 — Total qualified business income deduction. Add lines 37 and 38
      "form-8995-a.1.line.39": 22079,
    },
  },
  "form-8960": {
    engineFields: {
      // Line 1 — Taxable interest (see instructions)
      "form-8960.0.line.1": 85000,
      // Line 4a — Rental real estate, royalties, partnerships, S corporations, trusts, trades or b
      "form-8960.0.line.4a": 117875,
      // Line 4b — Adjustment for net income or loss derived in the ordinary course of a non-sectio
      "form-8960.0.line.4b": -117875,
      // Line 8 — Total investment income. Combine lines 1, 2, 3, 4c, 5d, 6, and 7
      "form-8960.0.line.8": 85000,
      // Line 12 — Net investment income. Subtract Part II, line 11, from Part I, line 8. If zero o
      "form-8960.0.line.12": 85000,
      // Line 13 — Modified adjusted gross income (see instructions)
      "form-8960.0.line.13": 224975,
      // Line 14 — Threshold based on filing status (see instructions)
      "form-8960.0.line.14": 200000,
      // Line 15 — Subtract line 14 from line 13. If zero or less, enter -0-
      "form-8960.0.line.15": 24975,
      // Line 16 — Enter the smaller of line 12 or line 15
      "form-8960.0.line.16": 24975,
      // Line 17 — Net investment income tax for individuals. Multiply line 16 by 3.8% (0.038)
      "form-8960.0.line.17": 949,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 14960,
      // Line 12 — Net investment income tax. Attach Form 8960
      "schedule-2.0.line.12_net_investment_income_tax": 949,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 15909,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 2b — Taxable interest
      "form-1040.line.2b": 85000,
      // Line 6a — Social security benefits
      "form-1040.line.6a": 34800,
      // Line 6b — Taxable amount
      "form-1040.line.6b": 29580,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 117875,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 232455,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 7480,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 224975,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 224975,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 17750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 22079,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 39829,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 185146,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 37282,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 37282,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 37282,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 15909,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 53191,
      // Line 26 — 2025 estimated tax payments and amount applied from 2024 return
      "form-1040.line.26": 66000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 66000,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 12809,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 12809,
    },
  },
};

export function daiseExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
