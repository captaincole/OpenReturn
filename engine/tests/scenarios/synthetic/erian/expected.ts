/*
 * erian — LOCKED expected values, drafted from the engine's
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
  "form-8379": {
    engineFields: {
      // Line 13a — Income reported on Form(s) W-2: (a) Amount shown on joint return
      "form-8379.1.line.13a_income_w2_col_a": 68000,
      // Line 13a — Income reported on Form(s) W-2: (b) Allocated to injured spouse
      "form-8379.1.line.13a_income_w2_col_b": 46000,
      // Line 13a — Income reported on Form(s) W-2: (c) Allocated to other spouse
      "form-8379.1.line.13a_income_w2_col_c": 22000,
      // Line 13b — All other income: (a) Amount shown on joint return
      "form-8379.1.line.13b_all_other_income_col_a": 4300,
      // Line 13b — All other income: (b) Allocated to injured spouse
      "form-8379.1.line.13b_all_other_income_col_b": 150,
      // Line 13b — All other income: (c) Allocated to other spouse
      "form-8379.1.line.13b_all_other_income_col_c": 4150,
      // Line 14 — Adjustments to income: (a) Amount shown on joint return
      "form-8379.1.line.14_adjustments_to_income_col_a": 300,
      // Line 14 — Adjustments to income: (b) Allocated to injured spouse
      "form-8379.1.line.14_adjustments_to_income_col_b": 300,
      // Line 15 — Standard deduction or itemized deductions: (a) Amount shown on joint return
      "form-8379.1.line.15_standard_or_itemized_deductions_col_a": 31500,
      // Line 15 — Standard deduction or itemized deductions: (b) Allocated to injured spouse
      "form-8379.1.line.15_standard_or_itemized_deductions_col_b": 15750,
      // Line 15 — Standard deduction or itemized deductions: (c) Allocated to other spouse
      "form-8379.1.line.15_standard_or_itemized_deductions_col_c": 15750,
      // Line 16 — Nonrefundable credits: (a) Amount shown on joint return
      "form-8379.1.line.16_nonrefundable_credits_col_a": 4386,
      // Line 16 — Nonrefundable credits: (b) Allocated to injured spouse
      "form-8379.1.line.16_nonrefundable_credits_col_b": 2193,
      // Line 16 — Nonrefundable credits: (c) Allocated to other spouse
      "form-8379.1.line.16_nonrefundable_credits_col_c": 2193,
      // Line 17 — Refundable credits (do not include any earned income credit): (a) Amount shown o
      "form-8379.1.line.17_refundable_credits_col_a": 14,
      // Line 17 — Refundable credits (do not include any earned income credit): (b) Allocated to i
      "form-8379.1.line.17_refundable_credits_col_b": 7,
      // Line 17 — Refundable credits (do not include any earned income credit): (c) Allocated to o
      "form-8379.1.line.17_refundable_credits_col_c": 7,
      // Line 18 — Other taxes: (a) Amount shown on joint return
      "form-8379.1.line.18_other_taxes_col_a": 400,
      // Line 18 — Other taxes: (c) Allocated to other spouse
      "form-8379.1.line.18_other_taxes_col_c": 400,
      // Line 19 — Federal income tax withheld: (a) Amount shown on joint return
      "form-8379.1.line.19_federal_income_tax_withheld_col_a": 3700,
      // Line 19 — Federal income tax withheld: (b) Allocated to injured spouse
      "form-8379.1.line.19_federal_income_tax_withheld_col_b": 2600,
      // Line 19 — Federal income tax withheld: (c) Allocated to other spouse
      "form-8379.1.line.19_federal_income_tax_withheld_col_c": 1100,
      // Line 20 — Payments: (a) Amount shown on joint return
      "form-8379.1.line.20_payments_col_a": 1000,
      // Line 20 — Payments: (b) Allocated to injured spouse
      "form-8379.1.line.20_payments_col_b": 500,
      // Line 20 — Payments: (c) Allocated to other spouse
      "form-8379.1.line.20_payments_col_c": 500,
    },
    // MANUAL EDIT: Parts I and II, checked by hand against the form face.
    renderedText: {
      "form-8379.0.line.1_tax_year_filing_for": "2025",
      "form-8379.0.line.10_first_spouse_name": "Erian Thalmont",
      "form-8379.0.line.10_first_spouse_ssn": "400-00-8379",
      "form-8379.0.line.10_second_spouse_name": "Bastien Thalmont",
      "form-8379.0.line.10_second_spouse_ssn": "400-00-8380",
      "form-8379.0.line.12_refund_mailing_address": "2207 Pelican Cove Lane, Sarasota, FL 34231",
    },
    renderedChecked: [
      "form-8379.0.line.2_filed_joint_return_yes",
      "form-8379.0.line.3_overpayment_spouse_debt_yes",
      "form-8379.0.line.4_obligated_past_due_no",
      "form-8379.0.line.5_community_property_resident_no",
      "form-8379.0.line.6_made_reported_payments_yes",
      "form-8379.0.line.10_first_spouse_injured",
      "form-8379.0.line.12_different_mailing_address_yes",
    ],
    renderedBlank: [
      "form-8379.0.line.5_community_property_states",
      "form-8379.0.line.7_had_earned_income_yes",
      "form-8379.0.line.7_had_earned_income_no",
      "form-8379.0.line.8_claimed_eic_actc_yes",
      "form-8379.0.line.8_claimed_eic_actc_no",
      "form-8379.0.line.9_claimed_refundable_credit_yes",
      "form-8379.0.line.9_claimed_refundable_credit_no",
      "form-8379.0.line.10_second_spouse_injured",
      "form-8379.0.line.11_refund_in_both_names",
      "form-8379.1.signing.injured_spouse_phone",
    ],
  },
  "schedule-1": {
    engineFields: {
      // Line 11 — Educator expenses
      "schedule-1.1.line.11": 300,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 300,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 8 — Additional tax on IRAs or other tax-favored accounts. Attach Form 5329 if require
      "schedule-2.0.line.8_additional_tax_iras_tax_favored_accounts": 400,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 400,
    },
  },
  "schedule-8812": {
    engineFields: {
      // Line 1 — Enter the amount from line 11a of your Form 1040, 1040-SR, or 1040-NR
      "schedule-8812.0.line.1_form_1040_line_11a": 72000,
      // Line 3 — Add lines 1 and 2d
      "schedule-8812.0.line.3_modified_agi": 72000,
      // Line 4 — Number of qualifying children under age 17 with the required social security numb
      "schedule-8812.0.line.4_qualifying_children_under_17": 2,
      // Line 5 — Multiply line 4 by $2,200
      "schedule-8812.0.line.5_qualifying_children_times_2200": 4400,
      // Line 8 — Add lines 5 and 7
      "schedule-8812.0.line.8_total_credit_before_limit": 4400,
      // Line 9 — Enter the amount shown below for your filing status. Married filing jointly—$400,
      "schedule-8812.0.line.9_filing_status_threshold": 400000,
      // Line 12 — Is the amount on line 8 more than the amount on line 11? Yes. Subtract line 11 f
      "schedule-8812.0.line.12_credit_after_phaseout": 4400,
      // Line 13 — Enter the amount from Credit Limit Worksheet A
      "schedule-8812.0.line.13_credit_limit_worksheet_a": 4386,
      // Line 14 — Enter the smaller of line 12 or line 13. This is your child tax credit and credi
      "schedule-8812.0.line.14_child_tax_credit_and_other_dependents": 4386,
      // Line 16a — Subtract line 14 from line 12. If zero, stop here; you cannot take the addition
      "schedule-8812.1.line.16a_line12_minus_line14": 14,
      // Line 16b — Number of qualifying children under age 17 with the required social security nu
      "schedule-8812.1.line.16b_qualifying_children_count": 2,
      // Line 16b — Number of qualifying children under age 17 with the required social security nu
      "schedule-8812.1.line.16b_qualifying_children_times_1700": 3400,
      // Line 17 — Enter the smaller of line 16a or line 16b
      "schedule-8812.1.line.17_smaller_of_16a_16b": 14,
      // Line 18a — Earned income (see instructions)
      "schedule-8812.1.line.18a_earned_income": 68000,
      // Line 19 — Is the amount on line 18a more than $2,500? Yes. Subtract $2,500 from the amount
      "schedule-8812.1.line.19_earned_income_over_2500": 65500,
      // Line 20 — Multiply the amount on line 19 by 15% (0.15) and enter the result
      "schedule-8812.1.line.20_line19_times_15_percent": 9825,
      // Line 27 — This is your additional child tax credit. Enter this amount on Form 1040, 1040-S
      "schedule-8812.1.line.27_additional_child_tax_credit": 14,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 68000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 68000,
      // Line 2b — Taxable interest
      "form-1040.line.2b": 300,
      // Line 5a — Pensions and annuities
      "form-1040.line.5a": 4000,
      // Line 5b — Taxable amount
      "form-1040.line.5b": 4000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 72300,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 300,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 72000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 72000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 31500,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 31500,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 40500,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 4386,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 4386,
      // Line 19 — Child tax credit or credit for other dependents from Schedule 8812
      "form-1040.line.19": 4386,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 4386,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 400,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 400,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 3300,
      // Line 25b — Federal income tax withheld from Form(s) 1099
      "form-1040.line.25b": 400,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 3700,
      // Line 26 — 2025 estimated tax payments and amount applied from 2024 return
      "form-1040.line.26": 1000,
      // Line 28 — Additional child tax credit (ACTC) from Schedule 8812
      "form-1040.line.28": 14,
      // Line 32 — Add lines 27a, 28, 29, 30, and 31. Total other payments and refundable credits
      "form-1040.line.32": 14,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 4714,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 4314,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 4314,
    },
  },
};

export function erianExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
