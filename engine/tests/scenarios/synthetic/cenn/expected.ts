/*
 * cenn — LOCKED expected values, drafted from the engine's
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
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 140000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 140000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 140000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 140000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 140000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 124250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 22667,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 22667,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 22667,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 22667,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 22400,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 22400,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 22400,
      // Line 37 — Amount you owe
      "form-1040.line.37": 267,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Part One. Income Adjustment Schedule. Section A. Income from federal Form 1040 or 1040-SR.
      "schedule-ca.0.line.1a_federal": 140000,
      // Line 1z. Add line 1a through line 1i. Column A. Federal Amounts.
      "schedule-ca.0.line.1z_federal": 140000,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 140000,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 140000,
      // Line 30. Enter the larger of the amount on line 29 or your standard deduction shown below:
      "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 5706,
    },
  },
  "form-5870a": {
    engineFields: {
      // Enter number of trusts from which you received accumulation distributions in this taxable
      "form-5870a.0.header.number_of_trusts": 1,
      // Part one. Section A. Line one. Amount of current distribution that is considered distribut
      "form-5870a.0.part1.1_current_distribution_earlier_years": 37000,
      // Line two. Taxes imposed on the trust on amounts from line one from Schedule J (541), line
      "form-5870a.0.part1.2_taxes_imposed_on_trust": 1140,
      // Line three. Total. Add line one and line two
      "form-5870a.0.part1.3_total": 38140,
      // Line four. Tax-exempt interest included on line three from Schedule J (541), line thirty,
      "form-5870a.0.part1.4_tax_exempt_interest": 500,
      // Line five. Taxable part of line three. Subtract line four from line three
      "form-5870a.0.part1.5_taxable_part": 37640,
      // Line six. Number of trust’s earlier taxable years in which amounts on line five are consid
      "form-5870a.0.part1.6_earlier_years_distributed": 4,
      // Line seven. Average annual amount considered distributed. Divide line one by line six
      "form-5870a.0.part1.7_average_annual_amount": 9250,
      // Line eight. Multiply line seven by 25 percent. (point 25)
      "form-5870a.0.part1.8_line_7_times_25_percent": 2313,
      // Line nine. Number of trust’s earlier taxable years to be taken into account. See instructi
      "form-5870a.0.part1.9_earlier_years_taken_into_account": 3,
      // Line ten. Average amount for recomputing tax. Divide line five by line nine. Enter here an
      "form-5870a.0.part1.10_average_amount_recomputing_tax": 12547,
      // Line eleven. Enter your taxable income before this distribution for the five immediately p
      "form-5870a.0.part1.11_taxable_income_2024": 118000,
      // 2023. Enter amount
      "form-5870a.0.part1.11_taxable_income_2023": 104000,
      // 2022. Enter amount
      "form-5870a.0.part1.11_taxable_income_2022": 96000,
      // 2021. Enter amount
      "form-5870a.0.part1.11_taxable_income_2021": 84000,
      // 2020. Enter amount
      "form-5870a.0.part1.11_taxable_income_2020": 79000,
      // Line twelve. Enter the amounts and the years from line eleven, eliminating the highest and
      "form-5870a.0.part1.12_taxable_income_col_a": 104000,
      // Line twelve. Enter the amounts and the years from line eleven, eliminating the highest and
      "form-5870a.0.part1.12_taxable_income_col_b": 96000,
      // Line twelve. Enter the amounts and the years from line eleven, eliminating the highest and
      "form-5870a.0.part1.12_taxable_income_col_c": 84000,
      // Line thirteen. Enter amount from line ten in each column. Column (a)
      "form-5870a.0.part1.13_amount_from_line_10_col_a": 12547,
      // Line thirteen. Enter amount from line ten in each column. Column (b)
      "form-5870a.0.part1.13_amount_from_line_10_col_b": 12547,
      // Line thirteen. Enter amount from line ten in each column. Column (c)
      "form-5870a.0.part1.13_amount_from_line_10_col_c": 12547,
      // Line fourteen. Recomputed taxable income. Add line twelve and line thirteen. Column (a)
      "form-5870a.0.part1.14_recomputed_taxable_income_col_a": 116547,
      // Line fourteen. Recomputed taxable income. Add line twelve and line thirteen. Column (b)
      "form-5870a.0.part1.14_recomputed_taxable_income_col_b": 108547,
      // Line fourteen. Recomputed taxable income. Add line twelve and line thirteen. Column (c)
      "form-5870a.0.part1.14_recomputed_taxable_income_col_c": 96547,
      // Line fifteen. Tax on amounts on line fourteen. Column (a)
      "form-5870a.0.part1.15_tax_on_line_14_col_a": 7492,
      // Line fifteen. Tax on amounts on line fourteen. Column (b)
      "form-5870a.0.part1.15_tax_on_line_14_col_b": 6848,
      // Line fifteen. Tax on amounts on line fourteen. Column (c)
      "form-5870a.0.part1.15_tax_on_line_14_col_c": 5977,
      // Line sixteen. Tax before credits on line twelve income. Column (a)
      "form-5870a.0.part1.16_tax_before_credits_col_a": 6325,
      // Line sixteen. Tax before credits on line twelve income. Column (b)
      "form-5870a.0.part1.16_tax_before_credits_col_b": 5681,
      // Line sixteen. Tax before credits on line twelve income. Column (c)
      "form-5870a.0.part1.16_tax_before_credits_col_c": 4814,
      // Line seventeen. Additional tax before credits. Subtract line 16 from line 15 . Column (a)
      "form-5870a.0.part1.17_additional_tax_before_credits_col_a": 1167,
      // Line seventeen. Additional tax before credits. Subtract line 16 from line 15 . Column (b)
      "form-5870a.0.part1.17_additional_tax_before_credits_col_b": 1167,
      // Line seventeen. Additional tax before credits. Subtract line 16 from line 15 . Column (c)
      "form-5870a.0.part1.17_additional_tax_before_credits_col_c": 1163,
      // Line eighteen. Tax credit adjustment. Attach schedule. Column (b)
      "form-5870a.0.part1.18_tax_credit_adjustment_col_b": 200,
      // Line nineteen. See instructions. Column (a)
      "form-5870a.0.part1.19_see_instructions_col_a": 1167,
      // Line nineteen. See instructions. Column (b)
      "form-5870a.0.part1.19_see_instructions_col_b": 967,
      // Line nineteen. See instructions. Column (c)
      "form-5870a.0.part1.19_see_instructions_col_c": 1163,
      // Line twenty. Alternative minimum tax adjustments. Column (c)
      "form-5870a.0.part1.20_amt_adjustments_col_c": 150,
      // Line twenty one. Combine line nineteen and line twenty. Column (a)
      "form-5870a.0.part1.21_combine_lines_19_20_col_a": 1167,
      // Line twenty one. Combine line nineteen and line twenty. Column (b)
      "form-5870a.0.part1.21_combine_lines_19_20_col_b": 967,
      // Line twenty one. Combine line nineteen and line twenty. Column (c)
      "form-5870a.0.part1.21_combine_lines_19_20_col_c": 1313,
      // Line twenty two. Add column (a), column (b), and column (c) of line twenty one
      "form-5870a.0.part1.22_total_line_21_columns": 3447,
      // Line twenty three. Divide the amount on line twenty two by three
      "form-5870a.0.part1.23_line_22_divided_by_3": 1149,
      // Line twenty four. Multiply the amount on line twenty three by the number of taxable years
      "form-5870a.0.part1.24_line_23_times_years": 3447,
      // Line twenty five. Enter the amount from line two
      "form-5870a.0.part1.25_amount_from_line_2": 1140,
      // Line twenty six. Partial tax attributable to the accumulation distribution. Subtract line
      "form-5870a.0.part1.26_partial_tax_accumulation_distribution": 2307,
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
      "form-540.line.12_state_wages": 140000,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040 or 1040-SR, li
      "form-540.line.13_federal_agi": 140000,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 140000,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 140000,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 134294,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 8928,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 153,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 8775,
      // Line 34. Tax. See instructions.
      "form-540.line.34_tax_amount": 2307,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 11082,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 11082,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 11082,
      // Payments. Line 71. California income tax withheld. See instructions.
      "form-540.line.71_ca_income_tax_withheld": 8900,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 8900,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 8900,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 8900,
      // Line 100. Tax due. If line 95 is less than line 64, subtract line 95 from line 64.
      "form-540.line.100_tax_due": 2182,
      // Amount You Owe. Line 111. Amount You Owe. If you do not have an amount on line 99, add lin
      "form-540.line.111_amount_you_owe": 2182,
      // Line 114. Total amount due. See instructions. Enclose, but do not staple, any payment.
      "form-540.line.114_total_amount_due": 2182,
    },
  },
};

export function cennExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
