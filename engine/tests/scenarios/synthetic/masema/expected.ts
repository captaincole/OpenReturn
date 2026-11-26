/*
 * masema — LOCKED expected values, drafted from the engine's
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
  "form-8949": {
    engineFields: {
      // Row 1 — (d) Proceeds (sales price)
      "form-8949.1.part2.row1_proceeds": 6000,
      // Row 1 — (e) Cost or other basis
      "form-8949.1.part2.row1_cost_basis": 15000,
      // Row 1 — (h) Gain or (loss)
      "form-8949.1.part2.row1_gain_loss": -9000,
      // Row 2 — (d) Proceeds (sales price)
      "form-8949.1.part2.row2_proceeds": 9000,
      // Row 2 — (e) Cost or other basis
      "form-8949.1.part2.row2_cost_basis": 5000,
      // Row 2 — (h) Gain or (loss)
      "form-8949.1.part2.row2_gain_loss": 4000,
      // Line 2 Totals — (d) Proceeds (sales price)
      "form-8949.1.part2.totals_proceeds": 15000,
      // Line 2 Totals — (e) Cost or other basis
      "form-8949.1.part2.totals_cost_basis": 20000,
      // Line 2 Totals — (h) Gain or (loss)
      "form-8949.1.part2.totals_gain_loss": -5000,
    },
  },
  "schedule-d": {
    engineFields: {
      // Line 8b — Proceeds (sales price) — Totals for all transactions reported on Form(s) 8949 wi
      "schedule-d.0.line.8b_proceeds": 15000,
      // Line 8b — Cost (or other basis) — Totals for all transactions reported on Form(s) 8949 wit
      "schedule-d.0.line.8b_cost": 20000,
      // Line 8b — Gain or (loss) — Totals for all transactions reported on Form(s) 8949 with Box D
      "schedule-d.0.line.8b_gain_loss": -5000,
      // Line 13 — Capital gain distributions
      "schedule-d.0.line.13_capital_gain_distributions": 600,
      // Line 15 — Net long-term capital gain or (loss). Combine lines 8a through 14 in column (h)
      "schedule-d.0.line.15_net_long_term_gain_loss": -4400,
      // Line 16 — Combine lines 7 and 15 and enter the result
      "schedule-d.1.line.16_combined_gain_loss": -4400,
      // Line 21 — If line 16 is a loss, enter here and on Form 1040, 1040-SR, or 1040-NR, line 7a,
      "schedule-d.1.line.21_allowable_loss": 3000,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 82000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 82000,
      // Line 2b — Taxable interest
      "form-1040.line.2b": 900,
      // Line 3a — Qualified dividends
      "form-1040.line.3a": 1000,
      // Line 3b — Ordinary dividends
      "form-1040.line.3b": 1400,
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": -3000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 81300,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 81300,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 81300,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 65550,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 9271,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 9271,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 9271,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 9271,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 9100,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 9100,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 9100,
      // Line 37 — Amount you owe
      "form-1040.line.37": 171,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Part One. Income Adjustment Schedule. Section A. Income from federal Form 1040 or 1040-SR.
      "schedule-ca.0.line.1a_federal": 82000,
      // Line 1z. Add line 1a through line 1i. Column A. Federal Amounts.
      "schedule-ca.0.line.1z_federal": 82000,
      // Line 2. Taxable interest. Line 2b. Column A. Federal Amounts.
      "schedule-ca.0.line.2b_federal": 900,
      // Line 3. Ordinary dividends. See instructions. Line 3 a.
      "schedule-ca.0.line.3a_federal": 1000,
      // Line 3. Ordinary dividends. Line 3b. Column A. Federal Amounts.
      "schedule-ca.0.line.3b_federal": 1400,
      // Line 7a. Capital gain or (loss). See instructions. Column A. Federal Amounts.
      "schedule-ca.0.line.7a_federal": -3000,
      // Line 9 b1. Disaster loss deduction from form FTB 3805V. Column B. Subtractions.
      "schedule-ca.2.line.b9b1_subtractions": 22000,
      // Line 9 b2. Net operating loss deduction from form FTB 3805V. Column B. Subtractions.
      "schedule-ca.2.line.b9b2_subtractions": 56594,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 81300,
      // Line 10. Column B. Subtractions.
      "schedule-ca.2.line.b10_subtractions": 78594,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 81300,
      // Line 27. Column B. Subtractions.
      "schedule-ca.3.line.c27_subtractions": 78594,
      // Line 30. Enter the larger of the amount on line 29 or your standard deduction shown below:
      "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 5706,
    },
  },
  "form-3805v": {
    engineFields: {
      // Part I, Section A, Line 1. Adjusted gross income from 2025 Form 540, line 17. If negative,
      "form-3805v.0.part1.1_adjusted_gross_income": 2706,
      // Line 2. Itemized deductions or standard deduction from 2025 Form 540, line 18.
      "form-3805v.0.part1.2_itemized_or_standard_deduction": 5706,
      // Line 3a. Combine line 1 and line 2. (Estates and Trusts, enter taxable income, see instruc
      "form-3805v.0.part1.3a_agi_less_deductions": -3000,
      // Line 3c. Combine line 3a and line 3b. If negative, use brackets and continue to line 4. If
      "form-3805v.0.part1.3c_loss_without_disaster_loss": -3000,
      // Line 4. Nonbusiness capital losses.
      "form-3805v.0.part1.4_nonbusiness_capital_losses": 9000,
      // Line 5. Nonbusiness capital gains.
      "form-3805v.0.part1.5_nonbusiness_capital_gains": 4600,
      // Line 6. If line 4 is more than line 5, enter the difference; otherwise, enter 0.
      "form-3805v.0.part1.6_nonbusiness_capital_loss_excess": 4400,
      // Line 8. Nonbusiness deductions. See instructions.
      "form-3805v.0.part1.8_nonbusiness_deductions": 5706,
      // Line 9. Nonbusiness income other than capital gains. See instructions.
      "form-3805v.0.part1.9_nonbusiness_income_other": 2300,
      // Line 10. Add line 7 and line 9.
      "form-3805v.0.part1.10_nonbusiness_income_total": 2300,
      // Line 11. If line 8 is more than line 10, enter the difference; otherwise, enter 0.
      "form-3805v.0.part1.11_nonbusiness_deductions_excess": 3406,
      // Line 17. Add line 6 and line 16.
      "form-3805v.0.part1.17_capital_loss_excess_total": 4400,
      // Line 18. Enter the loss, if any, from Schedule D (540), line 8. Estates and Trusts, enter
      "form-3805v.0.part1.18_schedule_d_line_8_loss": 4400,
      // Line 19. Enter the loss, if any, from Schedule D (540), line 9. Estates and Trusts, enter
      "form-3805v.0.part1.19_schedule_d_line_9_loss": 3000,
      // Line 20. If line 18 is more than line 19, enter the difference; otherwise, enter 0.
      "form-3805v.0.part1.20_line_18_over_line_19": 1400,
      // Line 22. Subtract line 20 from line 17. If zero or less, enter 0.
      "form-3805v.0.part1.22_capital_loss_adjustment": 3000,
      // Line 23. N O L and disaster loss carryovers from prior years. See instructions.
      "form-3805v.0.part1.23_prior_year_nol_carryovers": 78594,
      // Line 24. Add lines 11, 21, 22, and 23.
      "form-3805v.0.part1.24_total_adjustments": 85000,
      // Part II, Line 1. Taxable income. See instructions.
      "form-3805v.2.part2.1_taxable_income": -3000,
      // Line 2. Capital loss deduction included in line 1.
      "form-3805v.2.part2.2_capital_loss_deduction": 3000,
      // Line 3. Disaster loss carryover included in line 1.
      "form-3805v.2.part2.3_disaster_loss_carryover": 22000,
      // Line 4. N O L carryover included in line 1.
      "form-3805v.2.part2.4_nol_carryover": 56594,
      // Line 6. M T I. Combine line 1 through line 5. If line 6 is zero or less, enter 0.
      "form-3805v.2.part2.6_modified_taxable_income": 78594,
      // Part III, Line 1. MT I from Part II, line 6. If your net business income is $1,000,000 or
      "form-3805v.2.part3.1_mti_available_balance_col_g": 78594,
      // Line 2. (d) Initial loss (1).
      "form-3805v.2.part3.2_row1_col_d": 40000,
      // Line 2. (e) Carryover from 2024 (1).
      "form-3805v.2.part3.2_row1_col_e": 22000,
      // Line 2. (f) Amount used in 2025 (1).
      "form-3805v.2.part3.2_row1_col_f": 22000,
      // Line 2. (g) Available balance (1).
      "form-3805v.2.part3.2_row1_col_g": 56594,
      // Line 2. (d) Initial loss (2).
      "form-3805v.2.part3.2_row2_col_d": 95000,
      // Line 2. (e) Carryover from 2024 (2).
      "form-3805v.2.part3.2_row2_col_e": 68000,
      // Line 2. (f) Amount used in 2025 (2).
      "form-3805v.2.part3.2_row2_col_f": 56594,
      // Line 2. (h) Carryover to 2026 column (e) minus column (f) (2).
      "form-3805v.2.part3.2_row2_col_h": 11406,
      // Line 5. N O L carryover. Add the carryover amounts in column (h) that are not the result o
      "form-3805v.2.part3.5_nol_carryover": 11406,
      // Verified zeros (added by hand): no current year NOL, the disaster loss used in full.
      "form-3805v.0.part1.7_nonbusiness_capital_gain_excess": 0,
      "form-3805v.0.part1.12_nonbusiness_income_excess": 0,
      "form-3805v.0.part1.16_business_capital_loss_excess": 0,
      "form-3805v.0.part1.21_line_19_over_line_18": 0,
      "form-3805v.0.part1.25_current_year_nol": 0,
      "form-3805v.2.part2.5_itemized_deduction_adjustments": 0,
      "form-3805v.2.part3.2_row1_col_h": 0,
      "form-3805v.2.part3.2_row2_col_g": 0,
      "form-3805v.2.part3.6_disaster_loss_carryover": 0,
    },
    renderedText: {
      // Rows earliest first: the 2018 disaster loss, then the 2020 general NOL.
      "form-3805v.2.part3.2_row1_col_a": "2018",
      "form-3805v.2.part3.2_row1_col_b": "107",
      "form-3805v.2.part3.2_row1_col_c": "DIS",
      "form-3805v.2.part3.2_row2_col_a": "2020",
      "form-3805v.2.part3.2_row2_col_c": "GEN",
      // "If negative, use brackets."
      "form-3805v.0.part1.3a_agi_less_deductions": "(3,000)",
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
      "form-540.line.12_state_wages": 82000,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040 or 1040-SR, li
      "form-540.line.13_federal_agi": 81300,
      // Line 14. California adjustments – subtractions. Enter the amount from Schedule CA (540), P
      "form-540.line.14_ca_adjustments_subtractions": 78594,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 2706,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 2706,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 5706,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 153,
      // Payments. Line 71. California income tax withheld. See instructions.
      "form-540.line.71_ca_income_tax_withheld": 2900,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 2900,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 2900,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 2900,
      // Line 97. Overpaid tax. If line 95 is more than line 64, subtract line 64 from line 95.
      "form-540.line.97_overpaid_tax": 2900,
      // Line 99. Overpaid tax available this year. Subtract line 98 from line 97.
      "form-540.line.99_overpaid_tax_available": 2900,
      // Refund and Direct Deposit. Line 115. Refund or no amount due. Subtract the sum of line 110
      "form-540.line.115_refund_or_no_amount_due": 2900,
    },
  },
};

export function masemaExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
