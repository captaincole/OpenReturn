/*
 * linnea — LOCKED expected values, drafted from the engine's
 * output on 2026-11-21 (scripts/draftExpected.ts).
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
  "form-5695": {
    engineFields: {
      // Line 18a — Insulation or air sealing material or system
      "form-5695.1.line.18a": 1200,
      // Line 18b — Multiply line 18a by 30% (0.30)
      "form-5695.1.line.18b": 360,
      // Line 27 — Add lines 18b, 19h, 20d, 22d, 23d, 24d, 25e, and 26c
      "form-5695.3.line.27": 360,
      // Line 28 — Enter the smaller of line 27 or $1,200
      "form-5695.3.line.28": 360,
      // Line 30 — Add lines 28 and 29h
      "form-5695.3.line.30": 360,
      // Line 31 — Limitation based on tax liability
      "form-5695.3.line.31": 2087,
      // Line 32 — Energy efficient home improvement credit. Enter the smaller of line 30 or line 31
      "form-5695.3.line.32": 360,
    },
  },
  "form-8396": {
    engineFields: {
      // Line 1 — Interest paid on the certified indebtedness amount
      "form-8396.0.line.1_interest_paid_certified_indebtedness": 9600,
      // Line 3 — If line 2 is 20% or less, multiply line 1 by line 2
      "form-8396.0.line.3_interest_times_credit_rate": 2000,
      // Line 4 — Enter any 2022 credit carryforward from line 16 of your 2024 Form 8396
      "form-8396.0.line.4_carryforward_from_2022": 300,
      // Line 5 — Enter any 2023 credit carryforward from line 14 of your 2024 Form 8396
      "form-8396.0.line.5_carryforward_from_2023": 450,
      // Line 6 — Enter any 2024 credit carryforward from line 17 of your 2024 Form 8396
      "form-8396.0.line.6_carryforward_from_2024": 600,
      // Line 7 — Add lines 3 through 6
      "form-8396.0.line.7_total_credit_available": 3350,
      // Line 8 — Limitation based on tax liability
      "form-8396.0.line.8_tax_liability_limitation": 1727,
      // Line 9 — Current-year mortgage interest credit. Enter the smaller of line 7 or line 8
      "form-8396.0.line.9_current_year_mortgage_interest_credit": 1727,
      // Line 10 — Add lines 3 and 4
      "form-8396.0.line.10_add_lines_3_and_4": 2300,
      // Line 11 — Enter the amount from line 7
      "form-8396.0.line.11_amount_from_line_7": 3350,
      // Line 12 — Enter the larger of line 9 or line 10
      "form-8396.0.line.12_larger_of_line_9_or_10": 2300,
      // Line 13 — Subtract line 12 from line 11
      "form-8396.0.line.13_line_11_minus_line_12": 1050,
      // Line 14 — 2024 credit carryforward to 2026. Enter the smaller of line 6 or line 13
      "form-8396.0.line.14_2024_carryforward_to_2026": 600,
      // Line 15 — Subtract line 14 from line 13
      "form-8396.0.line.15_line_13_minus_line_14": 450,
      // Line 16 — 2023 credit carryforward to 2026. Enter the smaller of line 5 or line 15
      "form-8396.0.line.16_2023_carryforward_to_2026": 450,
      // Line 17 — 2025 credit carryforward to 2026. Subtract line 9 from line 3. If zero or less,
      "form-8396.0.line.17_2025_carryforward_to_2026": 273,
      // Line 8 Credit Limit Worksheet, line 1 — Enter the amount from Form 1040, 1040-SR, or 1040-
      "form-8396.1.line8_worksheet.1_form_1040_line_18": 2087,
      // Line 8 Credit Limit Worksheet, line 2 — Form 1040 or 1040-SR filers: Enter the total of al
      "form-8396.1.line8_worksheet.2_total_other_credits": 360,
      // Line 8 Credit Limit Worksheet, line 3 — Subtract line 2 from line 1. If zero or less, ente
      "form-8396.1.line8_worksheet.3_credit_limit": 1727,
    },
    renderedText: {
      "form-8396.0.header.taxpayer_name": "Linnea Castellano",
      "form-8396.0.header.ssn": "400-00-8396",
      "form-8396.0.header.certificate_issuer_name": "Gulf Coast Housing Finance Authority",
      "form-8396.0.header.certificate_number": "GCHFA-MCC-21-0417",
      "form-8396.0.header.certificate_issue_date": "06/14/2021",
      "form-8396.0.line.2_certificate_credit_rate": "25",
    },
    // The main home is the address on the return.
    renderedBlank: ["form-8396.0.header.main_home_address"],
  },
  "schedule-3": {
    engineFields: {
      // Line 5b — Energy efficient home improvement credit from Form 5695, line 32
      "schedule-3.0.line.5b": 360,
      // Line 6g — Mortgage interest credit. Attach Form 8396
      "schedule-3.0.line.6g": 1727,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 1727,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 2087,
    },
  },
  "schedule-a": {
    engineFields: {
      // Line 2 — Enter amount from Form 1040 or 1040-SR, line 11b
      "schedule-a.0.line.2_agi_from_1040": 36000,
      // Line 3 — Multiply line 2 by 7.5% (0.075)
      "schedule-a.0.line.3_agi_multiplied": 2700,
      // Line 5b — State and local real estate taxes (see instructions)
      "schedule-a.0.line.5b_real_estate_taxes": 4100,
      // Line 5d — Add lines 5a through 5c
      "schedule-a.0.line.5d_total_state_local_taxes": 4100,
      // Line 5e — Enter the smaller of line 5d or $40,000 ($20,000 if married filing separately)
      "schedule-a.0.line.5e_salt_cap": 4100,
      // Line 7 — Add lines 5e and 6
      "schedule-a.0.line.7_total_taxes": 4100,
      // Line 8a — Home mortgage interest and points reported to you on Form 1098
      "schedule-a.0.line.8a_mortgage_interest_form1098": 9520,
      // Line 8e — Add lines 8a through 8c
      "schedule-a.0.line.8e_total_mortgage_interest_points": 9520,
      // Line 10 — Add lines 8e and 9
      "schedule-a.0.line.10_total_interest": 9520,
      // Line 11 — Gifts by cash or check
      "schedule-a.0.line.11_gifts_cash_check": 3000,
      // Line 14 — Add lines 11 through 13
      "schedule-a.0.line.14_total_gifts": 3000,
      // Line 17 — Total Itemized Deductions. Add the amounts in the far right column for lines 4 t
      "schedule-a.0.line.17_total_itemized_deductions": 16620,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 36000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 36000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 36000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 36000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 36000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 16620,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 16620,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 19380,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 2087,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 2087,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 2087,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 2087,
      // Line 22 — Subtract line 21 from line 18: the credits use the whole tax
      "form-1040.line.22": 0,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 0,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 2400,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 2400,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 2400,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 2400,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 2400,
    },
  },
};

export function linneaExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
