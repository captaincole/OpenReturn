/*
 * karede — LOCKED expected values, drafted from the engine's
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
  "schedule-b": {
    engineFields: {
      // Line 1 — Amount (row 1)
      "schedule-b.0.line.1_amount_1": 3200,
      // Line 2 — Add the amounts on line 1
      "schedule-b.0.line.2_total_interest": 3200,
      // Line 4 — Subtract line 3 from line 2. Enter the result here and on Form 1040 or 1040-SR, l
      "schedule-b.0.line.4_taxable_interest": 3200,
      // Line 5 — Amount (row 1)
      "schedule-b.0.line.5_amount_1": 8000,
      // Line 6 — Add the amounts on line 5. Enter the total here and on Form 1040 or 1040-SR, line
      "schedule-b.0.line.6_total_ordinary_dividends": 8000,
    },
  },
  "form-8615": {
    engineFields: {
      // Line 1 — Enter the child's unearned income
      "form-8615.0.line.1_child_unearned_income": 13000,
      // Line 2 — If the child did not itemize deductions on Schedule A (Form 1040) or Schedule A (
      "form-8615.0.line.2_unearned_income_floor": 2700,
      // Line 3 — Subtract line 2 from line 1
      "form-8615.0.line.3_line_1_minus_line_2": 10300,
      // Line 4 — Enter the child's taxable income from Form 1040 or 1040-NR, line 15
      "form-8615.0.line.4_child_taxable_income": 15250,
      // Line 5 — Enter the smaller of line 3 or line 4
      "form-8615.0.line.5_net_unearned_income": 10300,
      // Line 6 — Enter the parent's taxable income from Form 1040 or 1040-NR, line 15
      "form-8615.0.line.6_parent_taxable_income": 296000,
      // Line 7 — Enter the total, if any, from Forms 8615, line 5, of all other children of the pa
      "form-8615.0.line.7_other_children_net_unearned_income": 4500,
      // Line 8 — Add lines 5, 6, and 7
      "form-8615.0.line.8_add_lines_5_6_7": 310800,
      // Line 9 — Enter the tax on the amount on line 8 based on the parent's filing status above
      "form-8615.0.line.9_tax_on_line_8": 59531,
      // Line 10 — Enter the parent's tax from Form 1040 or 1040-NR, line 16, minus any alternative
      "form-8615.0.line.10_parent_tax": 56464,
      // Line 11 — Subtract line 10 from line 9 and enter the result
      "form-8615.0.line.11_line_9_minus_line_10": 3067,
      // Line 12a — Add lines 5 and 7
      "form-8615.0.line.12a_add_lines_5_7": 14800,
      // Line 13 — Multiply line 11 by line 12b
      "form-8615.0.line.13_child_share_parent_rate_tax": 2135,
      // Line 14 — Subtract line 5 from line 4
      "form-8615.0.line.14_line_4_minus_line_5": 4950,
      // Line 15 — Enter the tax on the amount on line 14 based on the child's filing status
      "form-8615.0.line.15_tax_on_line_14": 353,
      // Line 16 — Add lines 13 and 15
      "form-8615.0.line.16_add_lines_13_15": 2488,
      // Line 17 — Enter the tax on the amount on line 4 based on the child's filing status
      "form-8615.0.line.17_tax_on_line_4": 848,
      // Line 18 — Enter the larger of line 16 or line 17 here and on the child's Form 1040 or 1040
      "form-8615.0.line.18_child_tax": 2488,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 18000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 18000,
      // Line 2b — Taxable interest
      "form-1040.line.2b": 3200,
      // Line 3a — Qualified dividends
      "form-1040.line.3a": 5000,
      // Line 3b — Ordinary dividends
      "form-1040.line.3b": 8000,
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": 1800,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 31000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 31000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 31000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 15250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 2488,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 2488,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 2488,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 2488,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 600,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 600,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 600,
      // Line 37 — Amount you owe
      "form-1040.line.37": 1888,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Part One. Income Adjustment Schedule. Section A. Income from federal Form 1040 or 1040-SR.
      "schedule-ca.0.line.1a_federal": 18000,
      // Line 1z. Add line 1a through line 1i. Column A. Federal Amounts.
      "schedule-ca.0.line.1z_federal": 18000,
      // Line 2. Taxable interest. Line 2b. Column A. Federal Amounts.
      "schedule-ca.0.line.2b_federal": 3200,
      // Line 3. Ordinary dividends. See instructions. Line 3 a.
      "schedule-ca.0.line.3a_federal": 5000,
      // Line 3. Ordinary dividends. Line 3b. Column A. Federal Amounts.
      "schedule-ca.0.line.3b_federal": 8000,
      // Line 7a. Capital gain or (loss). See instructions. Column A. Federal Amounts.
      "schedule-ca.0.line.7a_federal": 1800,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 31000,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 31000,
      // Line 30. Enter the larger of the amount on line 29 or your standard deduction shown below:
      "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 5706,
    },
  },
  "form-3800-ca": {
    engineFields: {
      // Part I, Line 1. Enter the child's unearned income, such as taxable interest, ordinary divi
      "form-3800-ca.0.line.1_child_unearned_income": 13000,
      // Line 2. If the child did not itemize deductions on Form 540 or Form 540N R, enter $2,700.
      "form-3800-ca.0.line.2_unearned_income_deduction": 2700,
      // Line 3. Subtract line 2 from line 1. If zero or less, stop here; do not complete the rest
      "form-3800-ca.0.line.3_unearned_income_less_deduction": 10300,
      // Line 4. Enter the child's taxable income from Form 540, line 19 or total taxable income fr
      "form-3800-ca.0.line.4_child_taxable_income": 25294,
      // Line 5. Net unearned income. Enter the smaller of line 3 or line 4. If zero or less, stop
      "form-3800-ca.0.line.5_net_unearned_income": 10300,
      // Part II, Line 6. Enter the parent's taxable income from Form 540, line 19; or total taxabl
      "form-3800-ca.0.line.6_parent_taxable_income": 280000,
      // Line 7. Enter the total net unearned income, if any, from form(s) F T B 3800, line 5, of a
      "form-3800-ca.0.line.7_other_children_net_unearned_income": 4200,
      // Line 8. Add line 5 through line 7.
      "form-3800-ca.0.line.8_total_income_at_parent_rate": 294500,
      // Line 9. Enter the tax on the amount on line 8 based on the parent's filing status. Use the
      "form-3800-ca.0.line.9_tax_on_line_8": 20266,
      // Line 10. Enter the parent's tax from Form 540, line 31. See instructions for Form 540N R f
      "form-3800-ca.0.line.10_parent_tax": 18917,
      // Line 11. Subtract line 10 from line 9. If you did not enter an amount on line 7, then ente
      "form-3800-ca.0.line.11_tax_difference_at_parent_rate": 1349,
      // Line 12a. Add line 5 and line 7.
      "form-3800-ca.0.line.12a_all_children_net_unearned_income": 14500,
      // Line 13. Multiply line 11 by the decimal amount on line 12b.
      "form-3800-ca.0.line.13_child_share_of_tentative_tax": 958,
      // Part III, Line 14. Subtract line 5 from line 4.
      "form-3800-ca.0.line.14_taxable_income_less_net_unearned": 14994,
      // Line 15. Enter the tax on the amount on line 14 based on the child's filing status. Use th
      "form-3800-ca.0.line.15_tax_on_line_14": 189,
      // Line 16. Add line 13 and line 15.
      "form-3800-ca.0.line.16_tax_at_parent_rate_total": 1147,
      // Line 17. Enter the tax on the amount on line 4 based on the child's filing status. Use the
      "form-3800-ca.0.line.17_tax_on_line_4": 395,
      // Line 18. Compare the amounts on line 16 and line 17. Enter the larger of the two amounts h
      "form-3800-ca.0.line.18_child_tax": 1147,
    },
    // Hand edit: the header from the federal Form 8615 parent, and line 12b's four digits.
    renderedText: {
      "form-3800-ca.0.header.child_name": "Karede Ashfordly",
      "form-3800-ca.0.header.parent_name": "Galen R. Ashfordly",
      "form-3800-ca.0.header.parent_ssn": "400003802",
      "form-3800-ca.0.line.12b_child_share_decimal": "7103",
    },
  },
  "form-540": {
    engineFields: {
      // Exemptions. For line 7, line 8, line 9, and line 10: Multiply the number you enter in the
      "form-540.line.7_personal_exemption_count": 1,
      // Multiply the number you put in the line 7 box by $153. Enter this number into this field.
      "form-540.line.7_personal_exemption_amount": 153,
      // Line 11. Exemption amount: Add line 7 through line 10. Transfer this amount to line 32. Wh
      "form-540.line.11_total_exemption_amount": 153,
      // Taxable Income. Line 12. State wages from your federal Form or Forms W-2, box 16 .
      "form-540.line.12_state_wages": 18000,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040 or 1040-SR, li
      "form-540.line.13_federal_agi": 31000,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 31000,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 31000,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 25294,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 1147,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 153,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 994,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 994,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 994,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 994,
      // Payments. Line 71. California income tax withheld. See instructions.
      "form-540.line.71_ca_income_tax_withheld": 250,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 250,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 250,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 250,
      // Line 100. Tax due. If line 95 is less than line 64, subtract line 95 from line 64.
      "form-540.line.100_tax_due": 744,
      // Amount You Owe. Line 111. Amount You Owe. If you do not have an amount on line 99, add lin
      "form-540.line.111_amount_you_owe": 744,
      // Line 114. Total amount due. See instructions. Enclose, but do not staple, any payment.
      "form-540.line.114_total_amount_due": 744,
    },
    // Hand edit: line 31's FTB 3800 box.
    renderedChecked: ["form-540.line.31_tax_from_ftb_3800"],
  },
};

export function karedeExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
