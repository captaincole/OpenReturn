/*
 * elayne — LOCKED expected values, drafted from the engine's
 * output on 2026-11-22 (scripts/draftExpected.ts).
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
  "form-8936": {
    engineFields: {
      // Line 1a — Enter the amount from line 11a of your 2025 Form 1040, 1040-SR, or 1040-NR
      "form-8936.0.line.1a_2025_form_1040_line_11a": 158400,
      // Line 2 — Add lines 1a through 1e
      "form-8936.0.line.2_2025_magi": 158400,
      // Line 3a — Enter the amount from line 11 of your 2024 Form 1040, 1040-SR, or 1040-NR
      "form-8936.0.line.3a_2024_form_1040_line_11": 142000,
      // Line 4 — Add lines 3a through 3e
      "form-8936.0.line.4_2024_magi": 142000,
      // Line 6 — Schedule A line 11, 0% business use: a verified zero (added by hand)
      "form-8936.0.line.6_business_use_credit_schedule_a": 0,
      // Line 8 — line 6 + line 7 (blank): a verified zero (added by hand)
      "form-8936.0.line.8_business_investment_use_credit": 0,
      // Line 9 — Enter the total credit amount figured in Part III of Schedule(s) A (Form 8936)
      "form-8936.0.line.9_personal_use_credit_schedule_a": 7500,
      // Line 10 — Enter the amount from Form 1040, 1040-SR, or 1040-NR, line 18
      "form-8936.0.line.10_form_1040_line_18": 17746,
      // Line 11 — Personal credits from Form 1040, 1040-SR, or 1040-NR
      "form-8936.0.line.11_personal_credits_form_1040": 4000,
      // Line 12 — Subtract line 11 from line 10. If zero or less, enter -0-
      "form-8936.0.line.12_tax_less_personal_credits": 13746,
      // Line 13 — Personal use part of credit. Enter the smaller of line 9 or line 12
      "form-8936.0.line.13_personal_use_credit": 7500,
      // Line 14 — Enter the total credit amount figured in Part IV of Schedule(s) A (Form 8936)
      "form-8936.0.line.14_previously_owned_credit_schedule_a": 4000,
      // Line 15 — Enter the amount from Form 1040, 1040-SR, or 1040-NR, line 18
      "form-8936.0.line.15_form_1040_line_18": 17746,
      // Line 16 — Schedule 3 lines 1–4, 5b, 6d, 6l: none, a verified zero (added by hand)
      "form-8936.0.line.16_personal_credits_form_1040": 0,
      // Line 17 — Subtract line 16 from line 15. If zero or less, enter -0-
      "form-8936.0.line.17_tax_less_personal_credits": 17746,
      // Line 18 — Enter the smaller of line 14 or line 17
      "form-8936.0.line.18_previously_owned_vehicle_credit": 4000,
    },
    renderedText: {
      "form-8936.0.header.taxpayer_name": "Elayne Marwick & Gareth Marwick",
      "form-8936.0.header.identifying_number": "400-00-8936",
      "form-8936.0.line.5_2024_filing_status": "MFJ",
    },
    // No K-1 credit, no commercial vehicle.
    renderedBlank: [
      "form-8936.0.line.7_new_vehicle_credit_partnerships_s_corps",
      "form-8936.0.line.19_commercial_vehicle_credit_schedule_a",
    ],
  },
  "schedule-3": {
    engineFields: {
      // Line 6f — Clean vehicle credit. Attach Form 8936
      "schedule-3.0.line.6f": 7500,
      // Line 6m — Credit for previously owned clean vehicles. Attach Form 8936
      "schedule-3.0.line.6m": 4000,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 11500,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 11500,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 158400,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 158400,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 158400,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 158400,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 158400,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 31500,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 31500,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 126900,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 17746,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 17746,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 11500,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 11500,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 6246,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 6246,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 15900,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 15900,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 15900,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 9654,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 9654,
    },
  },
};

export function elayneExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
