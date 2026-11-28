/*
 * tad — LOCKED expected values, drafted from the engine's
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
  "form-7211": {
    engineFields: {
      // Line 1 — (a) Kilowatt-hours of qualified clean electricity
      "form-7211.0.part2.1_kwh_col_a": 1284500,
      // Line 1 — (b) Applicable amount
      "form-7211.0.part2.1_applicable_amount_col_b": 0.03,
      // Line 1 — (c) Column (a) x Column (b)
      "form-7211.0.part2.1_credit_amount_col_c": 38535,
      // Line 3 — Enter the total amount of lines 1(c) and 2(c)
      "form-7211.0.part2.3_total_lines_1c_2c": 38535,
      // Line 5a — Energy community bonus credit. If you qualify, multiply the amount on line 3 by
      "form-7211.0.part2.5a_energy_community_bonus": 3854,
      // Line 5b — Add lines 3 and 5a
      "form-7211.0.part2.5b_add_lines_3_5a": 42389,
      // Line 6b — Multiply line 5b by line 6a
      "form-7211.1.part2.6b_bond_reduction_amount": 5299,
      // Line 6c — Multiply line 5b by 15% (0.15)
      "form-7211.1.part2.6c_bond_reduction_cap": 6358,
      // Line 6d — Enter the smaller of line 6b or line 6c
      "form-7211.1.part2.6d_smaller_bond_reduction": 5299,
      // Line 7 — Subtract line 6d from line 5b
      "form-7211.1.part2.7_credit_after_bond_reduction": 37090,
      // Line 8a — Domestic content bonus credit. If you qualify for the domestic content bonus cre
      "form-7211.1.part2.8a_domestic_content_bonus": 3372,
      // Line 8b — Add lines 7 and 8a
      "form-7211.1.part2.8b_add_lines_7_8a": 40462,
      // Line 9 — Phase-out for elective payment. If you are making an elective payment election un
      "form-7211.1.part2.9_elective_payment_phaseout": 40462,
      // Line 11 — Add lines 9 and 10
      "form-7211.1.part2.11_add_lines_9_10": 40462,
    },
  },
  "form-3800": {
    engineFields: {
      // Line 1 — Credits not subject to the passive activity limit from Part III, line 2: combine
      "form-3800.0.line.1_credits_not_passive_limited": 40462,
      // Line 6 — Add lines 1, 3, 4, and 5
      "form-3800.0.line.6_total_credits_not_allowed_tmt": 40462,
      // Line 7 — Regular tax before credits
      "form-3800.0.line.7_regular_tax_before_credits": 41784,
      // Line 9 — Add lines 7 and 8
      "form-3800.0.line.9_regular_tax_plus_amt": 41784,
      // Line 11 — Net income tax. Subtract line 10c from line 9
      "form-3800.0.line.11_net_income_tax": 41784,
      // Line 12 — Net regular tax. Subtract line 10c from line 7. If zero or less, enter -0-
      "form-3800.0.line.12_net_regular_tax": 41784,
      // Line 13 — Enter 25% (0.25) of the excess, if any, of line 12 (line 11 for corporations) ov
      "form-3800.0.line.13_25_percent_of_excess": 4196,
      // Line 14 — Tentative minimum tax
      "form-3800.0.line.14_tentative_minimum_tax": 33775,
      // Line 15 — Enter the greater of line 13 or line 14
      "form-3800.0.line.15_greater_of_line_13_or_14": 33775,
      // Line 16 — Subtract line 15 from line 11. If zero or less, enter -0-
      "form-3800.0.line.16_net_income_tax_less_line_15": 8009,
      // Line 17 — Enter the smaller of line 6 or line 16. This is the amount of your credit allowe
      "form-3800.0.line.17_credit_allowed_after_38c1_limit": 8009,
      // Line 27 — Subtract line 13 from line 11. If zero or less, enter -0-
      "form-3800.1.line.27_subtract_line_13_from_11": 37588,
      // Line 28 — Add lines 17 and 26
      "form-3800.1.line.28_add_lines_17_and_26": 8009,
      // Line 29 — Subtract line 28 from line 27. If zero or less, enter -0-
      "form-3800.1.line.29_subtract_line_28_from_27": 29579,
      // Line 38 — Credit allowed for the current year. Add lines 28 and 37
      "form-3800.1.line.38_credit_allowed_current_year": 8009,
      // Line 1gg — Form 7211, Part II — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.1gg_form_7211_part_ii_col_e": 40462,
      // Line 1gg — Form 7211, Part II — (g) Combine columns (e) and (f) with the credit from colum
      "form-3800.2.part3.1gg_form_7211_part_ii_col_g": 40462,
      // Line 2 — Add lines 1a–1zz — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.2_add_lines_1a_1zz_col_e": 40462,
      // Line 2 — Add lines 1a–1zz — (g) Combine columns (e) and (f) with the credit from column (d
      "form-3800.2.part3.2_add_lines_1a_1zz_col_g": 40462,
      // Line 6 — Add lines 2, 3, and 5: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.6_add_lines_2_3_5_col_e": 40462,
      // Line 6 — Add lines 2, 3, and 5: (g) Combine columns (e) and (f) with the credit from colum
      "form-3800.3.part3.6_add_lines_2_3_5_col_g": 40462,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 6a — General business credit. Attach Form 3800
      "schedule-3.0.line.6a": 8009,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 8009,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 8009,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 210000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 210000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 10139,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 220139,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 136,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 220003,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 220003,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 2001,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 17751,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 202252,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 41784,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 41784,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 8009,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 8009,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 33775,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 446,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 34221,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 39500,
      // Line 25c — Federal income tax withheld from other forms (see instructions)
      "form-1040.line.25c": 90,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 39590,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 39590,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 5369,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 5369,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 10139,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 10139,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 136,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 136,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 272,
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 174,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 446,
    },
  },
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 79639,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 79639,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 79639,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 79639,
      // Line 21 — Repairs and maintenance
      "schedule-c.0.line.21": 2100,
      // Line 23 — Taxes and licenses
      "schedule-c.0.line.23": 4800,
      // Line 13 — Depreciation and section 179 expense deduction (not included in Part III)
      "schedule-c.0.line.13": 52000,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 3400,
      // Line 16b — Interest: Other
      "schedule-c.0.line.16b": 7200,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 69500,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 10139,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 10139,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 10139,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 10139,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 9363,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 9363,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 9363,
      // Line 8a — Total social security wages and tips (total of boxes 3 and 7 on Form(s) W-2) and
      "schedule-se.0.line.8a": 176100,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 272,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 272,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 136,
    },
  },
  "form-6251": {
    engineFields: {
      // Line 1a — Subtract Schedule 1-A (Form 1040), line 37, from Form 1040, 1040-SR, or 1040-NR,
      "form-6251.0.line.1a_deductions_less_schedule_1a": 17751,
      // Line 1b — Subtract line 1a from Form 1040, 1040-SR, or 1040-NR, line 11b (if less than zer
      "form-6251.0.line.1b_taxable_income_start": 202252,
      // Line 2a — If filing Schedule A (Form 1040), enter the taxes from Schedule A, line 7; other
      "form-6251.0.line.2a_taxes_or_standard_deduction": 15750,
      // Line 4 — Alternative minimum taxable income. Combine lines 1b through 3
      "form-6251.0.line.4_alternative_minimum_taxable_income": 218002,
      // Line 5 — Exemption
      "form-6251.0.line.5_exemption": 88100,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-6251.0.line.6_amti_less_exemption": 129902,
      // Line 7 — Tax on line 6: complete Part III and enter line 40 if you have capital gain distr
      "form-6251.0.line.7_tax_on_line_6": 33775,
      // Line 9 — Tentative minimum tax. Subtract line 8 from line 7
      "form-6251.0.line.9_tentative_minimum_tax": 33775,
      // Line 10 — Add Form 1040 or 1040-SR, line 16 (minus any tax from Form 4972), and Schedule 2
      "form-6251.0.line.10_regular_tax_less_credits": 41784,
    },
  },
  "form-8959": {
    engineFields: {
      // Line 1 — Medicare wages and tips from Form W-2, box 5
      "form-8959.0.line.1_medicare_wages_tips": 210000,
      // Line 4 — Add lines 1 through 3
      "form-8959.0.line.4_total_medicare_wages": 210000,
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 200000,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-8959.0.line.6_excess_medicare_wages": 10000,
      // Line 7 — Additional Medicare Tax on Medicare wages. Multiply line 6 by 0.9% (0.009)
      "form-8959.0.line.7_additional_medicare_tax_wages": 90,
      // Line 8 — Self-employment income from Schedule SE (Form 1040), Part I, line 6
      "form-8959.0.line.8_self_employment_income": 9363,
      // Line 9 — Enter the following amount for your filing status
      "form-8959.0.line.9_filing_status_threshold_se": 200000,
      // Line 10 — Enter the amount from line 4
      "form-8959.0.line.10_medicare_wages_from_line4": 210000,
      // Line 12 — Subtract line 11 from line 8. If zero or less, enter -0-
      "form-8959.0.line.12_excess_se_income": 9363,
      // Line 13 — Additional Medicare Tax on self-employment income. Multiply line 12 by 0.9% (0.0
      "form-8959.0.line.13_additional_medicare_tax_se": 84,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 174,
      // Line 19 — Medicare tax withheld from Form W-2, box 6
      "form-8959.0.line.19_medicare_tax_withheld": 3135,
      // Line 20 — Enter the amount from line 1
      "form-8959.0.line.20_medicare_wages_from_line1": 210000,
      // Line 21 — Multiply line 20 by 1.45% (0.0145). Regular Medicare tax withholding on Medicare
      "form-8959.0.line.21_regular_medicare_tax_on_wages": 3045,
      // Line 22 — Subtract line 21 from line 19. If zero or less, enter -0-. Additional Medicare T
      "form-8959.0.line.22_additional_medicare_tax_withholding_wages": 90,
      // Line 24 — Total Additional Medicare Tax withholding. Add lines 22 and 23
      "form-8959.0.line.24_total_additional_medicare_tax_withholding": 90,
    },
  },
  "form-8995-a": {
    engineFields: {
      // Line 2 — Qualified business income from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.2_a": 10003,
      // Line 3 — Multiply line 2 by 20% (0.20) (Column A)
      "form-8995-a.0.line.3_a": 2001,
      // Line 7 — Allocable share of the unadjusted basis immediately after acquisition (UBIA) of a
      "form-8995-a.0.line.7_a": 1440000,
      // Line 8 — Multiply line 7 by 2.5% (0.025) (Column A)
      "form-8995-a.0.line.8_a": 36000,
      // Line 9 — Add lines 6 and 8 (Column A)
      "form-8995-a.0.line.9_a": 36000,
      // Line 10 — Enter the greater of line 5 or line 9 (Column A)
      "form-8995-a.0.line.10_a": 36000,
      // Line 11 — W-2 wage and UBIA of qualified property limitation. Enter the smaller of line 3
      "form-8995-a.0.line.11_a": 2001,
      // Line 13 — Qualified business income deduction before patron reduction. Enter the greater o
      "form-8995-a.0.line.13_a": 2001,
      // Line 15 — Qualified business income component. Subtract line 14 from line 13 (Column A)
      "form-8995-a.0.line.15_a": 2001,
      // Line 16 — Total qualified business income component. Add all amounts reported on line 15
      "form-8995-a.0.line.16": 2001,
      // Line 27 — Total qualified business income component from all qualified trades, businesses,
      "form-8995-a.1.line.27": 2001,
      // Line 32 — Qualified business income deduction before the income limitation. Add lines 27 a
      "form-8995-a.1.line.32": 2001,
      // Line 33 — Taxable income before qualified business income deduction
      "form-8995-a.1.line.33": 204253,
      // Line 35 — Subtract line 34 from line 33. If zero or less, enter -0-
      "form-8995-a.1.line.35": 204253,
      // Line 36 — Income limitation. Multiply line 35 by 20% (0.20)
      "form-8995-a.1.line.36": 40851,
      // Line 37 — Qualified business income deduction before the domestic production activities de
      "form-8995-a.1.line.37": 2001,
      // Line 39 — Total qualified business income deduction. Add lines 37 and 38
      "form-8995-a.1.line.39": 2001,
    },
  },
};

export function tadExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
