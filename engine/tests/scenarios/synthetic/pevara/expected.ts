/*
 * pevara — LOCKED expected values, drafted from the engine's
 * output on 2026-11-25 (scripts/draftExpected.ts).
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
  "form-8911": {
    engineFields: {
      // Line A — Enter the total number of qualified alternative fuel vehicle refueling properties
      "form-8911.0.header.a_number_of_refueling_properties": 2,
      // Line 4 — Enter the total credit amount figured in Part III of Schedule(s) A (Form 8911)
      "form-8911.0.line.4_personal_credit_from_schedule_a": 1624,
      // Line 5 — Regular tax before credits
      "form-8911.0.line.5_regular_tax_before_credits": 32607,
      // Line 6a — Credits that reduce regular tax before the alternative fuel vehicle refueling pr
      "form-8911.0.line.6a_foreign_tax_credit": 95,
      // Line 6b — Credits that reduce regular tax before the alternative fuel vehicle refueling pr
      "form-8911.0.line.6b_certain_allowable_credits": 2200,
      // Line 6c — Add lines 6a and 6b
      "form-8911.0.line.6c_total_credits_reducing_tax": 2295,
      // Line 7 — Net regular tax. Subtract line 6c from line 5
      "form-8911.0.line.7_net_regular_tax": 30312,
      // Line 8 — Tentative minimum tax
      "form-8911.0.line.8_tentative_minimum_tax": 23002,
      // Line 9 — Subtract line 8 from line 7
      "form-8911.0.line.9_net_tax_less_minimum_tax": 7310,
      // Line 10 — Personal use part of credit. Enter the smaller of line 4 or line 9
      "form-8911.0.line.10_personal_use_credit": 1624,
    },
  },
  "form-6251": {
    engineFields: {
      // Line 1a — Subtract Schedule 1-A (Form 1040), line 37, from Form 1040, 1040-SR, or 1040-NR,
      "form-6251.0.line.1a_deductions_less_schedule_1a": 31500,
      // Line 1b — Subtract line 1a from Form 1040, 1040-SR, or 1040-NR, line 11b (if less than zer
      "form-6251.0.line.1b_taxable_income_start": 194800,
      // Line 2a — If filing Schedule A (Form 1040), enter the taxes from Schedule A, line 7; other
      "form-6251.0.line.2a_taxes_or_standard_deduction": 31500,
      // Line 4 — Alternative minimum taxable income. Combine lines 1b through 3
      "form-6251.0.line.4_alternative_minimum_taxable_income": 226300,
      // Line 5 — Exemption
      "form-6251.0.line.5_exemption": 137000,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-6251.0.line.6_amti_less_exemption": 89300,
      // Line 7 — Tax on line 6: complete Part III and enter line 40 if you have capital gain distr
      "form-6251.0.line.7_tax_on_line_6": 23097,
      // Line 9 — Tentative minimum tax. Subtract line 8 from line 7
      "form-6251.0.line.9_tentative_minimum_tax": 23097,
      // Line 10 — Add Form 1040 or 1040-SR, line 16 (minus any tax from Form 4972), and Schedule 2
      "form-6251.0.line.10_regular_tax_less_credits": 32512,
      // Line 12 — Enter the amount from Form 6251, line 6
      "form-6251.1.line.12_amount_from_line_6": 89300,
      // Line 13 — Enter the amount from line 4 of the Qualified Dividends and Capital Gain Tax Wor
      "form-6251.1.line.13_qualified_dividends_gain_amount": 1100,
      // Line 15 — If you did not complete a Schedule D Tax Worksheet for the regular tax or the AM
      "form-6251.1.line.15_adjusted_net_capital_gain": 1100,
      // Line 16 — Enter the smaller of line 12 or line 15
      "form-6251.1.line.16_smaller_line_12_or_15": 1100,
      // Line 17 — Subtract line 16 from line 12
      "form-6251.1.line.17_line_12_minus_16": 88200,
      // Line 18 — If line 17 is $239,100 or less ($119,550 or less if married filing separately),
      "form-6251.1.line.18_tax_on_line_17": 22932,
      // Line 19 — Enter: $96,700 if married filing jointly or qualifying surviving spouse; $48,350
      "form-6251.1.line.19_zero_rate_threshold": 96700,
      // Line 20 — Enter the amount from line 5 of the Qualified Dividends and Capital Gain Tax Wor
      "form-6251.1.line.20_regular_tax_taxable_income": 193700,
      // Line 22 — Enter the smaller of line 12 or line 13
      "form-6251.1.line.22_smaller_line_12_or_13": 1100,
      // Line 24 — Subtract line 23 from line 22
      "form-6251.1.line.24_line_22_minus_23": 1100,
      // Line 25 — Enter: $533,400 if single; $300,000 if married filing separately; $600,050 if ma
      "form-6251.1.line.25_fifteen_rate_threshold": 600050,
      // Line 27 — Enter the amount from line 5 of the Qualified Dividends and Capital Gain Tax Wor
      "form-6251.1.line.27_regular_tax_taxable_income": 193700,
      // Line 28 — Add line 26 and line 27
      "form-6251.1.line.28_add_lines_26_27": 193700,
      // Line 29 — Subtract line 28 from line 25. If zero or less, enter -0-
      "form-6251.1.line.29_line_25_minus_28": 406350,
      // Line 30 — Enter the smaller of line 24 or line 29
      "form-6251.1.line.30_smaller_line_24_or_29": 1100,
      // Line 31 — Multiply line 30 by 15% (0.15)
      "form-6251.1.line.31_tax_at_fifteen_percent": 165,
      // Line 32 — Add lines 23 and 30
      "form-6251.1.line.32_add_lines_23_30": 1100,
      // Line 38 — Add lines 18, 31, 34, and 37
      "form-6251.1.line.38_add_lines_18_31_34_37": 23097,
      // Line 39 — If line 12 is $239,100 or less ($119,550 or less if married filing separately),
      "form-6251.1.line.39_tax_on_line_12": 23218,
      // Line 40 — Enter the smaller of line 38 or line 39 here and on line 7
      "form-6251.1.line.40_smaller_line_38_or_39": 23097,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 1 — Foreign tax credit. Attach Form 1116 if required
      "schedule-3.0.line.1": 95,
      // Line 6j — Alternative fuel vehicle refueling property credit. Attach Form 8911
      "schedule-3.0.line.6j": 1624,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 1624,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 1719,
    },
  },
  "schedule-8812": {
    engineFields: {
      // Line 1 — Enter the amount from line 11a of your Form 1040, 1040-SR, or 1040-NR
      "schedule-8812.0.line.1_form_1040_line_11a": 226300,
      // Line 3 — Add lines 1 and 2d
      "schedule-8812.0.line.3_modified_agi": 226300,
      // Line 4 — Number of qualifying children under age 17 with the required social security numb
      "schedule-8812.0.line.4_qualifying_children_under_17": 1,
      // Line 5 — Multiply line 4 by $2,200
      "schedule-8812.0.line.5_qualifying_children_times_2200": 2200,
      // Line 8 — Add lines 5 and 7
      "schedule-8812.0.line.8_total_credit_before_limit": 2200,
      // Line 9 — Enter the amount shown below for your filing status. Married filing jointly—$400,
      "schedule-8812.0.line.9_filing_status_threshold": 400000,
      // Line 12 — Is the amount on line 8 more than the amount on line 11? Yes. Subtract line 11 f
      "schedule-8812.0.line.12_credit_after_phaseout": 2200,
      // Line 13 — Enter the amount from Credit Limit Worksheet A
      "schedule-8812.0.line.13_credit_limit_worksheet_a": 32512,
      // Line 14 — Enter the smaller of line 12 or line 13. This is your child tax credit and credi
      "schedule-8812.0.line.14_child_tax_credit_and_other_dependents": 2200,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 225000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 225000,
      // Line 3a — Qualified dividends
      "form-1040.line.3a": 1100,
      // Line 3b — Ordinary dividends
      "form-1040.line.3b": 1300,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 226300,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 226300,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 226300,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 31500,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 31500,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 194800,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 32607,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 32607,
      // Line 19 — Child tax credit or credit for other dependents from Schedule 8812
      "form-1040.line.19": 2200,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 1719,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 3919,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 28688,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 28688,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 28900,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 28900,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 28900,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 212,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 212,
    },
  },
};

export function pevaraExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
