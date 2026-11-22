/*
 * tomas — LOCKED expected values, drafted from the engine's
 * output on 2026-11-22 (scripts/draftExpected.ts).
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
  "form-8814": {
    engineFields: {
      // Line 1a — Enter your child's taxable interest
      "form-8814.0.line.1a_child_taxable_interest": 3400,
      // Line 2a — Enter your child's ordinary dividends, including any Alaska Permanent Fund divid
      "form-8814.0.line.2a_child_ordinary_dividends": 1900,
      // Line 2b — Enter your child's qualified dividends included on line 2a
      "form-8814.0.line.2b_child_qualified_dividends": 1500,
      // Line 4 — Add lines 1a, 2a, and 3
      "form-8814.0.line.4_total_interest_dividends": 5300,
      // Line 6 — Subtract line 5 from line 4
      "form-8814.0.line.6_amount_over_base": 2600,
      // Line 9 — Multiply line 6 by line 7
      "form-8814.0.line.9_qualified_dividends_to_report": 736,
      // Line 11 — Add lines 9 and 10
      "form-8814.0.line.11_add_lines_9_10": 736,
      // Line 12 — Subtract line 11 from line 6. Include this amount in the total on Schedule 1 (Fo
      "form-8814.0.line.12_other_income_schedule_1": 1864,
      // Line 14 — Subtract line 13 from line 4. If the result is zero or less, enter -0-
      "form-8814.0.line.14_amount_over_not_taxed": 3950,
      // Line 15 — Tax
      "form-8814.0.line.15_tax": 135,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 8z — Other income amount
      "schedule-1.0.line.8z": 1864,
      // Line 9 — Total other income. Add lines 8a through 8z
      "schedule-1.0.line.9": 1864,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 1864,
    },
  },
  "schedule-8812": {
    engineFields: {
      // Line 1 — Enter the amount from line 11a of your Form 1040, 1040-SR, or 1040-NR
      "schedule-8812.0.line.1_form_1040_line_11a": 99100,
      // Line 3 — Add lines 1 and 2d
      "schedule-8812.0.line.3_modified_agi": 99100,
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
      "schedule-8812.0.line.13_credit_limit_worksheet_a": 7683,
      // Line 14 — Enter the smaller of line 12 or line 13. This is your child tax credit and credi
      "schedule-8812.0.line.14_child_tax_credit_and_other_dependents": 2200,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 96500,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 96500,
      // Line 3a — Qualified dividends
      "form-1040.line.3a": 736,
      // Line 3b — Ordinary dividends
      "form-1040.line.3b": 736,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 1864,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 99100,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 99100,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 99100,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 31500,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 31500,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 67600,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 7683,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 7683,
      // Line 19 — Child tax credit or credit for other dependents from Schedule 8812
      "form-1040.line.19": 2200,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 2200,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 5483,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 5483,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 8900,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 8900,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 8900,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 3417,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 3417,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Part One. Income Adjustment Schedule. Section A. Income from federal Form 1040 or 1040-SR.
      "schedule-ca.0.line.1a_federal": 96500,
      // Line 1z. Add line 1a through line 1i. Column A. Federal Amounts.
      "schedule-ca.0.line.1z_federal": 96500,
      // Line 3. Ordinary dividends. See instructions. Line 3 a.
      "schedule-ca.0.line.3a_federal": 736,
      // Line 3. Ordinary dividends. Line 3b. Column A. Federal Amounts.
      "schedule-ca.0.line.3b_federal": 736,
      // Line 8 z. Other income. Enter amount. Column A. Federal Amounts.
      "schedule-ca.1.line.b8z_federal": 1864,
      // Line 8z. Column B. Subtractions.
      "schedule-ca.1.line.b8z_subtractions": 1600,
      // Line 9 a. Total other income. Add line 8a through line 8z. Column A. Federal Amounts.
      "schedule-ca.2.line.b9a_federal": 1864,
      // Line 9 a. Column B. Subtractions.
      "schedule-ca.2.line.b9a_subtractions": 1600,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 99100,
      // Line 10. Column B. Subtractions.
      "schedule-ca.2.line.b10_subtractions": 1600,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 99100,
      // Line 27. Column B. Subtractions.
      "schedule-ca.3.line.c27_subtractions": 1600,
      // Line 30. Enter the larger of the amount on line 29 or your standard deduction shown below:
      "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 11412,
    },
    renderedText: { "schedule-ca.1.line.b8z_income_type": "Form 8814, FTB 3803" },
    renderedBlank: ["schedule-ca.1.line.b8z_additions"],
  },
  "form-3803": {
    engineFields: {
      // Part I, Line 1a. Enter your child's taxable interest income.
      "form-3803.0.line.1a_child_taxable_interest": 1800,
      // Line 1b. Enter your child's tax-exempt interest income. Do not include this amount on line
      "form-3803.0.line.1b_child_tax_exempt_interest": 1600,
      // Line 2. Enter your child's ordinary dividends. If none, enter 0. If your child received an
      "form-3803.0.line.2_child_ordinary_dividends": 1900,
      // Line 4. Add line 1a, line 2, and line 3. If the total is $2,700 or less, skip line 5 and l
      "form-3803.0.line.4_total_child_income": 3700,
      // Line 5. Base amount. Enter 2,700.
      "form-3803.0.line.5_base_amount": 2700,
      // Line 6. Subtract line 5 from line 4. See instructions for where to report this amount Go t
      "form-3803.0.line.6_income_to_report_on_return": 1000,
      // Part II, Line 7. Amount not taxed. Enter 1,350.
      "form-3803.0.line.7_amount_not_taxed": 1350,
      // Line 8. Subtract line 7 from line 4. If zero or less, enter 0.
      "form-3803.0.line.8_income_over_amount_not_taxed": 2350,
      // Line 9. Tax. Is the amount on line 8 less than $1,350? No. Enter $14.00 here and see the N
      "form-3803.0.line.9_tax_on_first_2700": 14,
    },
    renderedText: {
      "form-3803.0.header.taxpayer_name": "Tomas Albrecht & Hana Albrecht",
      "form-3803.0.header.child_name": "Juniper Albrecht",
    },
    renderedBlank: [
      "form-3803.0.header.more_than_one_form_attached",
      "form-3803.0.line.3_child_capital_gain_distributions",
    ],
  },
  "form-540": {
    engineFields: {
      // Exemptions. For line 7, line 8, line 9, and line 10: Multiply the number you enter in the
      "form-540.line.7_personal_exemption_count": 2,
      // Multiply the number you put in the line 7 box by $153. Enter this number into this field.
      "form-540.line.7_personal_exemption_amount": 306,
      // Line 10. Total dependent exemptions
      "form-540.line.10_dependent_exemption_count": 1,
      // Multiply the number of total dependent exemptions you put in the line 10 box by $475. Ente
      "form-540.line.10_dependent_exemption_amount": 475,
      // Line 11. Exemption amount: Add line 7 through line 10. Transfer this amount to line 32. Wh
      "form-540.line.11_total_exemption_amount": 781,
      // Taxable Income. Line 12. State wages from your federal Form or Forms W-2, box 16 .
      "form-540.line.12_state_wages": 96500,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040 or 1040-SR, li
      "form-540.line.13_federal_agi": 99100,
      // Line 14. California adjustments – subtractions. Enter the amount from Schedule CA (540), P
      "form-540.line.14_ca_adjustments_subtractions": 1600,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 97500,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 97500,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 11412,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 86088,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 2250,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 781,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 1469,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 1469,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 1469,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 1469,
      // Payments. Line 71. California income tax withheld. See instructions.
      "form-540.line.71_ca_income_tax_withheld": 3600,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 3600,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 3600,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 3600,
      // Line 97. Overpaid tax. If line 95 is more than line 64, subtract line 64 from line 95.
      "form-540.line.97_overpaid_tax": 2131,
      // Line 99. Overpaid tax available this year. Subtract line 98 from line 97.
      "form-540.line.99_overpaid_tax_available": 2131,
      // Refund and Direct Deposit. Line 115. Refund or no amount due. Subtract the sum of line 110
      "form-540.line.115_refund_or_no_amount_due": 2131,
    },
    renderedChecked: ["form-540.line.31_tax_from_ftb_3803"],
  },
};

export function tomasExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
