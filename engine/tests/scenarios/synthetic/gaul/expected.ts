/*
 * gaul — LOCKED expected values, drafted from the engine's
 * output on 2026-11-24 (scripts/draftExpected.ts).
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
  "form-8824": {
    engineFields: {
      // Line 12 — Fair market value (FMV) of other property given up
      "form-8824.1.line.12_fmv_other_property_given_up": 6000,
      // Line 13 — Adjusted basis of other property given up
      "form-8824.1.line.13_adjusted_basis_other_property_given_up": 2500,
      // Line 14 — Gain or (loss) recognized on other property given up. Subtract line 13 from line
      "form-8824.1.line.14_gain_loss_other_property_given_up": 3500,
      // Line 15 — Cash received, FMV of other property received, plus net liabilities assumed by o
      "form-8824.1.line.15_cash_other_property_received": 25500,
      // Line 16 — FMV of like-kind property you received
      "form-8824.1.line.16_fmv_like_kind_property_received": 150000,
      // Line 17 — Add lines 15 and 16
      "form-8824.1.line.17_add_lines_15_and_16": 175500,
      // Line 18 — Adjusted basis of like-kind property you gave up, net amounts paid to other part
      "form-8824.1.line.18_adjusted_basis_like_kind_given_up": 84000,
      // Line 19 — Realized gain or (loss). Subtract line 18 from line 17
      "form-8824.1.line.19_realized_gain_loss": 91500,
      // Line 20 — Enter the smaller of line 15 or line 19, but not less than zero
      "form-8824.1.line.20_smaller_of_line_15_or_19": 25500,
      // Line 22 — Subtract line 21 from line 20. If zero or less, enter -0-
      "form-8824.1.line.22_subtract_line_21_from_20": 25500,
      // Line 23 — Recognized gain. Add lines 21 and 22
      "form-8824.1.line.23_recognized_gain": 25500,
      // Line 24 — Deferred gain or (loss). Subtract line 23 from line 19
      "form-8824.1.line.24_deferred_gain_loss": 66000,
      // Line 25 — Basis of like-kind property received. Subtract line 15 from the sum of lines 18
      "form-8824.1.line.25_basis_like_kind_property_received": 84000,
      // Line 30 — Sales price of divested property
      "form-8824.1.line.30_sales_price_divested_property": 48500,
      // Line 31 — Basis of divested property
      "form-8824.1.line.31_basis_divested_property": 31000,
      // Line 32 — Realized gain. Subtract line 31 from line 30
      "form-8824.1.line.32_realized_gain": 17500,
      // Line 33 — Cost of replacement property purchased within 60 days after date of sale
      "form-8824.1.line.33_cost_replacement_property": 44000,
      // Line 34 — Subtract line 33 from line 30. If zero or less, enter -0-
      "form-8824.1.line.34_subtract_line_33_from_30": 4500,
      // Line 35 — Ordinary income under recapture rules: 0 for stock (no depreciation). Verified by hand.
      "form-8824.1.line.35_ordinary_income_recapture": 0,
      // Line 36 — Subtract line 35 from line 34. If zero or less, enter -0-
      "form-8824.1.line.36_subtract_line_35_from_34": 4500,
      // Line 37 — Deferred gain. Subtract the sum of lines 35 and 36 from line 32
      "form-8824.1.line.37_deferred_gain": 13000,
      // Line 38 — Basis of replacement property. Subtract line 37 from line 33
      "form-8824.1.line.38_basis_replacement_property": 31000,
    },
    renderedText: {
      "form-8824.0.header.taxpayer_name": "Gaul Renner",
      "form-8824.0.header.identifying_number": "400-00-8824",
      "form-8824.0.line.1_property_given_up_description_row1":
        "Vacant land, 40 acres, 1200 County Road 18, Bastrop, TX",
      "form-8824.0.line.2_property_received_description_row1":
        "Vacant land, 25 acres, 300 Pecan Hollow Rd, Fredericksburg, TX",
      "form-8824.0.line.3_date_given_up_property_acquired": "03/14/2016",
      "form-8824.0.line.4_date_property_transferred": "05/09/2025",
      "form-8824.0.line.5_date_received_property_identified": "06/02/2025",
      "form-8824.0.line.6_date_property_received": "08/15/2025",
      "form-8824.0.line.8_related_party_name": "Davin Renner",
      "form-8824.0.line.8_related_party_relationship": "Brother",
      "form-8824.1.line.12a_description_other_property_given_up":
        "100 shares Lakeshore Grain Co. common stock",
      "form-8824.1.line.15a_description_other_property_received":
        "Used pickup truck; cash; liabilities",
      "form-8824.1.line.26_certificate_of_divestiture_number_part1": "25",
      "form-8824.1.line.26_certificate_of_divestiture_number_part2": "0417",
      "form-8824.1.line.29_date_divested_property_sold": "04/02/2025",
    },
    renderedChecked: [
      "form-8824.0.line.7_related_party_exchange_yes",
      "form-8824.0.line.9_related_party_disposed_property_no",
      "form-8824.0.line.10_you_disposed_property_no",
    ],
  },
  "schedule-d": {
    engineFields: {
      // Line 4 — Short-term gain from Form 6252 and short-term gain or (loss) from Forms 4684, 678
      "schedule-d.0.line.4_short_term_gain_other_forms": 4500,
      // Line 7 — Net short-term capital gain or (loss). Combine lines 1a through 6 in column (h)
      "schedule-d.0.line.7_net_short_term_gain_loss": 4500,
      // Line 11 — Gain from Form 4797, Part I; long-term gain from Forms 2439 and 6252; and long-t
      "schedule-d.0.line.11_long_term_gain_other_forms": 29000,
      // Line 15 — Net long-term capital gain or (loss). Combine lines 8a through 14 in column (h)
      "schedule-d.0.line.15_net_long_term_gain_loss": 29000,
      // Line 16 — Combine lines 7 and 15 and enter the result
      "schedule-d.1.line.16_combined_gain_loss": 33500,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 98000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 98000,
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": 33500,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 131500,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 131500,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 131500,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 115750,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 18355,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 18355,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 18355,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 18355,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 12500,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 12500,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 12500,
      // Line 37 — Amount you owe
      "form-1040.line.37": 5855,
    },
  },
};

export function gaulExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
