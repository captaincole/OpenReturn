/*
 * tuon — LOCKED expected values, drafted from the engine's
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
  "schedule-b": {
    engineFields: {
      // Line 1 — Amount (row 1)
      "schedule-b.0.line.1_amount_1": 8400,
      // Line 2 — Add the amounts on line 1
      "schedule-b.0.line.2_total_interest": 8400,
      // Line 4 — Subtract line 3 from line 2. Enter the result here and on Form 1040 or 1040-SR, l
      "schedule-b.0.line.4_taxable_interest": 8400,
    },
  },
  "schedule-1-a": {
    engineFields: {
      // Line 1 — Enter the amount from Form 1040, 1040-SR, or 1040-NR, line 11b
      "schedule-1-a.0.line.1_agi_form_1040": 60400,
      // Line 3 — Add lines 1 and 2e
      "schedule-1-a.0.line.3_modified_agi": 60400,
      // Line 31 — Enter the amount from line 3
      "schedule-1-a.1.line.31_magi_from_line_3": 60400,
      // Line 32 — Enter $75,000 ($150,000 if married filing jointly)
      "schedule-1-a.1.line.32_senior_threshold": 75000,
      // Line 33 — Subtract line 32 from line 31. If zero or less, enter $6,000 on line 35
      "schedule-1-a.1.line.33_magi_over_threshold": -14600,
      // Line 35 — Subtract line 34 from $6,000. If zero or less, enter -0-
      "schedule-1-a.1.line.35_senior_amount_per_person": 6000,
      // Line 36a — If you have a valid social security number and were born before January 2, 1961
      "schedule-1-a.1.line.36a_senior_deduction_you": 6000,
      // Line 37 — Enhanced deduction for seniors. Add lines 36a and 36b
      "schedule-1-a.1.line.37_enhanced_senior_deduction": 6000,
      // Line 38 — Add lines 13, 21, 30, and 37
      "schedule-1-a.1.line.38_total_additional_deductions": 6000,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 2b — Taxable interest
      "form-1040.line.2b": 8400,
      // Line 5a — Pensions and annuities
      "form-1040.line.5a": 60000,
      // Line 5b — Taxable amount
      "form-1040.line.5b": 52000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 60400,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 60400,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 60400,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 17750,
      // Line 13b — Additional deductions from Schedule 1-A, line 38
      "form-1040.line.13b": 6000,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 23750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 36650,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 4163,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 4163,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 4163,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 4163,
      // Line 25b — Federal income tax withheld from Form(s) 1099
      "form-1040.line.25b": 5200,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 5200,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 5200,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 1037,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 1037,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Line 2. Taxable interest. Line 2b. Column A. Federal Amounts.
      "schedule-ca.0.line.2b_federal": 8400,
      // Line 5. Pensions and annuities. See instructions. Line 5 a.
      "schedule-ca.0.line.5a_federal": 60000,
      // Line 5. Pensions and annuities. Line 5b. Column A. Federal Amounts.
      "schedule-ca.0.line.5b_federal": 52000,
      // Line 5b. Column B. Subtractions.
      "schedule-ca.0.line.5b_subtractions": 52000,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 60400,
      // Line 10. Column B. Subtractions.
      "schedule-ca.2.line.b10_subtractions": 52000,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 60400,
      // Line 27. Column B. Subtractions.
      "schedule-ca.3.line.c27_subtractions": 52000,
      // Line 30. Enter the larger of the amount on line 29 or your standard deduction shown below:
      "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 5706,
    },
  },
  "schedule-g-1": {
    engineFields: {
      // Part II, Line 6. Capital gain from federal Form 1099-R, box 3. If you are taking the death
      "schedule-g-1.0.line.6_capital_gain_1099r_box_3": 6000,
      // Line 7. Multiply line 6 by 5.5% (.055) and enter here. If you elect to use Part III, go to
      "schedule-g-1.0.line.7_capital_gain_election_tax": 330,
      // Part III, Line 8. If you completed Part II, enter the amount from federal Form 1099-R, box
      "schedule-g-1.0.line.8_ordinary_income_1099r_box_2a": 46000,
      // Line 10. Total taxable amount. Subtract line 9 from line 8.
      "schedule-g-1.0.line.10_total_taxable_amount": 46000,
      // Line 11. Current actuarial value of annuity, if applicable, from federal Form 1099-R, box
      "schedule-g-1.0.line.11_actuarial_value_of_annuity": 12000,
      // Line 12. Adjusted total taxable amount. Add line 10 and line 11. If this amount is $70,000
      "schedule-g-1.0.line.12_adjusted_total_taxable_amount": 58000,
      // Line 13. Multiply line 12 by 50% (.50), but do not enter more than $10,000.
      "schedule-g-1.0.line.13_half_of_line_12": 10000,
      // Line 14. Subtract $20,000 from line 12 and enter the difference. If the result is zero or
      "schedule-g-1.0.line.14_line_12_over_20000": 38000,
      // Line 15. Multiply line 14 by 20% (.20).
      "schedule-g-1.0.line.15_twenty_percent_of_line_14": 7600,
      // Line 16. Minimum distribution allowance. Subtract line 15 from line 13.
      "schedule-g-1.0.line.16_minimum_distribution_allowance": 2400,
      // Line 17. Subtract line 16 from line 12.
      "schedule-g-1.0.line.17_amount_after_allowance": 55600,
      // Line 18. Multiply line 17 by 10% (.10).
      "schedule-g-1.0.line.18_ten_percent_of_line_17": 5560,
      // Line 19. Tax on amount on line 18. Use the Tax Rate Schedule in the instructions.
      "schedule-g-1.0.line.19_tax_on_line_18": 76,
      // Line 20. Multiply line 19 by ten (10). If line 11 is blank, skip line 21 through line 26 a
      "schedule-g-1.0.line.20_ten_times_line_19": 760,
      // Line 22. Multiply line 16 by the decimal amount on line 21.
      "schedule-g-1.0.line.22_allowance_for_annuity": 497,
      // Line 23. Subtract line 22 from line 11.
      "schedule-g-1.0.line.23_annuity_after_allowance": 11503,
      // Line 24. Multiply line 23 by 10% (.10).
      "schedule-g-1.0.line.24_ten_percent_of_line_23": 1150,
      // Line 25. Tax on amount on line 24. Use the Tax Rate Schedule in the instructions.
      "schedule-g-1.0.line.25_tax_on_line_24": 12,
      // Line 26. Multiply line 25 by ten (10).
      "schedule-g-1.0.line.26_ten_times_line_25": 120,
      // Line 27. Subtract line 26 from line 20.
      "schedule-g-1.0.line.27_ten_year_averaging_tax": 640,
      // Line 28. Tax on lump-sum distribution. Add Part II, line 7 and Part III, line 27. Enter he
      "schedule-g-1.0.line.28_tax_on_lump_sum_distribution": 970,
    },
    renderedText: { "schedule-g-1.0.line.21_annuity_ratio": "0.207" },
    renderedBlank: ["schedule-g-1.0.line.9_death_benefit_exclusion"],
    renderedChecked: [
      "schedule-g-1.0.line.1_entire_balance_distribution",
      "schedule-g-1.0.line.4_participant_five_years",
    ],
  },
  "form-540": {
    engineFields: {
      // Exemptions. For line 7, line 8, line 9, and line 10: Multiply the number you enter in the
      "form-540.line.7_personal_exemption_count": 1,
      // Multiply the number you put in the line 7 box by $153. Enter this number into this field.
      "form-540.line.7_personal_exemption_amount": 153,
      // Line 9. Senior: If you (or your spouse / R D P) are 65 or older, enter 1; if both are 65 o
      "form-540.line.9_senior_exemption_count": 1,
      // Multiply the number you put in the line 9 box by $153. Enter this number into this field.
      "form-540.line.9_senior_exemption_amount": 153,
      // Line 11. Exemption amount: Add line 7 through line 10. Transfer this amount to line 32. Wh
      "form-540.line.11_total_exemption_amount": 306,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040 or 1040-SR, li
      "form-540.line.13_federal_agi": 60400,
      // Line 14. California adjustments – subtractions. Enter the amount from Schedule CA (540), P
      "form-540.line.14_ca_adjustments_subtractions": 52000,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 8400,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 8400,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 2694,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 27,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 306,
      // Line 34. Tax. See instructions.
      "form-540.line.34_tax_amount": 970,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 970,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 970,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 970,
      // Payments. Line 71. California income tax withheld. See instructions.
      "form-540.line.71_ca_income_tax_withheld": 1200,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 1200,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 1200,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 1200,
      // Line 97. Overpaid tax. If line 95 is more than line 64, subtract line 64 from line 95.
      "form-540.line.97_overpaid_tax": 230,
      // Line 99. Overpaid tax available this year. Subtract line 98 from line 97.
      "form-540.line.99_overpaid_tax_available": 230,
      // Refund and Direct Deposit. Line 115. Refund or no amount due. Subtract the sum of line 110
      "form-540.line.115_refund_or_no_amount_due": 230,
    },
    renderedChecked: ["form-540.line.34_tax_from_schedule_g1"],
  },
};

export function tuonExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
