/*
 * dobraine — LOCKED expected values, drafted from the engine's
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
      // Line 15 — Cash received, FMV of other property received, plus net liabilities assumed by o
      "form-8824.1.line.15_cash_other_property_received": 26000,
      // Line 16 — FMV of like-kind property you received
      "form-8824.1.line.16_fmv_like_kind_property_received": 260000,
      // Line 17 — Add lines 15 and 16
      "form-8824.1.line.17_add_lines_15_and_16": 286000,
      // Line 18 — Adjusted basis of like-kind property you gave up, net amounts paid to other part
      "form-8824.1.line.18_adjusted_basis_like_kind_given_up": 60000,
      // Line 19 — Realized gain or (loss). Subtract line 18 from line 17
      "form-8824.1.line.19_realized_gain_loss": 226000,
      // Line 20 — Enter the smaller of line 15 or line 19, but not less than zero
      "form-8824.1.line.20_smaller_of_line_15_or_19": 26000,
      // Line 21 — Ordinary income under recapture rules
      "form-8824.1.line.21_ordinary_income_recapture": 18000,
      // Line 22 — Subtract line 21 from line 20. If zero or less, enter -0-
      "form-8824.1.line.22_subtract_line_21_from_20": 8000,
      // Line 23 — Recognized gain. Add lines 21 and 22
      "form-8824.1.line.23_recognized_gain": 26000,
      // Line 24 — Deferred gain or (loss). Subtract line 23 from line 19
      "form-8824.1.line.24_deferred_gain_loss": 200000,
      // Line 25 — Basis of like-kind property received. Subtract line 15 from the sum of lines 18
      "form-8824.1.line.25_basis_like_kind_property_received": 60000,
      // Line 25a — Basis of like-kind section 1250 property received
      "form-8824.1.line.25a_basis_section_1250_property": 41538,
      // Line 25b — Basis of like-kind section 1245, 1252, 1254, and 1255 property received
      "form-8824.1.line.25b_basis_section_1245_property": 11538,
      // Line 25c — Basis of like-kind intangible property received
      "form-8824.1.line.25c_basis_intangible_property": 2308,
    },
    renderedText: {
      "form-8824.0.header.taxpayer_name": "Dobraine Halvorsen",
      "form-8824.0.line.5_date_received_property_identified": "04/10/2025",
      "form-8824.1.line.15a_description_other_property_received": "cash",
    },
    renderedChecked: ["form-8824.0.line.7_related_party_exchange_no"],
  },
  "form-4797": {
    engineFields: {
      // Line 5 — Section 1231 gain or (loss) from like-kind exchanges from Form 8824
      "form-4797.0.line.5_section_1231_like_kind_exchanges": 8000,
      // Line 7 — Combine lines 2 through 6. Enter the gain or (loss) here and on the appropriate l
      "form-4797.0.line.7_net_section_1231_gain_loss": 8000,
      // Line 16 — Ordinary gain or (loss) from like-kind exchanges from Form 8824
      "form-4797.0.line.16_ordinary_like_kind_exchanges": 18000,
      // Line 17 — Combine lines 10 through 16
      "form-4797.0.line.17_ordinary_gain_loss_total": 18000,
      // Line 18b — Redetermine the gain or (loss) on line 17 excluding the loss, if any, on line 1
      "form-4797.0.line.18b_redetermined_ordinary_gain_loss": 18000,
    },
  },
  "schedule-d": {
    engineFields: {
      // Line 11 — Gain from Form 4797, Part I; long-term gain from Forms 2439 and 6252; and long-t
      "schedule-d.0.line.11_long_term_gain_other_forms": 8000,
      // Line 15 — Net long-term capital gain or (loss). Combine lines 8a through 14 in column (h)
      "schedule-d.0.line.15_net_long_term_gain_loss": 8000,
      // Line 16 — Combine lines 7 and 15 and enter the result
      "schedule-d.1.line.16_combined_gain_loss": 8000,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 4 — Other gains or (losses)
      "schedule-1.0.line.4": 18000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 18000,
    },
    renderedChecked: ["schedule-1.0.line.4_form_4797"],
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 76000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 76000,
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": 8000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 18000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 102000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 102000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 102000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 86250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 13335,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 13335,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 13335,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 13335,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 8100,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 8100,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 8100,
      // Line 37 — Amount you owe
      "form-1040.line.37": 5235,
    },
  },
};

export function dobraineExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
