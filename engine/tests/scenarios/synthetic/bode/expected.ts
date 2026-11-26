/*
 * bode — LOCKED expected values, drafted from the engine's
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
  "form-8959": {
    engineFields: {
      // Line 1 — Medicare wages and tips from Form W-2, box 5
      "form-8959.0.line.1_medicare_wages_tips": 1150000,
      // Line 4 — Add lines 1 through 3
      "form-8959.0.line.4_total_medicare_wages": 1150000,
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 200000,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-8959.0.line.6_excess_medicare_wages": 950000,
      // Line 7 — Additional Medicare Tax on Medicare wages. Multiply line 6 by 0.9% (0.009)
      "form-8959.0.line.7_additional_medicare_tax_wages": 8550,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 8550,
      // Line 19 — Medicare tax withheld from Form W-2, box 6
      "form-8959.0.line.19_medicare_tax_withheld": 25225,
      // Line 20 — Enter the amount from line 1
      "form-8959.0.line.20_medicare_wages_from_line1": 1150000,
      // Line 21 — Multiply line 20 by 1.45% (0.0145). Regular Medicare tax withholding on Medicare
      "form-8959.0.line.21_regular_medicare_tax_on_wages": 16675,
      // Line 22 — Subtract line 21 from line 19. If zero or less, enter -0-. Additional Medicare T
      "form-8959.0.line.22_additional_medicare_tax_withholding_wages": 8550,
      // Line 24 — Total Additional Medicare Tax withholding. Add lines 22 and 23
      "form-8959.0.line.24_total_additional_medicare_tax_withholding": 8550,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 8550,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 8550,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 1150000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 1150000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 1150000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 1150000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 1150000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 1134250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 376693,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 376693,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 376693,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 8550,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 385243,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 372000,
      // Line 25c — Federal income tax withheld from other forms (see instructions)
      "form-1040.line.25c": 8550,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 380550,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 380550,
      // Line 37 — Amount you owe
      "form-1040.line.37": 4693,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Part One. Income Adjustment Schedule. Section A. Income from federal Form 1040 or 1040-SR.
      "schedule-ca.0.line.1a_federal": 1150000,
      // Line 1z. Add line 1a through line 1i. Column A. Federal Amounts.
      "schedule-ca.0.line.1z_federal": 1150000,
      // Line 8z. Column C. Additions.
      "schedule-ca.1.line.b8z_additions": 50000,
      // Line 9 a. Column C. Additions.
      "schedule-ca.2.line.b9a_additions": 50000,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 1150000,
      // Line 10. Column C. Additions.
      "schedule-ca.2.line.b10_additions": 50000,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 1150000,
      // Line 27. Column C. Additions.
      "schedule-ca.3.line.c27_additions": 50000,
      // Line 30. Enter the larger of the amount on line 29 or your standard deduction shown below:
      "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 5706,
    },
  },
  "form-5870a": {
    engineFields: {
      // Enter number of trusts from which you received accumulation distributions in this taxable
      "form-5870a.0.header.number_of_trusts": 1,
      // Part Two. Section A. Line one. Income accumulated over five taxable years or more. Enter d
      "form-5870a.1.part2a.1_income_accumulated_five_or_more": 300000,
      // Line two. Divide line one by six. Enter here and on Schedules CA (540), Part one, Section
      "form-5870a.1.part2a.2_line_1_divided_by_six": 50000,
      // Line four. Enter your taxable income before this distribution for the five immediately pre
      "form-5870a.1.part2a.4_taxable_income_before_distribution_col_a": 985000,
      // Line four. Enter your taxable income before this distribution for the five immediately pre
      "form-5870a.1.part2a.4_taxable_income_before_distribution_col_b": 1060000,
      // Line four. Enter your taxable income before this distribution for the five immediately pre
      "form-5870a.1.part2a.4_taxable_income_before_distribution_col_c": 640000,
      // Line four. Enter your taxable income before this distribution for the five immediately pre
      "form-5870a.1.part2a.4_taxable_income_before_distribution_col_d": 410000,
      // Line five. Enter the amount from line two in column (a) through column (e) if the distribu
      "form-5870a.1.part2a.5_distribution_amount_col_a": 50000,
      // Line five. Enter the amount from line two in column (a) through column (e) if the distribu
      "form-5870a.1.part2a.5_distribution_amount_col_b": 50000,
      // Line five. Enter the amount from line two in column (a) through column (e) if the distribu
      "form-5870a.1.part2a.5_distribution_amount_col_c": 50000,
      // Line five. Enter the amount from line two in column (a) through column (e) if the distribu
      "form-5870a.1.part2a.5_distribution_amount_col_d": 50000,
      // Line six. Recomputed taxable income. Add line four and line five. Column (a). 2024
      "form-5870a.1.part2a.6_recomputed_taxable_income_col_a": 1035000,
      // Line six. Recomputed taxable income. Add line four and line five. Column (b). 2023
      "form-5870a.1.part2a.6_recomputed_taxable_income_col_b": 1110000,
      // Line six. Recomputed taxable income. Add line four and line five. Column (c). 2022
      "form-5870a.1.part2a.6_recomputed_taxable_income_col_c": 690000,
      // Line six. Recomputed taxable income. Add line four and line five. Column (d). 2021
      "form-5870a.1.part2a.6_recomputed_taxable_income_col_d": 460000,
      // Line seven. Tax on amounts on line six. Column (a). 2024
      "form-5870a.1.part2a.7_tax_on_recomputed_income_col_a": 108700,
      // Line seven. Tax on amounts on line six. Column (b). 2023
      "form-5870a.1.part2a.7_tax_on_recomputed_income_col_b": 118519,
      // Line seven. Tax on amounts on line six. Column (c). 2022
      "form-5870a.1.part2a.7_tax_on_recomputed_income_col_c": 67401,
      // Line seven. Tax on amounts on line six. Column (d). 2021
      "form-5870a.1.part2a.7_tax_on_recomputed_income_col_d": 42103,
      // Line eight. Tax before credits on line four income. Column (a). 2024
      "form-5870a.1.part2a.8_tax_before_credits_col_a": 102550,
      // Line eight. Tax before credits on line four income. Column (b). 2023
      "form-5870a.1.part2a.8_tax_before_credits_col_b": 112369,
      // Line eight. Tax before credits on line four income. Column (c). 2022
      "form-5870a.1.part2a.8_tax_before_credits_col_c": 61623,
      // Line eight. Tax before credits on line four income. Column (d). 2021
      "form-5870a.1.part2a.8_tax_before_credits_col_d": 36453,
      // Line nine. Additional tax before credits. Subtract line eight from line seven. Column (a).
      "form-5870a.1.part2a.9_additional_tax_before_credits_col_a": 6150,
      // Line nine. Additional tax before credits. Subtract line eight from line seven. Column (b).
      "form-5870a.1.part2a.9_additional_tax_before_credits_col_b": 6150,
      // Line nine. Additional tax before credits. Subtract line eight from line seven. Column (c).
      "form-5870a.1.part2a.9_additional_tax_before_credits_col_c": 5778,
      // Line nine. Additional tax before credits. Subtract line eight from line seven. Column (d).
      "form-5870a.1.part2a.9_additional_tax_before_credits_col_d": 5650,
      // Line ten. Tax credit adjustment. Attach schedule. Column (d). 2021
      "form-5870a.1.part2a.10_tax_credit_adjustment_col_d": 300,
      // Line eleven. Subtract line ten from line nine. See instructions. Column (a). 2024
      "form-5870a.1.part2a.11_additional_tax_after_credits_col_a": 6150,
      // Line eleven. Subtract line ten from line nine. See instructions. Column (b). 2023
      "form-5870a.1.part2a.11_additional_tax_after_credits_col_b": 6150,
      // Line eleven. Subtract line ten from line nine. See instructions. Column (c). 2022
      "form-5870a.1.part2a.11_additional_tax_after_credits_col_c": 5778,
      // Line eleven. Subtract line ten from line nine. See instructions. Column (d). 2021
      "form-5870a.1.part2a.11_additional_tax_after_credits_col_d": 5350,
      // Line twelve. Alternative minimum tax adjustments. Column (c). 2022
      "form-5870a.1.part2a.12_amt_adjustments_col_c": -350,
      // Line thirteen. Add line eleven and line twelve. Column (a). 2024
      "form-5870a.1.part2a.13_additional_tax_with_amt_col_a": 6150,
      // Line thirteen. Add line eleven and line twelve. Column (b). 2023
      "form-5870a.1.part2a.13_additional_tax_with_amt_col_b": 6150,
      // Line thirteen. Add line eleven and line twelve. Column (c). 2022
      "form-5870a.1.part2a.13_additional_tax_with_amt_col_c": 5428,
      // Line thirteen. Add line eleven and line twelve. Column (d). 2021
      "form-5870a.1.part2a.13_additional_tax_with_amt_col_d": 5350,
      // Line fourteen. Add line thirteen, column (a) through column (e) for all taxable years that
      "form-5870a.1.part2a.14_total_additional_tax": 23078,
      // Line one. Enter the recomputed taxable income from Part two, Section A, line six. Column (
      "form-5870a.2.part3_section_a.1_recomputed_taxable_income_col_a": 1035000,
      // Line one. Enter the recomputed taxable income from Part two, Section A, line six. Column (
      "form-5870a.2.part3_section_a.1_recomputed_taxable_income_col_b": 1110000,
      // Line one. Enter the recomputed taxable income from Part two, Section A, line six. Column (
      "form-5870a.2.part3_section_a.1_recomputed_taxable_income_col_c": 690000,
      // Line one. Enter the recomputed taxable income from Part two, Section A, line six. Column (
      "form-5870a.2.part3_section_a.1_recomputed_taxable_income_col_d": 460000,
      // Line two. Subtract 1,000,000 from line one. If zero or less, enter zero. Column (a)
      "form-5870a.2.part3_section_a.2_income_over_1000000_col_a": 35000,
      // Line two. Subtract 1,000,000 from line one. If zero or less, enter zero. Column (b)
      "form-5870a.2.part3_section_a.2_income_over_1000000_col_b": 110000,
      // Line three. Multiply line two by one percent. Column (a)
      "form-5870a.2.part3_section_a.3_one_percent_tax_col_a": 350,
      // Line three. Multiply line two by one percent. Column (b)
      "form-5870a.2.part3_section_a.3_one_percent_tax_col_b": 1100,
      // Line four. Behavioral Health Services Tax paid on taxable income before distribution. Colu
      "form-5870a.2.part3_section_a.4_bhst_paid_before_distribution_col_b": 600,
      // Line five. Subtract line four from line three. Column (a)
      "form-5870a.2.part3_section_a.5_additional_bhst_col_a": 350,
      // Line five. Subtract line four from line three. Column (b)
      "form-5870a.2.part3_section_a.5_additional_bhst_col_b": 500,
      // Line six. Add line five, columns (a) through (e). Enter here and on Form 540, line sixty t
      "form-5870a.2.part3_section_a.6_total_bhst": 850,
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
      "form-540.line.12_state_wages": 1150000,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040 or 1040-SR, li
      "form-540.line.13_federal_agi": 1150000,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 1150000,
      // Line 16. California adjustments – additions. Enter the amount from Schedule CA (540), Part
      "form-540.line.16_ca_adjustments_additions": 50000,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 1200000,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 1194294,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 127735,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 127735,
      // Line 34. Tax. See instructions.
      "form-540.line.34_tax_amount": 23078,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 150813,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 150813,
      // Line 62. Behavioral Health Services Tax. See instructions.
      "form-540.line.62_behavioral_health_services_tax": 2793,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 153606,
      // Payments. Line 71. California income tax withheld. See instructions.
      "form-540.line.71_ca_income_tax_withheld": 118000,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 118000,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 118000,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 118000,
      // Line 100. Tax due. If line 95 is less than line 64, subtract line 95 from line 64.
      "form-540.line.100_tax_due": 35606,
      // Amount You Owe. Line 111. Amount You Owe. If you do not have an amount on line 99, add lin
      "form-540.line.111_amount_you_owe": 35606,
      // Line 114. Total amount due. See instructions. Enclose, but do not staple, any payment.
      "form-540.line.114_total_amount_due": 35606,
    },
  },
};

export function bodeExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
