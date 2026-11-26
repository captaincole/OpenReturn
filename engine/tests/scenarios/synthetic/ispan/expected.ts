/*
 * ispan — LOCKED expected values, drafted from the engine's
 * output on 2026-11-26 (scripts/draftExpected.ts).
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
  "form-7206": {
    engineFields: {
      // Line 1 — Enter the total amount paid in 2025 for health insurance coverage established und
      "form-7206.0.line.1_health_insurance_paid": 14260,
      // Line 2 — For coverage under a qualified long-term care insurance contract, enter for each
      "form-7206.0.line.2_long_term_care_premiums": 1800,
      // Line 3 — Add lines 1 and 2
      "form-7206.0.line.3_total_premiums": 16060,
      // Line 4 — Enter your net profit and any other earned income from the trade or business unde
      "form-7206.0.line.4_business_net_profit": 118000,
      // Line 5 — Enter the total of all net profits from Schedule C (Form 1040), line 31; Schedule
      "form-7206.0.line.5_total_net_profits": 118000,
      // Line 7 — Multiply Schedule 1 (Form 1040), line 15, deductible part of self-employment tax,
      "form-7206.0.line.7_allocated_se_tax_deduction": 8337,
      // Line 8 — Subtract line 7 from line 4
      "form-7206.0.line.8_profit_less_se_tax": 109663,
      // Line 9 — Enter the amount, if any, from Schedule 1 (Form 1040), line 16, self-employed SEP
      "form-7206.0.line.9_retirement_plan_deduction": 15000,
      // Line 10 — Subtract line 9 from line 8
      "form-7206.0.line.10_net_earned_income": 94663,
      // Line 13 — Subtract line 12 from line 10 or 11, whichever applies
      "form-7206.0.line.13_earned_income_limit": 94663,
      // Line 14 — Self-employed health insurance deduction. Enter the smaller of line 3 or line 13
      "form-7206.0.line.14_se_health_insurance_deduction": 16060,
    },
    renderedText: {
      "form-7206.0.header.taxpayer_name": "Ispan Corvane",
      "form-7206.0.header.taxpayer_id": "400-00-7206",
      // Line 6 — Divide line 4 by line 5 (4 places, QUESTIONS.md question 4)
      "form-7206.0.line.6_business_profit_ratio": "1.0000",
    },
    renderedBlank: [
      "form-7206.0.line.11_s_corp_medicare_wages",
      "form-7206.0.line.12_form_2555_exclusion",
    ],
  },
  "form-1040": {
    engineFields: {
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 118000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 118000,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 39397,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 78603,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 78603,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 12571,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 28321,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 50282,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 5975,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 5975,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 5975,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 16673,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 22648,
      // Line 26 — 2025 estimated tax payments and amount applied from 2024 return
      "form-1040.line.26": 20000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 20000,
      // Line 37 — Amount you owe
      "form-1040.line.37": 2648,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 118000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 118000,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 8337,
      // Line 16 — Self-employed SEP, SIMPLE, and qualified plans
      "schedule-1.1.line.16": 15000,
      // Line 17 — Self-employed health insurance deduction
      "schedule-1.1.line.17": 16060,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 39397,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 16673,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 16673,
    },
  },
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 131500,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 131500,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 131500,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 131500,
      // Line 8 — Advertising
      "schedule-c.0.line.8": 2200,
      // Line 18 — Office expense
      "schedule-c.0.line.18": 3100,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 6400,
      // Line 17 — Legal and professional services
      "schedule-c.0.line.17": 1800,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 13500,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 118000,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 118000,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 118000,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 118000,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 108973,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 108973,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 108973,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 13513,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 3160,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 16673,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 8337,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": 78603,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": 78603,
      // Line 4 — Total qualified business income. Combine lines 2 and 3. If zero or less, enter -0
      "form-8995.0.line.4": 78603,
      // Line 5 — Qualified business income component. Multiply line 4 by 20% (0.20)
      "form-8995.0.line.5": 15721,
      // Line 10 — Qualified business income deduction before the income limitation. Add lines 5 an
      "form-8995.0.line.10": 15721,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 62853,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 62853,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 12571,
      // Line 15 — Qualified business income deduction. Enter the smaller of line 10 or line 14
      "form-8995.0.line.15": 12571,
    },
  },
};

export function ispanExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
