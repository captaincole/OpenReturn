/*
 * basel — LOCKED expected values, drafted from the engine's
 * output on 2026-11-28 (scripts/draftExpected.ts).
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
  "form-8932": {
    engineFields: {
      // Line 1 — Eligible differential wage payments paid during the tax year
      "form-8932.0.line.1_eligible_differential_wage_payments": 28451,
      // Line 2 — Multiply line 1 by 20% (0.20)
      "form-8932.0.line.2_line1_times_20_percent": 5690,
      // Line 3 — Credit for employer differential wage payments from partnerships, S corporations,
      "form-8932.0.line.3_credit_from_pass_through_entities": 1840,
      // Line 4 — Add lines 2 and 3
      "form-8932.0.line.4_add_lines_2_and_3": 7530,
    },
  },
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 470000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 470000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 470000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 470000,
      // Line 20a — Rent or lease: Vehicles, machinery, and equipment
      "schedule-c.0.line.20a": 48000,
      // Line 21 — Repairs and maintenance
      "schedule-c.0.line.21": 31200,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 9800,
      // Line 23 — Taxes and licenses
      "schedule-c.0.line.23": 18400,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 26500,
      // Line 26 — Wages (less employment credits)
      "schedule-c.0.line.26": 208310,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 342210,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 127790,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 127790,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 127790,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 127790,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 118014,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 118014,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 118014,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 14634,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 3422,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 18056,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 9028,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 127790,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 127790,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 9028,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 9028,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": 118762,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": 118762,
      // Line 4 — Total qualified business income. Combine lines 2 and 3. If zero or less, enter -0
      "form-8995.0.line.4": 118762,
      // Line 5 — Qualified business income component. Multiply line 4 by 20% (0.20)
      "form-8995.0.line.5": 23752,
      // Line 10 — Qualified business income deduction before the income limitation. Add lines 5 an
      "form-8995.0.line.10": 23752,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 103012,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 103012,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 20602,
      // Line 15 — Qualified business income deduction. Enter the smaller of line 10 or line 14
      "form-8995.0.line.15": 20602,
    },
  },
  "form-6251": {
    engineFields: {
      // Line 1a — Subtract Schedule 1-A (Form 1040), line 37, from Form 1040, 1040-SR, or 1040-NR,
      "form-6251.0.line.1a_deductions_less_schedule_1a": 36352,
      // Line 1b — Subtract line 1a from Form 1040, 1040-SR, or 1040-NR, line 11b (if less than zer
      "form-6251.0.line.1b_taxable_income_start": 82410,
      // Line 2a — If filing Schedule A (Form 1040), enter the taxes from Schedule A, line 7; other
      "form-6251.0.line.2a_taxes_or_standard_deduction": 15750,
      // Line 4 — Alternative minimum taxable income. Combine lines 1b through 3
      "form-6251.0.line.4_alternative_minimum_taxable_income": 98160,
      // Line 5 — Exemption
      "form-6251.0.line.5_exemption": 88100,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-6251.0.line.6_amti_less_exemption": 10060,
      // Line 7 — Tax on line 6: complete Part III and enter line 40 if you have capital gain distr
      "form-6251.0.line.7_tax_on_line_6": 2616,
      // Line 9 — Tentative minimum tax. Subtract line 8 from line 7
      "form-6251.0.line.9_tentative_minimum_tax": 2616,
      // Line 10 — Add Form 1040 or 1040-SR, line 16 (minus any tax from Form 4972), and Schedule 2
      "form-6251.0.line.10_regular_tax_less_credits": 13048,
    },
  },
  "form-3800": {
    engineFields: {
      // Line 1 — Credits not subject to the passive activity limit from Part III, line 2: combine
      "form-3800.0.line.1_credits_not_passive_limited": 7530,
      // Line 6 — Add lines 1, 3, 4, and 5
      "form-3800.0.line.6_total_credits_not_allowed_tmt": 7530,
      // Line 7 — Regular tax before credits
      "form-3800.0.line.7_regular_tax_before_credits": 13048,
      // Line 9 — Add lines 7 and 8
      "form-3800.0.line.9_regular_tax_plus_amt": 13048,
      // Line 11 — Net income tax. Subtract line 10c from line 9
      "form-3800.0.line.11_net_income_tax": 13048,
      // Line 12 — Net regular tax. Subtract line 10c from line 7. If zero or less, enter -0-
      "form-3800.0.line.12_net_regular_tax": 13048,
      // Line 14 — Tentative minimum tax
      "form-3800.0.line.14_tentative_minimum_tax": 2616,
      // Line 15 — Enter the greater of line 13 or line 14
      "form-3800.0.line.15_greater_of_line_13_or_14": 2616,
      // Line 16 — Subtract line 15 from line 11. If zero or less, enter -0-
      "form-3800.0.line.16_net_income_tax_less_line_15": 10432,
      // Line 17 — Enter the smaller of line 6 or line 16. This is the amount of your credit allowe
      "form-3800.0.line.17_credit_allowed_after_38c1_limit": 7530,
      // Line 27 — Subtract line 13 from line 11. If zero or less, enter -0-
      "form-3800.1.line.27_subtract_line_13_from_11": 13048,
      // Line 28 — Add lines 17 and 26
      "form-3800.1.line.28_add_lines_17_and_26": 7530,
      // Line 29 — Subtract line 28 from line 27. If zero or less, enter -0-
      "form-3800.1.line.29_subtract_line_28_from_27": 5518,
      // Line 38 — Credit allowed for the current year. Add lines 28 and 37
      "form-3800.1.line.38_credit_allowed_current_year": 7530,
      // Line 1w — Form 8932 — (a) No. of items
      "form-3800.2.part3.1w_form_8932_col_a": 2,
      // Line 1w — Form 8932 — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.1w_form_8932_col_e": 7530,
      // Line 1w — Form 8932 — (g) Combine columns (e) and (f) with the credit from column (d) allo
      "form-3800.2.part3.1w_form_8932_col_g": 7530,
      // Line 2 — Add lines 1a–1zz — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.2_add_lines_1a_1zz_col_e": 7530,
      // Line 2 — Add lines 1a–1zz — (g) Combine columns (e) and (f) with the credit from column (d
      "form-3800.2.part3.2_add_lines_1a_1zz_col_g": 7530,
      // Line 6 — Add lines 2, 3, and 5: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.6_add_lines_2_3_5_col_e": 7530,
      // Line 6 — Add lines 2, 3, and 5: (g) Combine columns (e) and (f) with the credit from colum
      "form-3800.3.part3.6_add_lines_2_3_5_col_g": 7530,
      // Part V, line 1, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.1_breakdown_col_e": 1840,
      // Part V, line 2, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.2_breakdown_col_e": 5690,
      // Line 1 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.1_breakdown_col_g": 1840,
      // Line 1 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.1_breakdown_col_h2": 1840,
      // Line 1 — (i)(1) Amount of column (h)(2) applied against tax in Part II
      "form-3800.7.part5.1_breakdown_col_i1": 1840,
      // Line 2 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.2_breakdown_col_g": 5690,
      // Line 2 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.2_breakdown_col_h2": 5690,
      // Line 2 — (i)(1) Amount of column (h)(2) applied against tax in Part II
      "form-3800.7.part5.2_breakdown_col_i1": 5690,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 18056,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 18056,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 6a — General business credit. Attach Form 3800
      "schedule-3.0.line.6a": 7530,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 7530,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 7530,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 127790,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 127790,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 9028,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 118762,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 118762,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 20602,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 36352,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 82410,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 13048,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 13048,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 7530,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 7530,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 5518,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 18056,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 23574,
      // Line 26 — 2025 estimated tax payments and amount applied from 2024 return
      "form-1040.line.26": 36000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 36000,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 12426,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 12426,
    },
  },
};

export function baselExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
