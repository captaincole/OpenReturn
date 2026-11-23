/*
 * mat — LOCKED expected values, drafted from the engine's
 * output on 2026-11-23 (scripts/draftExpected.ts).
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
  "schedule-b": {
    engineFields: {
      // Line 1 — Amount (row 1)
      "schedule-b.0.line.1_amount_1": 420,
      // Line 1 — Amount (row 2)
      "schedule-b.0.line.1_amount_2": 1850,
      // Line 2 — Add the amounts on line 1
      "schedule-b.0.line.2_total_interest": 2270,
      // Line 4 — Subtract line 3 from line 2. Enter the result here and on Form 1040 or 1040-SR, l
      "schedule-b.0.line.4_taxable_interest": 2270,
      // Line 5 — Amount (row 1)
      "schedule-b.0.line.5_amount_1": 3600,
      // Line 6 — Add the amounts on line 5. Enter the total here and on Form 1040 or 1040-SR, line
      "schedule-b.0.line.6_total_ordinary_dividends": 3600,
    },
  },
  "schedule-d": {
    engineFields: {
      // Line 12 — Net long-term gain or (loss) from partnerships, S corporations, estates, and tru
      "schedule-d.0.line.12_net_long_term_passthrough": 5400,
      // Line 15 — Net long-term capital gain or (loss). Combine lines 8a through 14 in column (h)
      "schedule-d.0.line.15_net_long_term_gain_loss": 5400,
      // Line 16 — Combine lines 7 and 15 and enter the result
      "schedule-d.1.line.16_combined_gain_loss": 5400,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 6 — Qualified REIT dividends and publicly traded partnership (PTP) income or (loss)
      "form-8995.0.line.6": 480,
      // Line 8 — Total qualified REIT dividends and PTP income. Combine lines 6 and 7. If zero or
      "form-8995.0.line.8": 480,
      // Line 9 — REIT and PTP component. Multiply line 8 by 20% (0.20)
      "form-8995.0.line.9": 96,
      // Line 10 — Qualified business income deduction before the income limitation. Add lines 5 an
      "form-8995.0.line.10": 96,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 189770,
      // Line 12 — Enter your net capital gain, if any, increased by any qualified dividends
      "form-8995.0.line.12": 8300,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 181470,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 36294,
      // Line 15 — Qualified business income deduction. Enter the smaller of line 10 or line 14
      "form-8995.0.line.15": 96,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 210000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 210000,
      // Line 2b — Taxable interest
      "form-1040.line.2b": 2270,
      // Line 3a — Qualified dividends
      "form-1040.line.3a": 2900,
      // Line 3b — Ordinary dividends
      "form-1040.line.3b": 3600,
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": 5400,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 221270,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 221270,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 221270,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 31500,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 96,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 31596,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 189674,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 30975,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 30975,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 30975,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 30975,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 30300,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 30300,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 30300,
      // Line 37 — Amount you owe
      "form-1040.line.37": 675,
    },
  },
};

export function matExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
