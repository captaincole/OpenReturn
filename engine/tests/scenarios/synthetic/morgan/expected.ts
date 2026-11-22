/*
 * morgan — LOCKED expected values, drafted from the engine's
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
  "form-8814": {
    engineFields: {
      // Line 1a — Enter your child's taxable interest
      "form-8814.0.line.1a_child_taxable_interest": 1237,
      // Line 1b — Enter your child's tax-exempt interest. Do not include this amount on line 1a
      "form-8814.0.line.1b_child_tax_exempt_interest": 318,
      // Line 2a — Enter your child's ordinary dividends, including any Alaska Permanent Fund divid
      "form-8814.0.line.2a_child_ordinary_dividends": 3486,
      // Line 2b — Enter your child's qualified dividends included on line 2a
      "form-8814.0.line.2b_child_qualified_dividends": 2719,
      // Line 3 — Enter your child's capital gain distributions
      "form-8814.0.line.3_child_capital_gain_distributions": 897,
      // Line 4 — Add lines 1a, 2a, and 3
      "form-8814.0.line.4_total_interest_dividends": 5620,
      // Line 6 — Subtract line 5 from line 4
      "form-8814.0.line.6_amount_over_base": 2920,
      // Line 9 — Multiply line 6 by line 7
      "form-8814.0.line.9_qualified_dividends_to_report": 1413,
      // Line 10 — Multiply line 6 by line 8
      "form-8814.0.line.10_capital_gain_to_report": 467,
      // Line 11 — Add lines 9 and 10
      "form-8814.0.line.11_add_lines_9_10": 1880,
      // Line 12 — Subtract line 11 from line 6. Include this amount in the total on Schedule 1 (Fo
      "form-8814.0.line.12_other_income_schedule_1": 1040,
      // Line 14 — Subtract line 13 from line 4. If the result is zero or less, enter -0-
      "form-8814.0.line.14_amount_over_not_taxed": 4270,
      // Line 15 — Tax
      "form-8814.0.line.15_tax": 135,
    },
    /*
     * Ellis's copy (copy 0). Lines 7 and 8 print around the form's decimal point:
     * 2,719 / 5,620 = 0.4838 → .484; 897 / 5,620 = 0.1596 → .160. Wren's copy
     * (copy 1) is not in the golden PDF; README.md has its hand check.
     */
    renderedText: {
      "form-8814.0.header.taxpayer_name": "Avery Morgan and Riley Morgan",
      "form-8814.0.header.a_child_name": "Ellis Morgan",
      "form-8814.0.line.7_qualified_dividends_ratio_whole": "0",
      "form-8814.0.line.7_qualified_dividends_ratio_decimal": "484",
      "form-8814.0.line.8_capital_gain_ratio_whole": "0",
      "form-8814.0.line.8_capital_gain_ratio_decimal": "160",
    },
    renderedBlank: ["form-8814.0.line.15_line_14_less_than_1350_yes"],
    renderedChecked: [
      "form-8814.0.header.c_more_than_one_form_8814",
      "form-8814.0.line.15_line_14_less_than_1350_no",
    ],
  },
  "form-8949": {
    engineFields: {
      // Row 1 — (d) Proceeds (sales price)
      "form-8949.1.part2.row1_proceeds": 18450,
      // Row 1 — (e) Cost or other basis
      "form-8949.1.part2.row1_cost_basis": 12175,
      // Row 1 — (h) Gain or (loss)
      "form-8949.1.part2.row1_gain_loss": 6275,
      // Line 2 Totals — (d) Proceeds (sales price)
      "form-8949.1.part2.totals_proceeds": 18450,
      // Line 2 Totals — (e) Cost or other basis
      "form-8949.1.part2.totals_cost_basis": 12175,
      // Line 2 Totals — (h) Gain or (loss)
      "form-8949.1.part2.totals_gain_loss": 6275,
    },
  },
  "schedule-d": {
    engineFields: {
      // Line 8b — Proceeds (sales price) — Totals for all transactions reported on Form(s) 8949 wi
      "schedule-d.0.line.8b_proceeds": 18450,
      // Line 8b — Cost (or other basis) — Totals for all transactions reported on Form(s) 8949 wit
      "schedule-d.0.line.8b_cost": 12175,
      // Line 8b — Gain or (loss) — Totals for all transactions reported on Form(s) 8949 with Box D
      "schedule-d.0.line.8b_gain_loss": 6275,
      // Line 13 — Capital gain distributions
      "schedule-d.0.line.13_capital_gain_distributions": 682,
      // Line 15 — Net long-term capital gain or (loss). Combine lines 8a through 14 in column (h)
      "schedule-d.0.line.15_net_long_term_gain_loss": 6957,
      // Line 16 — Combine lines 7 and 15 and enter the result
      "schedule-d.1.line.16_combined_gain_loss": 6957,
    },
  },
  "schedule-b": {
    engineFields: {
      // Line 1 — Amount (row 1)
      "schedule-b.0.line.1_amount_1": 612,
      // Line 2 — Add the amounts on line 1
      "schedule-b.0.line.2_total_interest": 612,
      // Line 4 — Subtract line 3 from line 2. Enter the result here and on Form 1040 or 1040-SR, l
      "schedule-b.0.line.4_taxable_interest": 612,
      // Line 5 — Amount (row 1)
      "schedule-b.0.line.5_amount_1": 1240,
      // Line 5 — Amount (row 2)
      "schedule-b.0.line.5_amount_2": 1413,
      // Line 6 — Add the amounts on line 5. Enter the total here and on Form 1040 or 1040-SR, line
      "schedule-b.0.line.6_total_ordinary_dividends": 2653,
    },
    // Form 8814 line 9 is a line 5 row named "Form 8814"; Wren's line 9 is blank, so one row.
    renderedText: { "schedule-b.0.line.5_payer_name_2": "Form 8814" },
    renderedBlank: ["schedule-b.0.line.5_payer_name_3"],
  },
  "schedule-1": {
    engineFields: {
      // Line 8z — Other income amount
      "schedule-1.0.line.8z": 1040,
      // Line 9 — Total other income. Add lines 8a through 8z
      "schedule-1.0.line.9": 1040,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 1040,
    },
    renderedText: { "schedule-1.0.line.8z_type": "Form 8814" },
  },
  "schedule-8812": {
    engineFields: {
      // Line 1 — Enter the amount from line 11a of your Form 1040, 1040-SR, or 1040-NR
      "schedule-8812.0.line.1_form_1040_line_11a": 153612,
      // Line 3 — Add lines 1 and 2d
      "schedule-8812.0.line.3_modified_agi": 153612,
      // Line 4 — Number of qualifying children under age 17 with the required social security numb
      "schedule-8812.0.line.4_qualifying_children_under_17": 2,
      // Line 5 — Multiply line 4 by $2,200
      "schedule-8812.0.line.5_qualifying_children_times_2200": 4400,
      // Line 8 — Add lines 5 and 7
      "schedule-8812.0.line.8_total_credit_before_limit": 4400,
      // Line 9 — Enter the amount shown below for your filing status. Married filing jointly—$400,
      "schedule-8812.0.line.9_filing_status_threshold": 400000,
      // Line 12 — Is the amount on line 8 more than the amount on line 11? Yes. Subtract line 11 f
      "schedule-8812.0.line.12_credit_after_phaseout": 4400,
      // Line 13 — Enter the amount from Credit Limit Worksheet A
      "schedule-8812.0.line.13_credit_limit_worksheet_a": 16248,
      // Line 14 — Enter the smaller of line 12 or line 13. This is your child tax credit and credi
      "schedule-8812.0.line.14_child_tax_credit_and_other_dependents": 4400,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 142350,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 142350,
      // Line 2b — Taxable interest
      "form-1040.line.2b": 612,
      // Line 3a — Qualified dividends
      "form-1040.line.3a": 2393,
      // Line 3b — Ordinary dividends
      "form-1040.line.3b": 2653,
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": 6957,
      // Line 7b — Includes child's capital gain or (loss) amount
      "form-1040.line.7b_childs_capital_gain_amount": 467,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 1040,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 153612,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 153612,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 153612,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 31500,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 31500,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 122112,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 16248,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 16248,
      // Line 19 — Child tax credit or credit for other dependents from Schedule 8812
      "form-1040.line.19": 4400,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 4400,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 11848,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 11848,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 14200,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 14200,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 14200,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 2352,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 2352,
    },
    // Schedule D files, so line 7b's "Schedule D not required" box stays blank.
    renderedBlank: ["form-1040.line.7b_schedule_d_not_required"],
    renderedChecked: [
      "form-1040.header.filing_status_mfj",
      "form-1040.line.3c_box1",
      "form-1040.line.3c_box2",
      "form-1040.line.7b_includes_childs_capital_gain",
      "form-1040.line.16_from_form_8814",
    ],
  },
};

export function morganExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
