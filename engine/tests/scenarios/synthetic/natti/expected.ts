/*
 * natti — LOCKED expected values, drafted from the engine's
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
  "form-8846": {
    engineFields: {
      // Line 1 — Tips received by employees for services on which you paid or incurred employer so
      "form-8846.0.line.1_tips_received_by_employees": 184600,
      // Line 2 — Tips not subject to the credit provisions
      "form-8846.0.line.2_tips_not_subject_to_credit": 1363,
      // Line 3 — Creditable tips. Subtract line 2 from line 1
      "form-8846.0.line.3_subtract_2_from_1": 183237,
      // Line 4 — Multiply line 3 by 7.65% (0.0765)
      "form-8846.0.line.4_multiply_3_by_7_65_percent": 12686,
      // Line 5 — Credit for employer social security and Medicare taxes paid on certain employee t
      "form-8846.0.line.5_credit_from_partnerships_s_corps": 2350,
      // Line 6 — Add lines 4 and 5
      "form-8846.0.line.6_add_lines": 15036,
    },
    // MANUAL EDIT: the line 4 box, a stylist passed the $176,100 wage base.
    renderedChecked: ["form-8846.0.line.4_wages_exceeded_limit_check"],
  },
  "form-3800": {
    engineFields: {
      // Line 7 — Regular tax before credits
      "form-3800.0.line.7_regular_tax_before_credits": 17102,
      // Line 9 — Add lines 7 and 8
      "form-3800.0.line.9_regular_tax_plus_amt": 17102,
      // Line 11 — Net income tax. Subtract line 10c from line 9
      "form-3800.0.line.11_net_income_tax": 17102,
      // Line 12 — Net regular tax. Subtract line 10c from line 7. If zero or less, enter -0-
      "form-3800.0.line.12_net_regular_tax": 17102,
      // Line 27 — Subtract line 13 from line 11. If zero or less, enter -0-
      "form-3800.1.line.27_subtract_line_13_from_11": 17102,
      // Line 29 — Subtract line 28 from line 27. If zero or less, enter -0-
      "form-3800.1.line.29_subtract_line_28_from_27": 17102,
      // Line 30 — Enter the general business credit from line 5 of Part III: combine column (e) wi
      "form-3800.1.line.30_specified_general_business_credit": 15036,
      // Line 36 — Add lines 30, 33, 34, and 35
      "form-3800.1.line.36_add_lines_30_33_34_35": 15036,
      // Line 37 — Enter the smaller of line 29 or line 36. This is the amount allowed for specifie
      "form-3800.1.line.37_specified_credits_allowed": 15036,
      // Line 38 — Credit allowed for the current year. Add lines 28 and 37
      "form-3800.1.line.38_credit_allowed_current_year": 15036,
      // Line 4f — Form 8846: (a) No. of items
      "form-3800.3.part3.4f_form_8846_col_a": 2,
      // Line 4f — Form 8846: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.4f_form_8846_col_e": 15036,
      // Line 4f — Form 8846: (g) Combine columns (e) and (f) with the credit from column (d) allow
      "form-3800.3.part3.4f_form_8846_col_g": 15036,
      // Line 5 — Add lines 4a–4z: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.5_add_lines_4a_4z_col_e": 15036,
      // Line 5 — Add lines 4a–4z: (g) Combine columns (e) and (f) with the credit from column (d)
      "form-3800.3.part3.5_add_lines_4a_4z_col_g": 15036,
      // Line 6 — Add lines 2, 3, and 5: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.6_add_lines_2_3_5_col_e": 15036,
      // Line 6 — Add lines 2, 3, and 5: (g) Combine columns (e) and (f) with the credit from colum
      "form-3800.3.part3.6_add_lines_2_3_5_col_g": 15036,
      // Part V, line 1, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.1_breakdown_col_e": 12686,
      // Part V, line 2, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.2_breakdown_col_e": 2350,
      // Line 1 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.1_breakdown_col_g": 12686,
      // Line 1 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.1_breakdown_col_h2": 12686,
      // Line 1 — (i)(1) Amount of column (h)(2) applied against tax in Part II
      "form-3800.7.part5.1_breakdown_col_i1": 12686,
      // Line 2 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.2_breakdown_col_g": 2350,
      // Line 2 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.2_breakdown_col_h2": 2350,
      // Line 2 — (i)(1) Amount of column (h)(2) applied against tax in Part II
      "form-3800.7.part5.2_breakdown_col_i1": 2350,
    },
  },
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 985000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 985000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 985000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 985000,
      // Line 8 — Advertising
      "schedule-c.0.line.8": 8500,
      // Line 18 — Office expense
      "schedule-c.0.line.18": 3800,
      // Line 20b — Rent or lease: Other business property
      "schedule-c.0.line.20b": 120000,
      // Line 21 — Repairs and maintenance
      "schedule-c.0.line.21": 7400,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 168000,
      // Line 23 — Taxes and licenses
      "schedule-c.0.line.23": 43514,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 14500,
      // Line 25 — Utilities
      "schedule-c.0.line.25": 21400,
      // Line 26 — Wages (less employment credits)
      "schedule-c.0.line.26": 452000,
      // Line 17 — Legal and professional services
      "schedule-c.0.line.17": 6200,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 845314,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 139686,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 139686,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 139686,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 139686,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 129000,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 129000,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 129000,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 15996,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 3741,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 19737,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 9869,
    },
  },
  "schedule-e": {
    engineFields: {
      // Line 28 row A — (k) Nonpassive income from Schedule K-1
      "schedule-e.1.line.28_row_a_col_k_nonpassive_income": 12000,
      // Line 29a — Totals, column (k) nonpassive income
      "schedule-e.1.line.29a_totals_col_k": 12000,
      // Line 30 — Add columns (h) and (k) of line 29a
      "schedule-e.1.line.30_add_income_columns": 12000,
      // Line 32 — Total partnership and S corporation income or (loss). Combine lines 30 and 31
      "schedule-e.1.line.32_total_partnership_s_corp_income": 12000,
      // Line 41 — Total income or (loss). Combine lines 26, 32, 37, 39, and 40
      "schedule-e.1.line.41_total_income_or_loss": 12000,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": 129817,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": 129817,
      // Line 4 — Total qualified business income. Combine lines 2 and 3. If zero or less, enter -0
      "form-8995.0.line.4": 129817,
      // Line 5 — Qualified business income component. Multiply line 4 by 20% (0.20)
      "form-8995.0.line.5": 25963,
      // Line 10 — Qualified business income deduction before the income limitation. Add lines 5 an
      "form-8995.0.line.10": 25963,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 126067,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 126067,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 25213,
      // Line 15 — Qualified business income deduction. Enter the smaller of line 10 or line 14
      "form-8995.0.line.15": 25213,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 139686,
      // Line 5 — Rental real estate, royalties, partnerships, S corporations, trusts, etc. Attach
      "schedule-1.0.line.5": 12000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 151686,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 9869,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 9869,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 19737,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 19737,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 6a — General business credit. Attach Form 3800
      "schedule-3.0.line.6a": 15036,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 15036,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 15036,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 151686,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 151686,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 9869,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 141817,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 141817,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 25213,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 40963,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 100854,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 17102,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 17102,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 15036,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 15036,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 2066,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 19737,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 21803,
      // Line 26 — 2025 estimated tax payments and amount applied from 2024 return
      "form-1040.line.26": 24000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 24000,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 2197,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 2197,
    },
  },
};

export function nattiExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
