/*
 * leane — LOCKED expected values, drafted from the engine's
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
  "form-8621": {
    engineFields: {
      // Line 5(a) — Section 1291: amount of any excess distribution or gain treated as an excess d
      "form-8621.0.line.5a_section_1291_amount": 6948,
      // Line 15a — Enter your total distributions from the section 1291 fund during the current ta
      "form-8621.2.line.15a_total_distributions_current_year": 10000,
      // Line 15b — Enter the total distributions (reduced by the portions of such distributions th
      "form-8621.2.line.15b_total_distributions_preceding_3_years": 9600,
      // Line 15c — Divide line 15b by 3.0
      "form-8621.2.line.15c_average_preceding_distributions": 3200,
      // Line 15d — Multiply line 15c by 125% (1.25)
      "form-8621.2.line.15d_125_percent_of_average": 4000,
      // Line 15e(1) — Subtract line 15d from line 15a. This amount, if more than zero, is the exce
      "form-8621.2.line.15e1_excess_distribution": 6000,
      // Line 15e(2) — If the amount on line 15e(1) is in a foreign currency, convert to U.S. dolla
      "form-8621.2.line.15e2_excess_distribution_us_dollars": 6948,
      // Line 16b — Enter the total of the amounts determined in line 16a that are allocable to the
      "form-8621.2.line.16b_current_year_and_pre_pfic_amounts": 1015,
      // Line 16c — Enter the aggregate increases in tax (before credits) for each tax year in your
      "form-8621.2.line.16c_aggregate_increases_in_tax": 2195,
      // Line 16d — Foreign tax credit
      "form-8621.2.line.16d_foreign_tax_credit": 890,
      // Line 16e — Subtract line 16d from line 16c
      "form-8621.2.line.16e_additional_tax": 1305,
      // Line 16f — Determine interest on each net increase in tax determined on line 16e using the
      "form-8621.2.line.16f_interest_on_tax_increases": 252,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 8z — Other income amount
      "schedule-1.0.line.8z": 27506,
      // Line 9 — Total other income. Add lines 8a through 8z
      "schedule-1.0.line.9": 27506,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 27506,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 990,
      // Line 12 — Net investment income tax. Attach Form 8960
      "schedule-2.0.line.12_net_investment_income_tax": 1301,
      // Line 17p — Any interest from Form 8621, line 16f, relating to distributions from, and disp
      "schedule-2.1.line.17p_interest_form8621_line16f_section_1291_fund": 252,
      // Line 17q — Any interest from Form 8621, line 24
      "schedule-2.1.line.17q_interest_form8621_line24": 119,
      // Line 17z — Any other taxes amount
      "schedule-2.1.line.17z_other_taxes_amount": 756,
      // Line 18 — Total additional taxes. Add lines 17a through 17z
      "schedule-2.1.line.18_total_additional_taxes": 1127,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 3418,
    },
  },
  "schedule-b": {
    engineFields: {
      // Line 5 — Amount (row 1)
      "schedule-b.0.line.5_amount_1": 4632,
      // Line 6 — Add the amounts on line 5. Enter the total here and on Form 1040 or 1040-SR, line
      "schedule-b.0.line.6_total_ordinary_dividends": 4632,
    },
  },
  "schedule-d": {
    engineFields: {
      // Line 11 — Gain from Form 4797, Part I; long-term gain from Forms 2439 and 6252; and long-t
      "schedule-d.0.line.11_long_term_gain_other_forms": 2215,
      // Line 15 — Net long-term capital gain or (loss). Combine lines 8a through 14 in column (h)
      "schedule-d.0.line.15_net_long_term_gain_loss": 2215,
      // Line 16 — Combine lines 7 and 15 and enter the result
      "schedule-d.1.line.16_combined_gain_loss": 2215,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 1 — Foreign tax credit. Attach Form 1116 if required
      "schedule-3.0.line.1": 847,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 847,
    },
  },
  "form-1116": {
    engineFields: {
      // Line 1a — Gross income from sources within country shown above and of the type checked abo
      "form-1116.0.line.1a_gross_foreign_income_col_a": 5647,
      // Line 1a — Gross income from sources within country shown above and of the type checked abo
      "form-1116.0.line.1a_gross_foreign_income_total": 5647,
      // Line 3a — Certain itemized deductions or standard deduction, column A
      "form-1116.0.line.3a_itemized_or_standard_deduction_col_a": 15750,
      // Line 3c — Add lines 3a and 3b, column A
      "form-1116.0.line.3c_add_lines_3a_3b_col_a": 15750,
      // Line 3d — Gross foreign source income, column A
      "form-1116.0.line.3d_gross_foreign_source_income_col_a": 5647,
      // Line 3e — Gross income from all sources, column A
      "form-1116.0.line.3e_gross_income_all_sources_col_a": 344353,
      // Line 3g — Multiply line 3c by line 3f, column A
      "form-1116.0.line.3g_multiply_3c_by_3f_col_a": 258,
      // Line 6 — Add lines 2, 3g, 4a, 4b, and 5, column A
      "form-1116.0.line.6_total_deductions_and_losses_col_a": 258,
      // Line 6 — Add lines 2, 3g, 4a, 4b, and 5, Total (add cols. A, B, and C)
      "form-1116.0.line.6_total_deductions_and_losses_total": 258,
      // Line 7 — Subtract line 6 from line 1a
      "form-1116.0.line.7_net_foreign_source_income": 5389,
      // Country A — In foreign currency, taxes withheld at source on: (m) Dividends
      "form-1116.0.line.row_a_foreign_currency_withheld_dividends_col_m": 731,
      // Country A — In U.S. dollars, taxes withheld at source on: (q) Dividends
      "form-1116.0.line.row_a_usd_withheld_dividends_col_q": 847,
      // Country A — (u) Total foreign taxes paid or accrued (add cols. (q) through (t))
      "form-1116.0.line.row_a_total_foreign_taxes_col_u": 847,
      // Line 8 — Add lines A through C, column (u)
      "form-1116.0.line.8_total_foreign_taxes_paid": 847,
      // Line 9 — Enter the amount from line 8. These are your total foreign taxes paid or accrued
      "form-1116.1.line.9_foreign_taxes_from_line_8": 847,
      // Line 11 — Add lines 9 and 10
      "form-1116.1.line.11_add_lines_9_10": 847,
      // Line 14 — Combine lines 11, 12, and 13. This is the total amount of foreign taxes availabl
      "form-1116.1.line.14_foreign_taxes_available_for_credit": 847,
      // Line 15 — Enter the amount from line 7. This is your taxable income or (loss) from sources
      "form-1116.1.line.15_foreign_taxable_income_from_line_7": 5389,
      // Line 17 — Combine the amounts on lines 15 and 16. This is your net foreign source taxable
      "form-1116.1.line.17_net_foreign_source_taxable_income": 5389,
      // Line 18 — Individuals: Enter the sum of (i) Form 1040, 1040-SR, or 1040-NR, line 11b, minu
      "form-1116.1.line.18_taxable_income_all_sources": 327286,
      // Line 20 — Individuals: Enter the total of Form 1040, 1040-SR, or 1040-NR, line 16, and Sch
      "form-1116.1.line.20_tax_before_credits": 85420,
      // Line 21 — Multiply line 20 by line 19 (maximum amount of credit)
      "form-1116.1.line.21_maximum_amount_of_credit": 1409,
      // Line 23 — Add lines 21 and 22
      "form-1116.1.line.23_add_lines_21_22": 1409,
      // Line 24 — Enter the smaller of line 14 or line 23
      "form-1116.1.line.24_smaller_of_line_14_or_23": 847,
      // Line 27 — Credit for taxes on passive category income
      "form-1116.1.line.27_credit_passive_category_income": 847,
      // Line 32 — Add lines 25 through 31
      "form-1116.1.line.32_add_lines_25_through_31": 847,
      // Line 33 — Enter the smaller of line 20 or line 32
      "form-1116.1.line.33_smaller_of_line_20_or_32": 847,
      // Line 35 — Subtract line 34 from line 33. This is your foreign tax credit
      "form-1116.1.line.35_foreign_tax_credit": 847,
    },
  },
  "form-8959": {
    engineFields: {
      // Line 1 — Medicare wages and tips from Form W-2, box 5
      "form-8959.0.line.1_medicare_wages_tips": 310000,
      // Line 4 — Add lines 1 through 3
      "form-8959.0.line.4_total_medicare_wages": 310000,
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 200000,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-8959.0.line.6_excess_medicare_wages": 110000,
      // Line 7 — Additional Medicare Tax on Medicare wages. Multiply line 6 by 0.9% (0.009)
      "form-8959.0.line.7_additional_medicare_tax_wages": 990,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 990,
      // Line 19 — Medicare tax withheld from Form W-2, box 6
      "form-8959.0.line.19_medicare_tax_withheld": 5485,
      // Line 20 — Enter the amount from line 1
      "form-8959.0.line.20_medicare_wages_from_line1": 310000,
      // Line 21 — Multiply line 20 by 1.45% (0.0145). Regular Medicare tax withholding on Medicare
      "form-8959.0.line.21_regular_medicare_tax_on_wages": 4495,
      // Line 22 — Subtract line 21 from line 19. If zero or less, enter -0-. Additional Medicare T
      "form-8959.0.line.22_additional_medicare_tax_withholding_wages": 990,
      // Line 24 — Total Additional Medicare Tax withholding. Add lines 22 and 23
      "form-8959.0.line.24_total_additional_medicare_tax_withholding": 990,
    },
  },
  "form-8960": {
    engineFields: {
      // Line 2 — Ordinary dividends (see instructions)
      "form-8960.0.line.2": 4632,
      // Line 5a — Net gain or loss from disposition of property (see instructions)
      "form-8960.0.line.5a": 2215,
      // Line 5b — Net gain or loss from disposition of property that is not subject to net investm
      "form-8960.0.line.5b": -2215,
      // Line 6 — Adjustments to investment income for certain CFCs and PFICs (see instructions)
      "form-8960.0.line.6": 29598,
      // Line 8 — Total investment income. Combine lines 1, 2, 3, 4c, 5d, 6, and 7
      "form-8960.0.line.8": 34230,
      // Line 12 — Net investment income. Subtract Part II, line 11, from Part I, line 8. If zero o
      "form-8960.0.line.12": 34230,
      // Line 13 — Modified adjusted gross income (see instructions)
      "form-8960.0.line.13": 344353,
      // Line 14 — Threshold based on filing status (see instructions)
      "form-8960.0.line.14": 200000,
      // Line 15 — Subtract line 14 from line 13. If zero or less, enter -0-
      "form-8960.0.line.15": 144353,
      // Line 16 — Enter the smaller of line 12 or line 15
      "form-8960.0.line.16": 34230,
      // Line 17 — Net investment income tax for individuals. Multiply line 16 by 3.8% (0.038)
      "form-8960.0.line.17": 1301,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 310000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 310000,
      // Line 3b — Ordinary dividends
      "form-1040.line.3b": 4632,
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": 2215,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 27506,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 344353,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 344353,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 344353,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 328603,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 85420,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 85420,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 847,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 847,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 84573,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 3418,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 87991,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 64000,
      // Line 25c — Federal income tax withheld from other forms (see instructions)
      "form-1040.line.25c": 990,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 64990,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 64990,
      // Line 37 — Amount you owe
      "form-1040.line.37": 23001,
    },
  },
};

export function leaneExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
