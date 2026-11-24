/*
 * thom — LOCKED expected values, drafted from the engine's
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
  "form-1116": {
    engineFields: {
      // Line 1a — Gross income from sources within country shown above and of the type checked abo
      "form-1116.0.line.1a_gross_foreign_income_col_a": 5200,
      // Line 1a — Gross income from sources within country shown above and of the type checked abo
      "form-1116.0.line.1a_gross_foreign_income_total": 5200,
      // Line 3a — Certain itemized deductions or standard deduction, column A
      "form-1116.0.line.3a_itemized_or_standard_deduction_col_a": 15750,
      // Line 3c — Add lines 3a and 3b, column A
      "form-1116.0.line.3c_add_lines_3a_3b_col_a": 15750,
      // Line 3d — Gross foreign source income, column A
      "form-1116.0.line.3d_gross_foreign_source_income_col_a": 5200,
      // Line 3e — Gross income from all sources, column A
      "form-1116.0.line.3e_gross_income_all_sources_col_a": 162000,
      // Line 3g — Multiply line 3c by line 3f, column A
      "form-1116.0.line.3g_multiply_3c_by_3f_col_a": 506,
      // Line 6 — Add lines 2, 3g, 4a, 4b, and 5, column A
      "form-1116.0.line.6_total_deductions_and_losses_col_a": 506,
      // Line 6 — Add lines 2, 3g, 4a, 4b, and 5, Total (add cols. A, B, and C)
      "form-1116.0.line.6_total_deductions_and_losses_total": 506,
      // Line 7 — Subtract line 6 from line 1a
      "form-1116.0.line.7_net_foreign_source_income": 4694,
      // Country A — In U.S. dollars, taxes withheld at source on: (q) Dividends
      "form-1116.0.line.row_a_usd_withheld_dividends_col_q": 640,
      // Country A — (u) Total foreign taxes paid or accrued (add cols. (q) through (t))
      "form-1116.0.line.row_a_total_foreign_taxes_col_u": 640,
      // Line 8 — Add lines A through C, column (u)
      "form-1116.0.line.8_total_foreign_taxes_paid": 640,
      // Line 9 — Enter the amount from line 8. These are your total foreign taxes paid or accrued
      "form-1116.1.line.9_foreign_taxes_from_line_8": 640,
      // Line 11 — Add lines 9 and 10
      "form-1116.1.line.11_add_lines_9_10": 640,
      // Line 14 — Combine lines 11, 12, and 13. This is the total amount of foreign taxes availabl
      "form-1116.1.line.14_foreign_taxes_available_for_credit": 640,
      // Line 15 — Enter the amount from line 7. This is your taxable income or (loss) from sources
      "form-1116.1.line.15_foreign_taxable_income_from_line_7": 4694,
      // Line 17 — Combine the amounts on lines 15 and 16. This is your net foreign source taxable
      "form-1116.1.line.17_net_foreign_source_taxable_income": 4694,
      // Line 18 — Individuals: Enter the sum of (i) Form 1040, 1040-SR, or 1040-NR, line 11b, minu
      "form-1116.1.line.18_taxable_income_all_sources": 146250,
      // Line 20 — Individuals: Enter the total of Form 1040, 1040-SR, or 1040-NR, line 16, and Sch
      "form-1116.1.line.20_tax_before_credits": 27380,
      // Line 21 — Multiply line 20 by line 19 (maximum amount of credit)
      "form-1116.1.line.21_maximum_amount_of_credit": 879,
      // Line 23 — Add lines 21 and 22
      "form-1116.1.line.23_add_lines_21_22": 879,
      // Line 24 — Enter the smaller of line 14 or line 23
      "form-1116.1.line.24_smaller_of_line_14_or_23": 640,
      // Line 27 — Credit for taxes on passive category income
      "form-1116.1.line.27_credit_passive_category_income": 640,
      // Line 32 — Add lines 25 through 31
      "form-1116.1.line.32_add_lines_25_through_31": 640,
      // Line 33 — Enter the smaller of line 20 or line 32
      "form-1116.1.line.33_smaller_of_line_20_or_32": 640,
      // Line 35 — Subtract line 34 from line 33. This is your foreign tax credit
      "form-1116.1.line.35_foreign_tax_credit": 640,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 1 — Foreign tax credit. Attach Form 1116 if required
      "schedule-3.0.line.1": 640,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 640,
    },
  },
  "schedule-b": {
    engineFields: {
      // Line 1 — Amount (row 1)
      "schedule-b.0.line.1_amount_1": 1600,
      // Line 2 — Add the amounts on line 1
      "schedule-b.0.line.2_total_interest": 1600,
      // Line 4 — Subtract line 3 from line 2. Enter the result here and on Form 1040 or 1040-SR, l
      "schedule-b.0.line.4_taxable_interest": 1600,
      // Line 5 — Amount (row 1)
      "schedule-b.0.line.5_amount_1": 8400,
      // Line 6 — Add the amounts on line 5. Enter the total here and on Form 1040 or 1040-SR, line
      "schedule-b.0.line.6_total_ordinary_dividends": 8400,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 152000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 152000,
      // Line 2b — Taxable interest
      "form-1040.line.2b": 1600,
      // Line 3a — Qualified dividends
      "form-1040.line.3a": 6300,
      // Line 3b — Ordinary dividends
      "form-1040.line.3b": 8400,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 162000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 162000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 162000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 146250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 27380,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 27380,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 640,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 640,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 26740,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 26740,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 27500,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 27500,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 27500,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 760,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 760,
    },
  },
};

export function thomExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
