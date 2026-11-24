/*
 * talmanes — LOCKED expected values, drafted from the engine's
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
  "form-2210": {
    engineFields: {
      // Line 1 — Enter your 2025 tax after credits from Form 1040, 1040-SR, or 1040-NR, line 22
      "form-2210.0.line.1_tax_after_credits": 74134,
      // Line 2 — Other taxes, including self-employment tax and, if applicable, Additional Medicar
      "form-2210.0.line.2_other_taxes": 2510,
      // Line 4 — Current year tax. Combine lines 1, 2, and 3
      "form-2210.0.line.4_current_year_tax": 76644,
      // Line 5 — Multiply line 4 by 90% (0.90)
      "form-2210.0.line.5_ninety_percent_current_tax": 68980,
      // Line 6 — Withholding taxes. Don't include estimated tax payments
      "form-2210.0.line.6_withholding_taxes": 56900,
      // Line 7 — Subtract line 6 from line 4
      "form-2210.0.line.7_tax_less_withholding": 19744,
      // Line 8 — Maximum required annual payment based on prior year's tax
      "form-2210.0.line.8_prior_year_tax_payment": 66000,
      // Line 9 — Required annual payment. Enter the smaller of line 5 or line 8
      "form-2210.0.line.9_required_annual_payment": 66000,
      // Line 10 — Required installments, column (a) 4/15/25
      "form-2210.1.line.10_required_installments_col_a": 16500,
      // Line 10 — Required installments, column (b) 6/15/25
      "form-2210.1.line.10_required_installments_col_b": 16500,
      // Line 10 — Required installments, column (c) 9/15/25
      "form-2210.1.line.10_required_installments_col_c": 16500,
      // Line 10 — Required installments, column (d) 1/15/26
      "form-2210.1.line.10_required_installments_col_d": 16500,
      // Line 11 — Estimated tax paid and tax withheld, column (a) 4/15/25
      "form-2210.1.line.11_estimated_tax_paid_withheld_col_a": 28800,
      // Line 11 — Estimated tax paid and tax withheld, column (b) 6/15/25
      "form-2210.1.line.11_estimated_tax_paid_withheld_col_b": 6400,
      // Line 11 — Estimated tax paid and tax withheld, column (c) 9/15/25
      "form-2210.1.line.11_estimated_tax_paid_withheld_col_c": 9600,
      // Line 11 — Estimated tax paid and tax withheld, column (d) 1/15/26
      "form-2210.1.line.11_estimated_tax_paid_withheld_col_d": 34100,
      // Line 12 — Enter the amount, if any, from line 18 in the previous column, column (b) 6/15/2
      "form-2210.1.line.12_overpayment_from_previous_column_col_b": 12300,
      // Line 12 — Enter the amount, if any, from line 18 in the previous column, column (c) 9/15/2
      "form-2210.1.line.12_overpayment_from_previous_column_col_c": 2200,
      // Line 13 — Add lines 11 and 12, column (b) 6/15/25
      "form-2210.1.line.13_add_lines_11_12_col_b": 18700,
      // Line 13 — Add lines 11 and 12, column (c) 9/15/25
      "form-2210.1.line.13_add_lines_11_12_col_c": 11800,
      // Line 13 — Add lines 11 and 12, column (d) 1/15/26
      "form-2210.1.line.13_add_lines_11_12_col_d": 34100,
      // Line 14 — Add the amounts on lines 16 and 17 in the previous column, column (d) 1/15/26
      "form-2210.1.line.14_previous_column_lines_16_17_col_d": 4700,
      // Line 15 — Subtract line 14 from line 13. If zero or less, enter -0-. For column (a) only,
      "form-2210.1.line.15_subtract_line_14_from_13_col_a": 28800,
      // Line 15 — Subtract line 14 from line 13. If zero or less, enter -0-, column (b) 6/15/25
      "form-2210.1.line.15_subtract_line_14_from_13_col_b": 18700,
      // Line 15 — Subtract line 14 from line 13. If zero or less, enter -0-, column (c) 9/15/25
      "form-2210.1.line.15_subtract_line_14_from_13_col_c": 11800,
      // Line 15 — Subtract line 14 from line 13. If zero or less, enter -0-, column (d) 1/15/26
      "form-2210.1.line.15_subtract_line_14_from_13_col_d": 29400,
      // Line 17 — Underpayment. If line 10 is equal to or more than line 15, subtract line 15 from
      "form-2210.1.line.17_underpayment_col_c": 4700,
      // Line 18 — Overpayment. If line 15 is more than line 10, subtract line 10 from line 15, col
      "form-2210.1.line.18_overpayment_col_a": 12300,
      // Line 18 — Overpayment. If line 15 is more than line 10, subtract line 10 from line 15, col
      "form-2210.1.line.18_overpayment_col_b": 2200,
      // Line 19 — Penalty. Enter the total penalty from line 14 of the Worksheet for Form 2210, Pa
      "form-2210.1.line.19_penalty": 56,
      // Verified zero (hand check, README.md)
      "form-2210.0.line.3_other_payments_refundable_credits": 0,
      // Verified zero (hand check, README.md)
      "form-2210.1.line.12_overpayment_from_previous_column_col_d": 0,
      // Verified zero (hand check, README.md)
      "form-2210.1.line.14_previous_column_lines_16_17_col_b": 0,
      // Verified zero (hand check, README.md)
      "form-2210.1.line.16_subtract_line_13_from_14_col_b": 0,
    },
    renderedChecked: [
      "form-2210.0.line.9_more_than_line_6_yes",
      "form-2210.0.line.box_b_waiver_part_penalty",
      "form-2210.0.line.box_d_withholding_actual_dates",
      "form-2210.0.line.box_e_joint_return_one_year",
    ],
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 360000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 360000,
      // Line 2b — Taxable interest
      "form-1040.line.2b": 40000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 400000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 400000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 400000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 31500,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 31500,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 368500,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 74134,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 74134,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 74134,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 2510,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 76644,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 56000,
      // Line 25c — Federal income tax withheld from other forms (see instructions)
      "form-1040.line.25c": 900,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 56900,
      // Line 26 — 2025 estimated tax payments and amount applied from 2024 return
      "form-1040.line.26": 22000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 78900,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 2256,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 2200,
      // Line 38 — Estimated tax penalty (see instructions)
      "form-1040.line.38": 56,
    },
  },
  "schedule-b": {
    engineFields: {
      // Line 1 — Amount (row 1)
      "schedule-b.0.line.1_amount_1": 40000,
      // Line 2 — Add the amounts on line 1
      "schedule-b.0.line.2_total_interest": 40000,
      // Line 4 — Subtract line 3 from line 2. Enter the result here and on Form 1040 or 1040-SR, l
      "schedule-b.0.line.4_taxable_interest": 40000,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 990,
      // Line 12 — Net investment income tax. Attach Form 8960
      "schedule-2.0.line.12_net_investment_income_tax": 1520,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 2510,
    },
  },
  "form-8959": {
    engineFields: {
      // Line 1 — Medicare wages and tips from Form W-2, box 5
      "form-8959.0.line.1_medicare_wages_tips": 360000,
      // Line 4 — Add lines 1 through 3
      "form-8959.0.line.4_total_medicare_wages": 360000,
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 250000,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-8959.0.line.6_excess_medicare_wages": 110000,
      // Line 7 — Additional Medicare Tax on Medicare wages. Multiply line 6 by 0.9% (0.009)
      "form-8959.0.line.7_additional_medicare_tax_wages": 990,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 990,
      // Line 19 — Medicare tax withheld from Form W-2, box 6
      "form-8959.0.line.19_medicare_tax_withheld": 6120,
      // Line 20 — Enter the amount from line 1
      "form-8959.0.line.20_medicare_wages_from_line1": 360000,
      // Line 21 — Multiply line 20 by 1.45% (0.0145). Regular Medicare tax withholding on Medicare
      "form-8959.0.line.21_regular_medicare_tax_on_wages": 5220,
      // Line 22 — Subtract line 21 from line 19. If zero or less, enter -0-. Additional Medicare T
      "form-8959.0.line.22_additional_medicare_tax_withholding_wages": 900,
      // Line 24 — Total Additional Medicare Tax withholding. Add lines 22 and 23
      "form-8959.0.line.24_total_additional_medicare_tax_withholding": 900,
    },
  },
  "form-8960": {
    engineFields: {
      // Line 1 — Taxable interest (see instructions)
      "form-8960.0.line.1": 40000,
      // Line 8 — Total investment income. Combine lines 1, 2, 3, 4c, 5d, 6, and 7
      "form-8960.0.line.8": 40000,
      // Line 12 — Net investment income. Subtract Part II, line 11, from Part I, line 8. If zero o
      "form-8960.0.line.12": 40000,
      // Line 13 — Modified adjusted gross income (see instructions)
      "form-8960.0.line.13": 400000,
      // Line 14 — Threshold based on filing status (see instructions)
      "form-8960.0.line.14": 250000,
      // Line 15 — Subtract line 14 from line 13. If zero or less, enter -0-
      "form-8960.0.line.15": 150000,
      // Line 16 — Enter the smaller of line 12 or line 15
      "form-8960.0.line.16": 40000,
      // Line 17 — Net investment income tax for individuals. Multiply line 16 by 3.8% (0.038)
      "form-8960.0.line.17": 1520,
    },
  },
};

export function talmanesExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
