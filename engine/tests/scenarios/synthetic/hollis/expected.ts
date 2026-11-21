/*
 * hollis — LOCKED expected values, drafted from the engine's
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
  "form-6781": {
    engineFields: {
      // Line 1, row 1 — (c) Gain
      "form-6781.0.line.1_row1_col_c": 13205,
      // Line 1, row 2 — (b) (Loss)
      "form-6781.0.line.1_row2_col_b": 4318,
      // Line 2 — Add the amounts on line 1 in columns (b) and (c): (b) (Loss)
      "form-6781.0.line.2_total_col_b": 4318,
      // Line 2 — Add the amounts on line 1 in columns (b) and (c): (c) Gain
      "form-6781.0.line.2_total_col_c": 13205,
      // Line 3 — Net gain or (loss). Combine line 2, columns (b) and (c)
      "form-6781.0.line.3_net_gain_or_loss": 8887,
      // Line 5 — Combine lines 3 and 4
      "form-6781.0.line.5_combine_lines_3_and_4": 8887,
      // Line 7 — Combine lines 5 and 6
      "form-6781.0.line.7_combine_lines_5_and_6": 8887,
      // Line 8 — Short-term capital gain or (loss). Multiply line 7 by 40% (0.40)
      "form-6781.0.line.8_short_term_capital_gain_loss": 3555,
      // Line 9 — Long-term capital gain or (loss). Multiply line 7 by 60% (0.60)
      "form-6781.0.line.9_long_term_capital_gain_loss": 5332,
    },
    renderedText: {
      "form-6781.0.header.identifying_number": "400-00-6781",
      "form-6781.0.line.1_row1_col_a": "Form 1099-B, Ridgeline Futures LLC",
      "form-6781.0.line.1_row2_col_a": "Form 1099-B, Mesa Commodity Partners",
    },
    // Line 4 has no input; line 6 is skipped on a net gain (the form's Note).
    renderedBlank: [
      "form-6781.0.line.1_row3_col_a",
      "form-6781.0.line.4_form_1099b_adjustments",
      "form-6781.0.line.6_loss_carried_back",
    ],
  },
  "schedule-d": {
    engineFields: {
      // Line 4 — Short-term gain from Form 6252 and short-term gain or (loss) from Forms 4684, 678
      "schedule-d.0.line.4_short_term_gain_other_forms": 3555,
      // Line 7 — Net short-term capital gain or (loss). Combine lines 1a through 6 in column (h)
      "schedule-d.0.line.7_net_short_term_gain_loss": 3555,
      // Line 11 — Gain from Form 4797, Part I; long-term gain from Forms 2439 and 6252; and long-t
      "schedule-d.0.line.11_long_term_gain_other_forms": 5332,
      // Line 15 — Net long-term capital gain or (loss). Combine lines 8a through 14 in column (h)
      "schedule-d.0.line.15_net_long_term_gain_loss": 5332,
      // Line 16 — Combine lines 7 and 15 and enter the result
      "schedule-d.1.line.16_combined_gain_loss": 8887,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 95000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 95000,
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": 8887,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 103887,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 103887,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 103887,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 88137,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 13936,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 13936,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 13936,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 13936,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 11000,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 11000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 11000,
      // Line 37 — Amount you owe
      "form-1040.line.37": 2936,
    },
  },
};

export function hollisExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
