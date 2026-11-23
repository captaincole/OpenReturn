/*
 * galad — LOCKED expected values, drafted from the engine's
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
      "form-1116.0.line.1a_gross_foreign_income_col_a": 42500,
      // Line 1a — Gross income from sources within country shown above and of the type checked abo
      "form-1116.0.line.1a_gross_foreign_income_total": 42500,
      // Line 3a — Certain itemized deductions or standard deduction, column A
      "form-1116.0.line.3a_itemized_or_standard_deduction_col_a": 9555,
      // Line 3b — Other deductions (attach statement), column A
      "form-1116.0.line.3b_other_deductions_col_a": 85,
      // Line 3c — Add lines 3a and 3b, column A
      "form-1116.0.line.3c_add_lines_3a_3b_col_a": 9640,
      // Line 3d — Gross foreign source income, column A
      "form-1116.0.line.3d_gross_foreign_source_income_col_a": 42500,
      // Line 3e — Gross income from all sources, column A
      "form-1116.0.line.3e_gross_income_all_sources_col_a": 224170,
      // Line 3g — Multiply line 3c by line 3f, column A
      "form-1116.0.line.3g_multiply_3c_by_3f_col_a": 1828,
      // Line 4a — Pro rata share of interest expense: Home mortgage interest, column A
      "form-1116.0.line.4a_home_mortgage_interest_col_a": 3125,
      // Line 6 — Add lines 2, 3g, 4a, 4b, and 5, column A
      "form-1116.0.line.6_total_deductions_and_losses_col_a": 4953,
      // Line 6 — Add lines 2, 3g, 4a, 4b, and 5, Total (add cols. A, B, and C)
      "form-1116.0.line.6_total_deductions_and_losses_total": 4953,
      // Line 7 — Subtract line 6 from line 1a
      "form-1116.0.line.7_net_foreign_source_income": 37547,
      // Country A — In foreign currency, (p) Other foreign taxes paid or accrued
      "form-1116.0.line.row_a_foreign_currency_other_taxes_col_p": 7712,
      // Country A — In U.S. dollars, (t) Other foreign taxes paid or accrued
      "form-1116.0.line.row_a_usd_other_taxes_col_t": 9860,
      // Country A — (u) Total foreign taxes paid or accrued (add cols. (q) through (t))
      "form-1116.0.line.row_a_total_foreign_taxes_col_u": 9860,
      // Line 8 — Add lines A through C, column (u)
      "form-1116.0.line.8_total_foreign_taxes_paid": 9860,
      // Line 9 — Enter the amount from line 8. These are your total foreign taxes paid or accrued
      "form-1116.1.line.9_foreign_taxes_from_line_8": 9860,
      // Line 11 — Add lines 9 and 10
      "form-1116.1.line.11_add_lines_9_10": 9860,
      // Line 14 — Combine lines 11, 12, and 13. This is the total amount of foreign taxes availabl
      "form-1116.1.line.14_foreign_taxes_available_for_credit": 9860,
      // Line 15 — Enter the amount from line 7. This is your taxable income or (loss) from sources
      "form-1116.1.line.15_foreign_taxable_income_from_line_7": 37547,
      // Line 17 — Combine the amounts on lines 15 and 16. This is your net foreign source taxable
      "form-1116.1.line.17_net_foreign_source_taxable_income": 37547,
      // Line 18 — Individuals: Enter the sum of (i) Form 1040, 1040-SR, or 1040-NR, line 11b, minu
      "form-1116.1.line.18_taxable_income_all_sources": 179720,
      // Line 20 — Individuals: Enter the total of Form 1040, 1040-SR, or 1040-NR, line 16, and Sch
      "form-1116.1.line.20_tax_before_credits": 37472,
      // Line 21 — Multiply line 20 by line 19 (maximum amount of credit)
      "form-1116.1.line.21_maximum_amount_of_credit": 7828,
      // Line 23 — Add lines 21 and 22
      "form-1116.1.line.23_add_lines_21_22": 7828,
      // Line 24 — Enter the smaller of line 14 or line 23
      "form-1116.1.line.24_smaller_of_line_14_or_23": 7828,
      // Line 27 — Credit for taxes on passive category income
      "form-1116.1.line.27_credit_passive_category_income": 3275,
      // Line 28 — Credit for taxes on general category income
      "form-1116.1.line.28_credit_general_category_income": 7828,
      // Line 32 — Add lines 25 through 31
      "form-1116.1.line.32_add_lines_25_through_31": 11103,
      // Line 33 — Enter the smaller of line 20 or line 32
      "form-1116.1.line.33_smaller_of_line_20_or_32": 11103,
      // Line 35 — Subtract line 34 from line 33. This is your foreign tax credit
      "form-1116.1.line.35_foreign_tax_credit": 11103,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 1 — Foreign tax credit. Attach Form 1116 if required
      "schedule-3.0.line.1": 11103,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 11103,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 185000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 185000,
      // Line 2b — Taxable interest
      "form-1040.line.2b": 6140,
      // Line 3a — Qualified dividends
      "form-1040.line.3a": 27065,
      // Line 3b — Ordinary dividends
      "form-1040.line.3b": 31790,
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": 1240,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 224170,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 85,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 224085,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 224085,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 27535,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 27535,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 196550,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 37472,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 37472,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 11103,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 11103,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 26369,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 915,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 27284,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 33600,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 33600,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 33600,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 6316,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 6316,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 18 — Penalty on early withdrawal of savings
      "schedule-1.1.line.18": 85,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 85,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 12 — Net investment income tax. Attach Form 8960
      "schedule-2.0.line.12_net_investment_income_tax": 915,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 915,
    },
  },
  "schedule-a": {
    engineFields: {
      // Line 2 — Enter amount from Form 1040 or 1040-SR, line 11b
      "schedule-a.0.line.2_agi_from_1040": 224085,
      // Line 3 — Multiply line 2 by 7.5% (0.075)
      "schedule-a.0.line.3_agi_multiplied": 16806,
      // Line 5a — State and local income taxes or general sales taxes
      "schedule-a.0.line.5a_state_local_income_or_sales_tax": 2315,
      // Line 5b — State and local real estate taxes (see instructions)
      "schedule-a.0.line.5b_real_estate_taxes": 7240,
      // Line 5d — Add lines 5a through 5c
      "schedule-a.0.line.5d_total_state_local_taxes": 9555,
      // Line 5e — Enter the smaller of line 5d or $40,000 ($20,000 if married filing separately)
      "schedule-a.0.line.5e_salt_cap": 9555,
      // Line 7 — Add lines 5e and 6
      "schedule-a.0.line.7_total_taxes": 9555,
      // Line 8a — Home mortgage interest and points reported to you on Form 1098
      "schedule-a.0.line.8a_mortgage_interest_form1098": 16480,
      // Line 8e — Add lines 8a through 8c
      "schedule-a.0.line.8e_total_mortgage_interest_points": 16480,
      // Line 10 — Add lines 8e and 9
      "schedule-a.0.line.10_total_interest": 16480,
      // Line 11 — Gifts by cash or check
      "schedule-a.0.line.11_gifts_cash_check": 1500,
      // Line 14 — Add lines 11 through 13
      "schedule-a.0.line.14_total_gifts": 1500,
      // Line 17 — Total Itemized Deductions. Add the amounts in the far right column for lines 4 t
      "schedule-a.0.line.17_total_itemized_deductions": 27535,
    },
  },
  "schedule-b": {
    engineFields: {
      // Line 1 — Amount (row 1)
      "schedule-b.0.line.1_amount_1": 4280,
      // Line 1 — Amount (row 2)
      "schedule-b.0.line.1_amount_2": 1860,
      // Line 2 — Add the amounts on line 1
      "schedule-b.0.line.2_total_interest": 6140,
      // Line 4 — Subtract line 3 from line 2. Enter the result here and on Form 1040 or 1040-SR, l
      "schedule-b.0.line.4_taxable_interest": 6140,
      // Line 5 — Amount (row 1)
      "schedule-b.0.line.5_amount_1": 28640,
      // Line 5 — Amount (row 2)
      "schedule-b.0.line.5_amount_2": 3150,
      // Line 6 — Add the amounts on line 5. Enter the total here and on Form 1040 or 1040-SR, line
      "schedule-b.0.line.6_total_ordinary_dividends": 31790,
    },
  },
  "form-8960": {
    engineFields: {
      // Line 1 — Taxable interest (see instructions)
      "form-8960.0.line.1": 6140,
      // Line 2 — Ordinary dividends (see instructions)
      "form-8960.0.line.2": 31790,
      // Line 5a — Net gain or loss from disposition of property (see instructions)
      "form-8960.0.line.5a": 1240,
      // Line 5d — Combine lines 5a through 5c
      "form-8960.0.line.5d": 1240,
      // Line 8 — Total investment income. Combine lines 1, 2, 3, 4c, 5d, 6, and 7
      "form-8960.0.line.8": 39170,
      // Line 12 — Net investment income. Subtract Part II, line 11, from Part I, line 8. If zero o
      "form-8960.0.line.12": 39170,
      // Line 13 — Modified adjusted gross income (see instructions)
      "form-8960.0.line.13": 224085,
      // Line 14 — Threshold based on filing status (see instructions)
      "form-8960.0.line.14": 200000,
      // Line 15 — Subtract line 14 from line 13. If zero or less, enter -0-
      "form-8960.0.line.15": 24085,
      // Line 16 — Enter the smaller of line 12 or line 15
      "form-8960.0.line.16": 24085,
      // Line 17 — Net investment income tax for individuals. Multiply line 16 by 3.8% (0.038)
      "form-8960.0.line.17": 915,
    },
  },
};

export function galadExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
