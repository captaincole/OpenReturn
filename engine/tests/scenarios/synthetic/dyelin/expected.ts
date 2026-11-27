/*
 * dyelin — LOCKED expected values, drafted from the engine's
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
  "form-2210-f": {
    engineFields: {
      // Line 1 — Enter your 2025 tax after credits from Form 1040, 1040-SR, or 1040-NR, line 22; o
      "form-2210-f.0.line.1_tax_after_credits": 12961,
      // Line 2 — Other taxes, including self-employment tax and, if applicable, Additional Medicar
      "form-2210-f.0.line.2_other_taxes": 18369,
      // Line 3 — Add lines 1 and 2
      "form-2210-f.0.line.3_add_lines_1_2": 31330,
      // Line 6 — Current year tax. Subtract line 4 from line 3
      "form-2210-f.0.line.6_current_year_tax": 31330,
      // Line 7 — Multiply line 6 by 66 2/3% (0.667)
      "form-2210-f.0.line.7_two_thirds_current_tax": 20897,
      // Line 8 — Withholding taxes. Don't include any estimated tax payments on this line
      "form-2210-f.0.line.8_withholding_taxes": 3000,
      // Line 9 — Subtract line 8 from line 6
      "form-2210-f.0.line.9_tax_less_withholding": 28330,
      // Line 10 — Enter the tax shown on your 2024 tax return
      "form-2210-f.0.line.10_prior_year_tax": 18500,
      // Line 11 — Required annual payment. Enter the smaller of line 7 or line 10
      "form-2210-f.0.line.11_required_annual_payment": 18500,
      // Line 12 — Enter the estimated tax payments you made by January 15, 2026, and any federal i
      "form-2210-f.0.line.12_estimated_payments_withholding": 13000,
      // Line 13 — Underpayment. Subtract line 12 from line 11
      "form-2210-f.0.line.13_underpayment": 5500,
      // Line 15 — Number of days from January 15, 2026, to the date on line 14
      "form-2210-f.0.line.15_days_from_jan_15": 36,
      // Line 16 — Penalty. Underpayment on line 13 × (Number of days on line 15 ÷ 365) × 0.07
      "form-2210-f.0.line.16_penalty": 38,
    },
    renderedText: {
      "form-2210-f.0.header.taxpayer_name": "Dyelin Tarvanek & Elyas Tarvanek",
      // Line 14 — the February 20, 2026 payment covers line 13
      "form-2210-f.0.line.14_payment_date_month": "02",
      "form-2210-f.0.line.14_payment_date_day": "20",
    },
    // Box B — joint for 2025, separate for 2024, and line 10 is smaller than line 7
    renderedChecked: ["form-2210-f.0.line.box_b_joint_return_one_year"],
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 40000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 40000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 130000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 170000,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 9185,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 160815,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 160815,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 31500,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 24163,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 55663,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 105152,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 12961,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 12961,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 12961,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 18369,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 31330,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 3000,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 3000,
      // Line 26 — 2025 estimated tax payments and amount applied from 2024 return
      "form-1040.line.26": 35000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 38000,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 6670,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 6632,
      // Line 38 — Estimated tax penalty (see instructions)
      "form-1040.line.38": 38,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 130000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 130000,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 9185,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 9185,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 18369,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 18369,
    },
  },
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 300000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 300000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 300000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 300000,
      // Line 21 — Repairs and maintenance
      "schedule-c.0.line.21": 38000,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 108000,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 24000,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 170000,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 130000,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 130000,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 130000,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 130000,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 120055,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 120055,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 120055,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 14887,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 3482,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 18369,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 9185,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": 120815,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": 120815,
      // Line 4 — Total qualified business income. Combine lines 2 and 3. If zero or less, enter -0
      "form-8995.0.line.4": 120815,
      // Line 5 — Qualified business income component. Multiply line 4 by 20% (0.20)
      "form-8995.0.line.5": 24163,
      // Line 10 — Qualified business income deduction before the income limitation. Add lines 5 an
      "form-8995.0.line.10": 24163,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 129315,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 129315,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 25863,
      // Line 15 — Qualified business income deduction. Enter the smaller of line 10 or line 14
      "form-8995.0.line.15": 24163,
    },
  },
};

export function dyelinExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
