/*
 * lamgwin — LOCKED expected values, drafted from the engine's
 * output on 2026-11-27 (scripts/draftExpected.ts).
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
  "form-8874": {
    engineFields: {
      // Line 1, row 1 — (d) Amount of qualified equity investment
      "form-8874.0.line.1_row1_equity_investment_amount_col_d": 40000,
      // Line 1, row 1 — (f) Credit ((d) × (e))
      "form-8874.0.line.1_row1_credit_col_f": 2000,
      // Line 1, row 2 — (d) Amount of qualified equity investment
      "form-8874.0.line.1_row2_equity_investment_amount_col_d": 75000,
      // Line 1, row 2 — (f) Credit ((d) × (e))
      "form-8874.0.line.1_row2_credit_col_f": 3750,
      // Line 1, row 3 — (d) Amount of qualified equity investment
      "form-8874.0.line.1_row3_equity_investment_amount_col_d": 60000,
      // Line 1, row 3 — (f) Credit ((d) × (e))
      "form-8874.0.line.1_row3_credit_col_f": 3000,
      // Line 1, row 4 — (d) Amount of qualified equity investment
      "form-8874.0.line.1_row4_equity_investment_amount_col_d": 120000,
      // Line 1, row 4 — (f) Credit ((d) × (e))
      "form-8874.0.line.1_row4_credit_col_f": 7200,
      // Line 1, row 5 — (d) Amount of qualified equity investment
      "form-8874.0.line.1_row5_equity_investment_amount_col_d": 50000,
      // Line 1, row 5 — (f) Credit ((d) × (e))
      "form-8874.0.line.1_row5_credit_col_f": 3000,
      // Line 1, row 6 — (d) Amount of qualified equity investment
      "form-8874.0.line.1_row6_equity_investment_amount_col_d": 90000,
      // Line 1, row 6 — (f) Credit ((d) × (e))
      "form-8874.0.line.1_row6_credit_col_f": 5400,
      // Line 2 — New markets credit from partnerships and S corporations
      "form-8874.0.line.2_credit_from_pass_through_entities": 1180,
      // Line 3 — Add lines 1 and 2
      "form-8874.0.line.3_add_lines_1_and_2": 25530,
    },
  },
  "form-3800": {
    engineFields: {
      // Line 1 — Credits not subject to the passive activity limit from Part III, line 2: combine
      "form-3800.0.line.1_credits_not_passive_limited": 25530,
      // Line 6 — Add lines 1, 3, 4, and 5
      "form-3800.0.line.6_total_credits_not_allowed_tmt": 25530,
      // Line 7 — Regular tax before credits
      "form-3800.0.line.7_regular_tax_before_credits": 146035,
      // Line 9 — Add lines 7 and 8
      "form-3800.0.line.9_regular_tax_plus_amt": 146035,
      // Line 11 — Net income tax. Subtract line 10c from line 9
      "form-3800.0.line.11_net_income_tax": 146035,
      // Line 12 — Net regular tax. Subtract line 10c from line 7. If zero or less, enter -0-
      "form-3800.0.line.12_net_regular_tax": 146035,
      // Line 13 — Enter 25% (0.25) of the excess, if any, of line 12 (line 11 for corporations) ov
      "form-3800.0.line.13_25_percent_of_excess": 30259,
      // Line 14 — Tentative minimum tax
      "form-3800.0.line.14_tentative_minimum_tax": 116150,
      // Line 15 — Enter the greater of line 13 or line 14
      "form-3800.0.line.15_greater_of_line_13_or_14": 116150,
      // Line 16 — Subtract line 15 from line 11. If zero or less, enter -0-
      "form-3800.0.line.16_net_income_tax_less_line_15": 29885,
      // Line 17 — Enter the smaller of line 6 or line 16. This is the amount of your credit allowe
      "form-3800.0.line.17_credit_allowed_after_38c1_limit": 25530,
      // Line 27 — Subtract line 13 from line 11. If zero or less, enter -0-
      "form-3800.1.line.27_subtract_line_13_from_11": 115776,
      // Line 28 — Add lines 17 and 26
      "form-3800.1.line.28_add_lines_17_and_26": 25530,
      // Line 29 — Subtract line 28 from line 27. If zero or less, enter -0-
      "form-3800.1.line.29_subtract_line_28_from_27": 90246,
      // Line 38 — Credit allowed for the current year. Add lines 28 and 37
      "form-3800.1.line.38_credit_allowed_current_year": 25530,
      // Line 1i — Form 8874 — (a) No. of items
      "form-3800.2.part3.1i_form_8874_col_a": 7,
      // Line 1i — Form 8874 — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.1i_form_8874_col_e": 25530,
      // Line 1i — Form 8874 — (g) Combine columns (e) and (f) with the credit from column (d) allo
      "form-3800.2.part3.1i_form_8874_col_g": 25530,
      // Line 2 — Add lines 1a–1zz — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.2_add_lines_1a_1zz_col_e": 25530,
      // Line 2 — Add lines 1a–1zz — (g) Combine columns (e) and (f) with the credit from column (d
      "form-3800.2.part3.2_add_lines_1a_1zz_col_g": 25530,
      // Line 6 — Add lines 2, 3, and 5: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.6_add_lines_2_3_5_col_e": 25530,
      // Line 6 — Add lines 2, 3, and 5: (g) Combine columns (e) and (f) with the credit from colum
      "form-3800.3.part3.6_add_lines_2_3_5_col_g": 25530,
      // Part V, line 1, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.1_breakdown_col_e": 1180,
      // Part V, line 2, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.2_breakdown_col_e": 2000,
      // Part V, line 3, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.3_breakdown_col_e": 3750,
      // Part V, line 4, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.4_breakdown_col_e": 3000,
      // Part V, line 5, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.5_breakdown_col_e": 7200,
      // Part V, line 6, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.6_breakdown_col_e": 3000,
      // Part V, line 7, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.7_breakdown_col_e": 5400,
      // Line 1 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.1_breakdown_col_g": 1180,
      // Line 1 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.1_breakdown_col_h2": 1180,
      // Line 1 — (i)(1) Amount of column (h)(2) applied against tax in Part II
      "form-3800.7.part5.1_breakdown_col_i1": 1180,
      // Line 2 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.2_breakdown_col_g": 2000,
      // Line 2 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.2_breakdown_col_h2": 2000,
      // Line 2 — (i)(1) Amount of column (h)(2) applied against tax in Part II
      "form-3800.7.part5.2_breakdown_col_i1": 2000,
      // Line 3 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.3_breakdown_col_g": 3750,
      // Line 3 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.3_breakdown_col_h2": 3750,
      // Line 3 — (i)(1) Amount of column (h)(2) applied against tax in Part II
      "form-3800.7.part5.3_breakdown_col_i1": 3750,
      // Line 4 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.4_breakdown_col_g": 3000,
      // Line 4 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.4_breakdown_col_h2": 3000,
      // Line 4 — (i)(1) Amount of column (h)(2) applied against tax in Part II
      "form-3800.7.part5.4_breakdown_col_i1": 3000,
      // Line 5 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.5_breakdown_col_g": 7200,
      // Line 5 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.5_breakdown_col_h2": 7200,
      // Line 5 — (i)(1) Amount of column (h)(2) applied against tax in Part II
      "form-3800.7.part5.5_breakdown_col_i1": 7200,
      // Line 6 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.6_breakdown_col_g": 3000,
      // Line 6 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.6_breakdown_col_h2": 3000,
      // Line 6 — (i)(1) Amount of column (h)(2) applied against tax in Part II
      "form-3800.7.part5.6_breakdown_col_i1": 3000,
      // Line 7 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.7_breakdown_col_g": 5400,
      // Line 7 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.7_breakdown_col_h2": 5400,
      // Line 7 — (i)(1) Amount of column (h)(2) applied against tax in Part II
      "form-3800.7.part5.7_breakdown_col_i1": 5400,
    },
  },
  "form-6251": {
    engineFields: {
      // Line 1a — Subtract Schedule 1-A (Form 1040), line 37, from Form 1040, 1040-SR, or 1040-NR,
      "form-6251.0.line.1a_deductions_less_schedule_1a": 15750,
      // Line 1b — Subtract line 1a from Form 1040, 1040-SR, or 1040-NR, line 11b (if less than zer
      "form-6251.0.line.1b_taxable_income_start": 504250,
      // Line 2a — If filing Schedule A (Form 1040), enter the taxes from Schedule A, line 7; other
      "form-6251.0.line.2a_taxes_or_standard_deduction": 15750,
      // Line 4 — Alternative minimum taxable income. Combine lines 1b through 3
      "form-6251.0.line.4_alternative_minimum_taxable_income": 520000,
      // Line 5 — Exemption
      "form-6251.0.line.5_exemption": 88100,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-6251.0.line.6_amti_less_exemption": 431900,
      // Line 7 — Tax on line 6: complete Part III and enter line 40 if you have capital gain distr
      "form-6251.0.line.7_tax_on_line_6": 116150,
      // Line 9 — Tentative minimum tax. Subtract line 8 from line 7
      "form-6251.0.line.9_tentative_minimum_tax": 116150,
      // Line 10 — Add Form 1040 or 1040-SR, line 16 (minus any tax from Form 4972), and Schedule 2
      "form-6251.0.line.10_regular_tax_less_credits": 146035,
    },
  },
  "form-8959": {
    engineFields: {
      // Line 1 — Medicare wages and tips from Form W-2, box 5
      "form-8959.0.line.1_medicare_wages_tips": 520000,
      // Line 4 — Add lines 1 through 3
      "form-8959.0.line.4_total_medicare_wages": 520000,
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 200000,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-8959.0.line.6_excess_medicare_wages": 320000,
      // Line 7 — Additional Medicare Tax on Medicare wages. Multiply line 6 by 0.9% (0.009)
      "form-8959.0.line.7_additional_medicare_tax_wages": 2880,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 2880,
      // Line 19 — Medicare tax withheld from Form W-2, box 6
      "form-8959.0.line.19_medicare_tax_withheld": 10420,
      // Line 20 — Enter the amount from line 1
      "form-8959.0.line.20_medicare_wages_from_line1": 520000,
      // Line 21 — Multiply line 20 by 1.45% (0.0145). Regular Medicare tax withholding on Medicare
      "form-8959.0.line.21_regular_medicare_tax_on_wages": 7540,
      // Line 22 — Subtract line 21 from line 19. If zero or less, enter -0-. Additional Medicare T
      "form-8959.0.line.22_additional_medicare_tax_withholding_wages": 2880,
      // Line 24 — Total Additional Medicare Tax withholding. Add lines 22 and 23
      "form-8959.0.line.24_total_additional_medicare_tax_withholding": 2880,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 2880,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 2880,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 6a — General business credit. Attach Form 3800
      "schedule-3.0.line.6a": 25530,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 25530,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 25530,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 520000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 520000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 520000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 520000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 520000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 504250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 146035,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 146035,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 25530,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 25530,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 120505,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 2880,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 123385,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 140000,
      // Line 25c — Federal income tax withheld from other forms (see instructions)
      "form-1040.line.25c": 2880,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 142880,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 142880,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 19495,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 19495,
    },
  },
};

export function lamgwinExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
