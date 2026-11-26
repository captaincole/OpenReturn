/*
 * ailil — LOCKED expected values, drafted from the engine's
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
  "form-982": {
    engineFields: {
      // Line 2 — Total amount of discharged indebtedness excluded from gross income
      "form-982.0.line.2_total_discharged_excluded": 103000,
      // Line 5 — That you elect under section 108(b)(5) to apply first to reduce the basis (under
      "form-982.0.line.5_elect_depreciable_basis_first": 4000,
      // Line 7 — Applied to reduce any general business credit carryover to or from the tax year o
      "form-982.0.line.7_general_business_credit": 4500,
      // Line 8 — Applied to reduce any minimum tax credit as of the beginning of the tax year imme
      "form-982.0.line.8_minimum_tax_credit": 3000,
      // Line 9 — Applied to reduce any net capital loss for the tax year of the discharge, includi
      "form-982.0.line.9_net_capital_loss": 5000,
      // Line 10b — Applied to reduce the basis of your principal residence
      "form-982.0.line.10b_principal_residence_basis": 40000,
      // Line 11a — For a discharge of qualified farm indebtedness applied to reduce the basis of d
      "form-982.0.line.11a_farm_depreciable_property": 22000,
      // Line 11b — For a discharge of qualified farm indebtedness applied to reduce the basis of l
      "form-982.0.line.11b_farm_land": 12000,
      // Line 11c — For a discharge of qualified farm indebtedness applied to reduce the basis of o
      "form-982.0.line.11c_farm_other_property": 4000,
      // Line 12 — Applied to reduce any passive activity loss and credit carryovers from the tax y
      "form-982.0.line.12_passive_activity_carryovers": 7200,
      // Line 13 — Applied to reduce any foreign tax credit carryover to or from the tax year of th
      "form-982.0.line.13_foreign_tax_credit": 1300,
    },
    // Lines 1b, 1c and 1e have an amount; line 3 is Yes. Lines 1a, 1d, 4, 6 and 10a stay blank.
    renderedChecked: [
      "form-982.0.line.1b_insolvency",
      "form-982.0.line.1c_qualified_farm_indebtedness",
      "form-982.0.line.1e_qualified_principal_residence",
      "form-982.0.line.3_elect_real_property_depreciable_yes",
    ],
    renderedBlank: [
      "form-982.0.line.1a_title_11_case",
      "form-982.0.line.1d_qualified_real_property_business",
      "form-982.0.line.3_elect_real_property_depreciable_no",
      "form-982.0.line.4_real_property_business_basis",
      "form-982.0.line.6_net_operating_loss",
      "form-982.0.line.10a_property_basis",
    ],
  },
  "schedule-f": {
    engineFields: {
      // Line 2 — Sales of livestock, produce, grains, and other products you raised
      "schedule-f.0.line.2_sales_products_raised": 96000,
      // Line 9 — Gross income. Add amounts in the right column (lines 1c, 2, 3b, 4b, 5a, 5c, 6b, 6
      "schedule-f.0.line.9_gross_income": 96000,
      // Line 25 — Repairs and maintenance
      "schedule-f.0.line.25_repairs_maintenance": 4300,
      // Line 26 — Seeds and plants
      "schedule-f.0.line.26_seeds_plants": 7800,
      // Line 14 — Depreciation and section 179 expense
      "schedule-f.0.line.14_depreciation_section_179": 11000,
      // Line 29 — Taxes
      "schedule-f.0.line.29_taxes": 2600,
      // Line 16 — Feed
      "schedule-f.0.line.16_feed": 18000,
      // Line 30 — Utilities
      "schedule-f.0.line.30_utilities": 1900,
      // Line 17 — Fertilizers and lime
      "schedule-f.0.line.17_fertilizers_lime": 9500,
      // Line 19 — Gasoline, fuel, and oil
      "schedule-f.0.line.19_gasoline_fuel_oil": 6200,
      // Line 20 — Insurance (other than health)
      "schedule-f.0.line.20_insurance_other_than_health": 3100,
      // Line 21b — Interest: Other
      "schedule-f.0.line.21b_interest_other": 3400,
      // Line 33 — Total expenses. Add lines 10 through 32f
      "schedule-f.0.line.33_total_expenses": 67800,
      // Line 34 — Net farm profit or (loss). Subtract line 33 from line 9
      "schedule-f.0.line.34_net_farm_profit_loss": 28200,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 1a — Net farm profit or (loss) from Schedule F, line 34, and farm partnerships, Sched
      "schedule-se.0.line.1a": 28200,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 28200,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 26043,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 26043,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 26043,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 3229,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 755,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 3984,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 1992,
    },
  },
  "schedule-d": {
    engineFields: {
      // Line 14 — Long-term capital loss carryover
      "schedule-d.0.line.14_long_term_loss_carryover": 8000,
      // Line 15 — Net long-term capital gain or (loss). Combine lines 8a through 14 in column (h)
      "schedule-d.0.line.15_net_long_term_gain_loss": -8000,
      // Line 16 — Combine lines 7 and 15 and enter the result
      "schedule-d.1.line.16_combined_gain_loss": -8000,
      // Line 21 — If line 16 is a loss, enter here and on Form 1040, 1040-SR, or 1040-NR, line 7a,
      "schedule-d.1.line.21_allowable_loss": 3000,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 6 — Farm income or (loss). Attach Schedule F
      "schedule-1.0.line.6": 28200,
      // Line 8c — Cancellation of debt
      "schedule-1.0.line.8c": 15000,
      // Line 9 — Total other income. Add lines 8a through 8z
      "schedule-1.0.line.9": 15000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 43200,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 1992,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 1992,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": 26208,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": 26208,
      // Line 4 — Total qualified business income. Combine lines 2 and 3. If zero or less, enter -0
      "form-8995.0.line.4": 26208,
      // Line 5 — Qualified business income component. Multiply line 4 by 20% (0.20)
      "form-8995.0.line.5": 5242,
      // Line 10 — Qualified business income deduction before the income limitation. Add lines 5 an
      "form-8995.0.line.10": 5242,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 22458,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 22458,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 4492,
      // Line 15 — Qualified business income deduction. Enter the smaller of line 10 or line 14
      "form-8995.0.line.15": 4492,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 3984,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 3984,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": -3000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 43200,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 40200,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 1992,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 38208,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 38208,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 4492,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 20242,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 17966,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 1919,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 1919,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 1919,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 3984,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 5903,
      // Line 37 — Amount you owe
      "form-1040.line.37": 5903,
    },
  },
};

export function aililExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
