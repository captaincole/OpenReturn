/*
 * nynaeve — LOCKED expected values, drafted from the engine's
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
  "form-8615": {
    engineFields: {
      // Line 1 — Enter the child's unearned income
      "form-8615.0.line.1_child_unearned_income": 14300,
      // Line 2 — If the child did not itemize deductions on Schedule A (Form 1040) or Schedule A (
      "form-8615.0.line.2_unearned_income_floor": 2700,
      // Line 3 — Subtract line 2 from line 1
      "form-8615.0.line.3_line_1_minus_line_2": 11600,
      // Line 4 — Enter the child's taxable income from Form 1040 or 1040-NR, line 15
      "form-8615.0.line.4_child_taxable_income": 18550,
      // Line 5 — Enter the smaller of line 3 or line 4
      "form-8615.0.line.5_net_unearned_income": 11600,
      // Line 6 — Enter the parent's taxable income from Form 1040 or 1040-NR, line 15
      "form-8615.0.line.6_parent_taxable_income": 238400,
      // Line 7 — Enter the total, if any, from Forms 8615, line 5, of all other children of the pa
      "form-8615.0.line.7_other_children_net_unearned_income": 3400,
      // Line 8 — Add lines 5, 6, and 7
      "form-8615.0.line.8_add_lines_5_6_7": 253400,
      // Line 9 — Enter the tax on the amount on line 8 based on the parent's filing status above
      "form-8615.0.line.9_tax_on_line_8": 44765,
      // Line 10 — Enter the parent's tax from Form 1040 or 1040-NR, line 16, minus any alternative
      "form-8615.0.line.10_parent_tax": 41866,
      // Line 11 — Subtract line 10 from line 9 and enter the result
      "form-8615.0.line.11_line_9_minus_line_10": 2899,
      // Line 12a — Add lines 5 and 7
      "form-8615.0.line.12a_add_lines_5_7": 15000,
      // Line 13 — Multiply line 11 by line 12b
      "form-8615.0.line.13_child_share_parent_rate_tax": 2241,
      // Line 14 — Subtract line 5 from line 4
      "form-8615.0.line.14_line_4_minus_line_5": 6950,
      // Line 15 — Enter the tax on the amount on line 14 based on the child's filing status
      "form-8615.0.line.15_tax_on_line_14": 533,
      // Line 16 — Add lines 13 and 15
      "form-8615.0.line.16_add_lines_13_15": 2774,
      // Line 17 — Enter the tax on the amount on line 4 based on the child's filing status
      "form-8615.0.line.17_tax_on_line_4": 1008,
      // Line 18 — Enter the larger of line 16 or line 17 here and on the child's Form 1040 or 1040
      "form-8615.0.line.18_child_tax": 2774,
    },
    renderedText: {
      "form-8615.0.header.child_name": "Nynaeve Thornbury",
      "form-8615.0.header.child_ssn": "400-00-8615",
      "form-8615.0.header.a_parent_name": "Garrick T. Thornbury",
      "form-8615.0.header.b_parent_ssn": "400-00-8617",
      // Line 12b: 11,600 / 15,000 = 0.773, printed after the form's "× .".
      "form-8615.0.line.12b_line_5_share_decimal": "773",
    },
    // Lines 9, 15 and 17 hold qualified dividends or net capital gain; the parent's return has both (line 10).
    renderedChecked: [
      "form-8615.0.header.c_parent_filing_status_married_jointly",
      "form-8615.0.line.9_tax_worksheet_used_checkbox",
      "form-8615.0.line.10_tax_worksheet_used_checkbox",
      "form-8615.0.line.15_tax_worksheet_used_checkbox",
      "form-8615.0.line.17_tax_worksheet_used_checkbox",
    ],
    renderedBlank: [
      "form-8615.0.header.c_parent_filing_status_single",
      "form-8615.0.header.c_parent_filing_status_married_separately",
      "form-8615.0.header.c_parent_filing_status_head_of_household",
      "form-8615.0.header.c_parent_filing_status_surviving_spouse",
    ],
  },
  "schedule-b": {
    engineFields: {
      // Line 1 — Amount (row 1)
      "schedule-b.0.line.1_amount_1": 2600,
      // Line 2 — Add the amounts on line 1
      "schedule-b.0.line.2_total_interest": 2600,
      // Line 4 — Subtract line 3 from line 2. Enter the result here and on Form 1040 or 1040-SR, l
      "schedule-b.0.line.4_taxable_interest": 2600,
      // Line 5 — Amount (row 1)
      "schedule-b.0.line.5_amount_1": 9400,
      // Line 6 — Add the amounts on line 5. Enter the total here and on Form 1040 or 1040-SR, line
      "schedule-b.0.line.6_total_ordinary_dividends": 9400,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 20000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 20000,
      // Line 2b — Taxable interest
      "form-1040.line.2b": 2600,
      // Line 3a — Qualified dividends
      "form-1040.line.3a": 6200,
      // Line 3b — Ordinary dividends
      "form-1040.line.3b": 9400,
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": 2300,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 34300,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 34300,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 34300,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 18550,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 2774,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 2774,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 2774,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 2774,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 900,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 900,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 900,
      // Line 37 — Amount you owe
      "form-1040.line.37": 1874,
    },
  },
};

export function nynaeveExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
