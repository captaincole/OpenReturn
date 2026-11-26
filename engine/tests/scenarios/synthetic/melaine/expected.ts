/*
 * melaine — LOCKED expected values, drafted from the engine's
 * output on 2026-11-25 (scripts/draftExpected.ts).
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
  "form-8828": {
    engineFields: {
      // Line 7 — Number of years and full months between original closing date (line 5) and date o
      "form-8828.0.line.7_holding_period_years": 5,
      // Line 7 — Number of years and full months between original closing date (line 5) and date o
      "form-8828.0.line.7_holding_period_full_months": 2,
      // Line 9 — Sales price of your interest in the home sold or disposed of
      "form-8828.0.line.9_sales_price": 330000,
      // Line 10 — Expenses of sale. Include sales commissions, advertising, legal fees, etc.
      "form-8828.0.line.10_expenses_of_sale": 19800,
      // Line 11 — Amount realized. Subtract line 10 from line 9
      "form-8828.0.line.11_amount_realized": 310200,
      // Line 12 — Adjusted basis of your interest in the home sold or disposed of
      "form-8828.0.line.12_adjusted_basis": 262500,
      // Line 13 — Gain or (loss) from sale or disposition. Subtract line 12 from line 11
      "form-8828.0.line.13_gain_or_loss": 47700,
      // Line 14 — Multiply line 13 by 50% (.50)
      "form-8828.0.line.14_half_of_gain": 23850,
      // Line 15 — Modified adjusted gross income
      "form-8828.0.line.15_modified_agi": 68150,
      // Line 16 — Adjusted qualifying income
      "form-8828.0.line.16_adjusted_qualifying_income": 65218,
      // Line 17 — Subtract line 16 from line 15
      "form-8828.0.line.17_income_over_qualifying": 2932,
      // Line 19 — Federally subsidized amount
      "form-8828.0.line.19_federally_subsidized_amount": 14750,
      // Line 21 — Multiply line 19 by the percentage on line 20
      "form-8828.0.line.21_subsidized_amount_times_holding": 11800,
      // Line 22 — Recapture amount. Multiply line 21 by the percentage on line 18
      "form-8828.0.line.22_recapture_amount": 6962,
      // Line 23 — Tax. Enter the smaller of line 14 or line 22
      "form-8828.0.line.23_recapture_tax": 6962,
    },
    renderedText: {
      "form-8828.0.header.taxpayer_name": "Melaine Ashgrove",
      "form-8828.0.header.ssn": "400-00-8828",
      "form-8828.0.line.1_property_address": "1207 Larkspur Bend, Round Rock, TX 78664",
      "form-8828.0.line.3_bond_certificate_issuer":
        "Texas, Brazos Bend County, Brazos Bend County Housing Finance Corporation",
      "form-8828.0.line.4_original_lender_name_address":
        "Live Oak Hill Mortgage Company, 900 Mesquite Plaza, Round Rock, TX 78664",
      "form-8828.0.line.5_loan_closing_date_month": "06",
      "form-8828.0.line.5_loan_closing_date_day": "12",
      "form-8828.0.line.5_loan_closing_date_year": "2020",
      "form-8828.0.line.6_sale_disposition_date_month": "08",
      "form-8828.0.line.6_sale_disposition_date_day": "29",
      "form-8828.0.line.6_sale_disposition_date_year": "2025",
      // The loan was paid off at the closing of the sale: line 8 is line 6, so no worksheet.
      "form-8828.0.line.8_full_repayment_date_month": "08",
      "form-8828.0.line.8_full_repayment_date_day": "29",
      "form-8828.0.line.8_full_repayment_date_year": "2025",
      // 2,932 / 5,000 = 58.64%, rounded to the nearest whole percentage.
      "form-8828.0.line.18_income_percentage": "59",
      // The notice's line for 6 full and partial years held (5 years 2 months).
      "form-8828.0.line.20_holding_period_percentage": "80",
    },
    renderedChecked: ["form-8828.0.line.2a_tax_exempt_bond_loan"],
    renderedBlank: ["form-8828.0.line.2b_mortgage_credit_certificate"],
  },
  "schedule-2": {
    engineFields: {
      // Line 17b — Recapture of federal mortgage subsidy
      "schedule-2.1.line.17b_recapture_federal_mortgage_subsidy": 6962,
      // Line 18 — Total additional taxes. Add lines 17a through 17z
      "schedule-2.1.line.18_total_additional_taxes": 6962,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 6962,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 67500,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 67500,
      // Line 2a — Tax-exempt interest
      "form-1040.line.2a": 410,
      // Line 2b — Taxable interest
      "form-1040.line.2b": 240,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 67740,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 67740,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 67740,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 51990,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 6349,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 6349,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 6349,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 6962,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 13311,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 14000,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 14000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 14000,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 689,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 689,
    },
  },
};

export function melaineExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
