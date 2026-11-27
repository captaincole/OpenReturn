/*
 * aram — LOCKED expected values, drafted from the engine's
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
  "form-3468": {
    engineFields: {
      // Line 3a — Enter the basis of property using solar illumination (including electrochromic g
      "form-3468.4.part6.3a_basis_solar_property": 120000,
      // Line 3c — Multiply line 3a by line 3b
      "form-3468.4.part6.3c_multiply_3a_by_3b": 36000,
      // Line 3i — Multiply line 3a by line 3h
      "form-3468.4.part6.3i_multiply_3a_by_3h": 9000,
      // Line 3j — If Part I, line 12a(i), is more than the entry on line 3e, enter the amount from
      "form-3468.4.part6.3j_low_income_bonus_amount": 9000,
      // Line 3l — Multiply line 3a by line 3k
      "form-3468.4.part6.3l_multiply_3a_by_3k": 12000,
      // Line 3n — Multiply line 3a by line 3m
      "form-3468.4.part6.3n_multiply_3a_by_3m": 12000,
      // Line 4 — Add lines 3c, 3j, 3l, and 3n
      "form-3468.4.part6.4_add_lines": 69000,
      // Line 27 — Add Part VI, lines 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, and 26
      "form-3468.10.part6.27_total_energy_credit": 69000,
      // Line 28b — Multiply line 27 by line 28a
      "form-3468.10.part6.28b_multiply_27_by_28a": 8625,
      // Line 28c — Multiply line 27 by 15% (0.15)
      "form-3468.10.part6.28c_multiply_27_by_15_percent": 10350,
      // Line 28d — Enter the smaller of line 28b or 28c
      "form-3468.10.part6.28d_smaller_of_28b_or_28c": 8625,
      // Line 28e — Subtract line 28d from line 27
      "form-3468.10.part6.28e_subtract_28d_from_27": 60375,
      // Line 29 — If proceeds of tax-exempt bonds were used to finance your facility, enter the am
      "form-3468.10.part6.29_credit_after_bond_reduction": 60375,
      // Line 30 — If you are making an elective payment election under section 6417 for a facility
      "form-3468.10.part6.30_elective_payment_reduction": 60375,
      // Line 32 — Add lines 30 and 31
      "form-3468.10.part6.32_total_energy_credit": 60375,
    },
  },
  "form-3800": {
    engineFields: {
      // Line 7 — Regular tax before credits
      "form-3800.0.line.7_regular_tax_before_credits": 51564,
      // Line 9 — Add lines 7 and 8
      "form-3800.0.line.9_regular_tax_plus_amt": 51564,
      // Line 11 — Net income tax. Subtract line 10c from line 9
      "form-3800.0.line.11_net_income_tax": 51564,
      // Line 12 — Net regular tax. Subtract line 10c from line 7. If zero or less, enter -0-
      "form-3800.0.line.12_net_regular_tax": 51564,
      // Line 13 — Enter 25% (0.25) of the excess, if any, of line 12 (line 11 for corporations) ov
      "form-3800.0.line.13_25_percent_of_excess": 6641,
      // Line 27 — Subtract line 13 from line 11. If zero or less, enter -0-
      "form-3800.1.line.27_subtract_line_13_from_11": 44923,
      // Line 29 — Subtract line 28 from line 27. If zero or less, enter -0-
      "form-3800.1.line.29_subtract_line_28_from_27": 44923,
      // Line 30 — Enter the general business credit from line 5 of Part III: combine column (e) wi
      "form-3800.1.line.30_specified_general_business_credit": 70375,
      // Line 36 — Add lines 30, 33, 34, and 35
      "form-3800.1.line.36_add_lines_30_33_34_35": 70375,
      // Line 37 — Enter the smaller of line 29 or line 36. This is the amount allowed for specifie
      "form-3800.1.line.37_specified_credits_allowed": 44923,
      // Line 38 — Credit allowed for the current year. Add lines 28 and 37
      "form-3800.1.line.38_credit_allowed_current_year": 44923,
      // Line 4a — Form 3468, Part VI: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.4a_form_3468_part_vi_col_e": 60375,
      // Line 4a — Form 3468, Part VI: (g) Combine columns (e) and (f) with the credit from column
      "form-3800.3.part3.4a_form_3468_part_vi_col_g": 60375,
      // Line 4k — Form 3468, Part VII: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.4k_form_3468_part_vii_col_e": 10000,
      // Line 4k — Form 3468, Part VII: (g) Combine columns (e) and (f) with the credit from column
      "form-3800.3.part3.4k_form_3468_part_vii_col_g": 10000,
      // Line 5 — Add lines 4a–4z: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.5_add_lines_4a_4z_col_e": 70375,
      // Line 5 — Add lines 4a–4z: (g) Combine columns (e) and (f) with the credit from column (d)
      "form-3800.3.part3.5_add_lines_4a_4z_col_g": 70375,
      // Line 6 — Add lines 2, 3, and 5: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.6_add_lines_2_3_5_col_e": 70375,
      // Line 6 — Add lines 2, 3, and 5: (g) Combine columns (e) and (f) with the credit from colum
      "form-3800.3.part3.6_add_lines_2_3_5_col_g": 70375,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 6a — General business credit. Attach Form 3800
      "schedule-3.0.line.6a": 44923,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 44923,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 44923,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 322000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 322000,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 15230,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 306770,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 306770,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 58204,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 73954,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 232816,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 51564,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 51564,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 44923,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 44923,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 6641,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 31336,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 37977,
      // Line 37 — Amount you owe
      "form-1040.line.37": 37977,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 322000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 322000,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 15230,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 15230,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 30460,
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 876,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 31336,
    },
  },
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 610000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 610000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 610000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 610000,
      // Line 21 — Repairs and maintenance
      "schedule-c.0.line.21": 5600,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 96000,
      // Line 23 — Taxes and licenses
      "schedule-c.0.line.23": 11800,
      // Line 13 — Depreciation and section 179 expense deduction (not included in Part III)
      "schedule-c.0.line.13": 41000,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 7200,
      // Line 25 — Utilities
      "schedule-c.0.line.25": 8400,
      // Line 26 — Wages (less employment credits)
      "schedule-c.0.line.26": 118000,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 288000,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 322000,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 322000,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 322000,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 322000,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 297367,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 297367,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 297367,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 21836,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 8624,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 30460,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 15230,
    },
  },
  "form-8959": {
    engineFields: {
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 200000,
      // Line 8 — Self-employment income from Schedule SE (Form 1040), Part I, line 6
      "form-8959.0.line.8_self_employment_income": 297367,
      // Line 9 — Enter the following amount for your filing status
      "form-8959.0.line.9_filing_status_threshold_se": 200000,
      // Line 11 — Subtract line 10 from line 9. If zero or less, enter -0-
      "form-8959.0.line.11_threshold_reduced_by_wages": 200000,
      // Line 12 — Subtract line 11 from line 8. If zero or less, enter -0-
      "form-8959.0.line.12_excess_se_income": 97367,
      // Line 13 — Additional Medicare Tax on self-employment income. Multiply line 12 by 0.9% (0.0
      "form-8959.0.line.13_additional_medicare_tax_se": 876,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 876,
    },
  },
  "form-8995-a": {
    engineFields: {
      // Line 2 — Qualified business income from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.2_a": 306770,
      // Line 3 — Multiply line 2 by 20% (0.20) (Column A)
      "form-8995-a.0.line.3_a": 61354,
      // Line 4 — Allocable share of W-2 wages from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.4_a": 118000,
      // Line 5 — Multiply line 4 by 50% (0.50) (Column A)
      "form-8995-a.0.line.5_a": 59000,
      // Line 6 — Multiply line 4 by 25% (0.25) (Column A)
      "form-8995-a.0.line.6_a": 29500,
      // Line 7 — Allocable share of the unadjusted basis immediately after acquisition (UBIA) of a
      "form-8995-a.0.line.7_a": 940000,
      // Line 8 — Multiply line 7 by 2.5% (0.025) (Column A)
      "form-8995-a.0.line.8_a": 23500,
      // Line 9 — Add lines 6 and 8 (Column A)
      "form-8995-a.0.line.9_a": 53000,
      // Line 10 — Enter the greater of line 5 or line 9 (Column A)
      "form-8995-a.0.line.10_a": 59000,
      // Line 11 — W-2 wage and UBIA of qualified property limitation. Enter the smaller of line 3
      "form-8995-a.0.line.11_a": 59000,
      // Line 13 — Qualified business income deduction before patron reduction. Enter the greater o
      "form-8995-a.0.line.13_a": 59000,
      // Line 15 — Qualified business income component. Subtract line 14 from line 13 (Column A)
      "form-8995-a.0.line.15_a": 59000,
      // Line 16 — Total qualified business income component. Add all amounts reported on line 15
      "form-8995-a.0.line.16": 59000,
      // Line 27 — Total qualified business income component from all qualified trades, businesses,
      "form-8995-a.1.line.27": 59000,
      // Line 32 — Qualified business income deduction before the income limitation. Add lines 27 a
      "form-8995-a.1.line.32": 59000,
      // Line 33 — Taxable income before qualified business income deduction
      "form-8995-a.1.line.33": 291020,
      // Line 35 — Subtract line 34 from line 33. If zero or less, enter -0-
      "form-8995-a.1.line.35": 291020,
      // Line 36 — Income limitation. Multiply line 35 by 20% (0.20)
      "form-8995-a.1.line.36": 58204,
      // Line 37 — Qualified business income deduction before the domestic production activities de
      "form-8995-a.1.line.37": 58204,
      // Line 39 — Total qualified business income deduction. Add lines 37 and 38
      "form-8995-a.1.line.39": 58204,
    },
  },
};

export function aramExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
