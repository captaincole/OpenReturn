/*
 * jasin — LOCKED expected values, drafted from the engine's
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
  "form-4835": {
    engineFields: {
      // Line 1 — Income from production of livestock, produce, grains, and other crops
      "form-4835.0.line.1_income_from_production": 48000,
      // Line 2a — Cooperative distributions (Form(s) 1099-PATR)
      "form-4835.0.line.2a_cooperative_distributions": 2400,
      // Line 2b — Cooperative distributions: taxable amount
      "form-4835.0.line.2b_cooperative_distributions_taxable": 2100,
      // Line 3a — Agricultural program payments
      "form-4835.0.line.3a_agricultural_program_payments": 9000,
      // Line 3b — Agricultural program payments: taxable amount
      "form-4835.0.line.3b_agricultural_program_payments_taxable": 8200,
      // Line 4a — Commodity Credit Corporation (CCC) loans reported under election
      "form-4835.0.line.4a_ccc_loans_under_election": 5000,
      // Line 4b — CCC loans forfeited
      "form-4835.0.line.4b_ccc_loans_forfeited": 6000,
      // Line 4c — CCC loans forfeited: taxable amount
      "form-4835.0.line.4c_ccc_loans_forfeited_taxable": 600,
      // Line 5a — Crop insurance proceeds and federal crop disaster payments: amount received in 2
      "form-4835.0.line.5a_crop_insurance_received": 7500,
      // Line 5b — Crop insurance proceeds and federal crop disaster payments: taxable amount
      "form-4835.0.line.5b_crop_insurance_taxable": 4500,
      // Line 5d — Crop insurance proceeds: amount deferred from 2024
      "form-4835.0.line.5d_crop_insurance_deferred": 2000,
      // Line 6 — Other income, including federal and state gasoline or fuel tax credit or refund
      "form-4835.0.line.6_other_income": 1150,
      // Line 7 — Gross farm rental income. Add amounts in the right column for lines 1 through 6
      "form-4835.0.line.7_gross_farm_rental_income": 71550,
      // Line 21 — Pension and profit-sharing plans
      "form-4835.0.line.21_pension_profit_sharing": 200,
      // Line 8 — Car and truck expenses
      "form-4835.0.line.8_car_truck_expenses": 1200,
      // Line 9 — Chemicals
      "form-4835.0.line.9_chemicals": 2300,
      // Line 10 — Conservation expenses
      "form-4835.0.line.10_conservation_expenses": 17888,
      // Line 22a — Rent or lease: vehicles, machinery, and equipment
      "form-4835.0.line.22a_rent_vehicles_machinery_equipment": 700,
      // Line 11 — Custom hire (machine work)
      "form-4835.0.line.11_custom_hire": 1500,
      // Line 22b — Rent or lease: other (land, animals, etc.)
      "form-4835.0.line.22b_rent_other": 500,
      // Line 23 — Repairs and maintenance
      "form-4835.0.line.23_repairs_maintenance": 1250,
      // Line 12 — Depreciation and section 179 expense deduction not claimed elsewhere
      "form-4835.0.line.12_depreciation_section_179": 4200,
      // Line 24 — Seeds and plants
      "form-4835.0.line.24_seeds_plants": 2000,
      // Line 25 — Storage and warehousing
      "form-4835.0.line.25_storage_warehousing": 350,
      // Line 26 — Supplies
      "form-4835.0.line.26_supplies": 275,
      // Line 13 — Employee benefit programs other than on line 21
      "form-4835.0.line.13_employee_benefit_programs": 300,
      // Line 27 — Taxes
      "form-4835.0.line.27_taxes": 2900,
      // Line 14 — Feed
      "form-4835.0.line.14_feed": 900,
      // Line 28 — Utilities
      "form-4835.0.line.28_utilities": 600,
      // Line 15 — Fertilizers and lime
      "form-4835.0.line.15_fertilizers_lime": 3100,
      // Line 16 — Freight and trucking
      "form-4835.0.line.16_freight_trucking": 450,
      // Line 29 — Veterinary, breeding, and medicine
      "form-4835.0.line.29_veterinary_breeding_medicine": 425,
      // Line 17 — Gasoline, fuel, and oil
      "form-4835.0.line.17_gasoline_fuel_oil": 650,
      // Line 18 — Insurance (other than health)
      "form-4835.0.line.18_insurance_other_than_health": 1800,
      // Line 30a — Other expenses: amount
      "form-4835.0.line.30a_other_expenses_amount": 650,
      // Line 30b — Other expenses: amount
      "form-4835.0.line.30b_other_expenses_amount": 400,
      // Line 19a — Interest: mortgage (paid to banks, etc.)
      "form-4835.0.line.19a_mortgage_interest": 3600,
      // Line 30c — Other expenses: amount
      "form-4835.0.line.30c_other_expenses_amount": 120,
      // Line 19b — Interest: other
      "form-4835.0.line.19b_other_interest": 400,
      // Line 30d — Other expenses: amount
      "form-4835.0.line.30d_other_expenses_amount": 180,
      // Line 30e — Other expenses: amount
      "form-4835.0.line.30e_other_expenses_amount": 60,
      // Line 30f — Other expenses: amount
      "form-4835.0.line.30f_other_expenses_amount": 340,
      // Line 20 — Labor hired (less employment credits)
      "form-4835.0.line.20_labor_hired": 1000,
      // Line 30g — Other expenses: amount
      "form-4835.0.line.30g_other_expenses_amount": -500,
      // Line 31 — Total expenses. Add lines 8 through 30g
      "form-4835.0.line.31_total_expenses": 49738,
      // Line 32 — Net farm rental income or (loss). Subtract line 31 from line 7
      "form-4835.0.line.32_net_farm_rental_income_loss": 21812,
    },
    renderedText: {
      "form-4835.0.header.ssn": "400-00-4835",
      "form-4835.0.header.ein": "000484835",
      "form-4835.0.line.30a_other_expenses_description": "Accounting",
      "form-4835.0.line.30f_other_expenses_description": "Travel to farm",
      // The 263A costs: the label and the amount in parentheses (part-ii::b01).
      "form-4835.0.line.30g_other_expenses_description": "263A",
      "form-4835.0.line.30g_other_expenses_amount": "(500)",
    },
    renderedChecked: [
      "form-4835.0.header.a_actively_participated_yes",
      "form-4835.0.line.5c_election_to_defer",
    ],
    // Net income: the line 34 boxes and line 34c stay blank.
    renderedBlank: [
      "form-4835.0.line.34a_all_investment_at_risk",
      "form-4835.0.line.34b_some_investment_not_at_risk",
      "form-4835.0.line.34c_deductible_loss",
    ],
  },
  "schedule-e": {
    engineFields: {
      // Line 40 — Net farm rental income or (loss) from Form 4835
      "schedule-e.1.line.40_net_farm_rental_income": 21812,
      // Line 41 — Total income or (loss). Combine lines 26, 32, 37, 39, and 40
      "schedule-e.1.line.41_total_income_or_loss": 21812,
      // Line 42 — Reconciliation of farming and fishing income. Enter your gross farming and fishi
      "schedule-e.1.line.42_farming_fishing_reconciliation": 71550,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 5 — Rental real estate, royalties, partnerships, S corporations, trusts, etc. Attach
      "schedule-1.0.line.5": 21812,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 21812,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 78000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 78000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 21812,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 99812,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 99812,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 99812,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 84062,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 13411,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 13411,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 13411,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 13411,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 13900,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 13900,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 13900,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 489,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 489,
    },
  },
};

export function jasinExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
