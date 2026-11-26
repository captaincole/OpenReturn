/*
 * keille — LOCKED expected values, drafted from the engine's
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
      "form-4835.0.line.1_income_from_production": 18000,
      // Line 5a — Crop insurance proceeds and federal crop disaster payments: amount received in 2
      "form-4835.0.line.5a_crop_insurance_received": 1200,
      // Line 5b — Crop insurance proceeds and federal crop disaster payments: taxable amount
      "form-4835.0.line.5b_crop_insurance_taxable": 1200,
      // Line 7 — Gross farm rental income. Add amounts in the right column for lines 1 through 6
      "form-4835.0.line.7_gross_farm_rental_income": 19200,
      // Line 23 — Repairs and maintenance
      "form-4835.0.line.23_repairs_maintenance": 6400,
      // Line 12 — Depreciation and section 179 expense deduction not claimed elsewhere
      "form-4835.0.line.12_depreciation_section_179": 9000,
      // Line 27 — Taxes
      "form-4835.0.line.27_taxes": 4500,
      // Line 15 — Fertilizers and lime
      "form-4835.0.line.15_fertilizers_lime": 3000,
      // Line 18 — Insurance (other than health)
      "form-4835.0.line.18_insurance_other_than_health": 2100,
      // Line 19a — Interest: mortgage (paid to banks, etc.)
      "form-4835.0.line.19a_mortgage_interest": 5200,
      // Line 31 — Total expenses. Add lines 8 through 30g
      "form-4835.0.line.31_total_expenses": 30200,
      // Line 34c — Deductible loss
      "form-4835.0.line.34c_deductible_loss": -11000,
    },
    renderedText: {
      "form-4835.0.line.34c_deductible_loss": "(11,000)",
    },
    renderedChecked: [
      "form-4835.0.header.a_actively_participated_yes",
      "form-4835.0.line.34a_all_investment_at_risk",
    ],
    // A loss is not entered on line 32 (line-32::b01); no EIN.
    renderedBlank: [
      "form-4835.0.line.32_net_farm_rental_income_loss",
      "form-4835.0.line.34b_some_investment_not_at_risk",
      "form-4835.0.header.ein",
    ],
  },
  "schedule-e": {
    engineFields: {
      // Line 40 — Net farm rental income or (loss) from Form 4835
      "schedule-e.1.line.40_net_farm_rental_income": -11000,
      // Line 41 — Total income or (loss). Combine lines 26, 32, 37, 39, and 40
      "schedule-e.1.line.41_total_income_or_loss": -11000,
      // Line 42 — Reconciliation of farming and fishing income. Enter your gross farming and fishi
      "schedule-e.1.line.42_farming_fishing_reconciliation": 19200,
      // Line 43 — Reconciliation for real estate professionals. If you were a real estate professi
      "schedule-e.1.line.43_real_estate_professional_reconciliation": -11000,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 5 — Rental real estate, royalties, partnerships, S corporations, trusts, etc. Attach
      "schedule-1.0.line.5": -11000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": -11000,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 112000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 112000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": -11000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 101000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 101000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 101000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 85250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 13675,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 13675,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 13675,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 13675,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 16800,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 16800,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 16800,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 3125,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 3125,
    },
  },
};

export function keilleExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
