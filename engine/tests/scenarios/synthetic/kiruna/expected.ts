/*
 * kiruna — LOCKED expected values, drafted from the engine's
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
  "schedule-e": {
    engineFields: {
      // Line 2 — Fair Rental Days (Property A)
      "schedule-e.0.line.2_fair_rental_days_a": 365,
      // Line 2 — Fair Rental Days (Property B)
      "schedule-e.0.line.2_fair_rental_days_b": 365,
      // Line 3 — Rents received (Property A)
      "schedule-e.0.line.3_rents_received_a": 42000,
      // Line 3 — Rents received (Property B)
      "schedule-e.0.line.3_rents_received_b": 18000,
      // Line 9 — Insurance (Property A)
      "schedule-e.0.line.9_insurance_a": 1800,
      // Line 9 — Insurance (Property B)
      "schedule-e.0.line.9_insurance_b": 1500,
      // Line 12 — Mortgage interest paid to banks, etc. (Property A)
      "schedule-e.0.line.12_mortgage_interest_a": 6000,
      // Line 12 — Mortgage interest paid to banks, etc. (Property B)
      "schedule-e.0.line.12_mortgage_interest_b": 14000,
      // Line 14 — Repairs (Property A)
      "schedule-e.0.line.14_repairs_a": 1400,
      // Line 14 — Repairs (Property B)
      "schedule-e.0.line.14_repairs_b": 2500,
      // Line 16 — Taxes (Property A)
      "schedule-e.0.line.16_taxes_a": 4800,
      // Line 16 — Taxes (Property B)
      "schedule-e.0.line.16_taxes_b": 6000,
      // Line 20 — Total expenses. Add lines 5 through 19 (Property A)
      "schedule-e.0.line.20_total_expenses_a": 14000,
      // Line 20 — Total expenses. Add lines 5 through 19 (Property B)
      "schedule-e.0.line.20_total_expenses_b": 24000,
      // Line 21 — Subtract line 20 from line 3 (rents) and/or 4 (royalties) (Property A)
      "schedule-e.0.line.21_income_or_loss_a": 28000,
      // Line 21 — Subtract line 20 from line 3 (rents) and/or 4 (royalties) (Property B)
      "schedule-e.0.line.21_income_or_loss_b": -6000,
      // Line 22 — Deductible rental real estate loss after limitation, if any, on Form 8582 (Prope
      "schedule-e.0.line.22_deductible_loss_b": 6000,
      // Line 23a — Total of all amounts reported on line 3 for all rental properties
      "schedule-e.0.line.23a_total_rents": 60000,
      // Line 23c — Total of all amounts reported on line 12 for all properties
      "schedule-e.0.line.23c_total_mortgage_interest": 20000,
      // Line 23e — Total of all amounts reported on line 20 for all properties
      "schedule-e.0.line.23e_total_expenses": 38000,
      // Line 24 — Income. Add positive amounts shown on line 21. Do not include any losses
      "schedule-e.0.line.24_income": 28000,
      // Line 25 — Losses. Add royalty losses from line 21 and rental real estate losses from line
      "schedule-e.0.line.25_losses": 6000,
      // Line 26 — Total rental real estate and royalty income or (loss). Combine lines 24 and 25
      "schedule-e.0.line.26_total_income_or_loss": 22000,
      // Line 41 — Total income or (loss). Combine lines 26, 32, 37, 39, and 40
      "schedule-e.1.line.41_total_income_or_loss": 22000,
    },
  },
  "form-8582": {
    engineFields: {
      // Line 1a — Rental real estate activities with active participation: activities with net inc
      "form-8582.0.line.1a_rental_net_income": 28000,
      // Line 1b — Rental real estate activities with active participation: activities with net los
      "form-8582.0.line.1b_rental_net_loss": 6000,
      // Line 1d — Combine lines 1a, 1b, and 1c
      "form-8582.0.line.1d_rental_combined": 22000,
      // Line 3 — Combine lines 1d and 2d and subtract any prior year unallowed CRD
      "form-8582.0.line.3_combined": 22000,
      // Part IV Row 1 — (a) Current year net income (line 1a)
      "form-8582.0.part4.row_1_col_a_net_income": 28000,
      // Part IV Row 1 — (d) Overall gain
      "form-8582.0.part4.row_1_col_d_gain": 28000,
      // Part IV Row 2 — (b) Current year net loss (line 1b)
      "form-8582.0.part4.row_2_col_b_net_loss": 6000,
      // Part IV Row 2 — (e) Overall loss
      "form-8582.0.part4.row_2_col_e_loss": 6000,
      // Part IV Total — (a) Current year net income (line 1a)
      "form-8582.0.part4.total_col_a_net_income": 28000,
      // Part IV Total — (b) Current year net loss (line 1b)
      "form-8582.0.part4.total_col_b_net_loss": 6000,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 5 — Rental real estate, royalties, partnerships, S corporations, trusts, etc. Attach
      "schedule-1.0.line.5": 22000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 22000,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 118000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 118000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 22000,
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
      "form-1040.line.25a": 15200,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 15200,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 15200,
      // Line 37 — Amount you owe
      "form-1040.line.37": 7467,
    },
  },
  "form-3801": {
    engineFields: {
      // Part one. 2025 Passive Activity Loss. Rental Real Estate Activities with Active Participat
      "form-3801.0.line.1a_rental_real_estate_net_income": 28000,
      // Line 1 b. Activities with net loss from Part four, column (b).
      "form-3801.0.line.1b_rental_real_estate_net_loss": 6000,
      // Line 1 d. Combine line 1 a, line 1 b, and line 1 c.
      "form-3801.0.line.1d_rental_real_estate_combined": 22000,
      // Line 3. Combine line 1 d and line 2 d. If the result is net income or zero, see the instru
      "form-3801.0.line.3_total_passive_income_or_loss": 22000,
      // Row 1. Column (d) Federal Amount. Enter your current year federal net income (loss) before
      "form-3801.1.passive_worksheet.row1_federal_amount_col_d": 28000,
      // Row 1. Column (f). California Amount. Combine column (d) and column (e).
      "form-3801.1.passive_worksheet.row1_california_amount_col_f": 28000,
      // Row 2. Column (d) Federal Amount. Enter your current year federal net income (loss) before
      "form-3801.1.passive_worksheet.row2_federal_amount_col_d": -6000,
      // Row 2. Column (f). California Amount. Combine column (d) and column (e).
      "form-3801.1.passive_worksheet.row2_california_amount_col_f": -6000,
      // Row 1. Column (c). California Amount.
      "form-3801.1.adjustment_worksheet.schedule_e_row1_california_amount_col_c": 28000,
      // Row 1. Column (d). Federal Amount.
      "form-3801.1.adjustment_worksheet.schedule_e_row1_federal_amount_col_d": 28000,
      // Row 2. Column (c). California Amount.
      "form-3801.1.adjustment_worksheet.schedule_e_row2_california_amount_col_c": -6000,
      // Row 2. Column (d). Federal Amount.
      "form-3801.1.adjustment_worksheet.schedule_e_row2_federal_amount_col_d": -6000,
      // Row 8. Total. Column (c). California Amount. Line 2(c).
      "form-3801.1.adjustment_worksheet.2c_schedule_e_total_california_amount": 22000,
      // Row 8. Total. Column (d). Federal Amount. Line 2(d).**
      "form-3801.1.adjustment_worksheet.2d_schedule_e_total_federal_amount": 22000,
      // Row 1. Current year. Column (a). Net income (line 1 a).
      "form-3801.2.part4.row1_col_a_net_income": 28000,
      // Row 1. Overall gain or loss. Column (d). Gain.
      "form-3801.2.part4.row1_col_d_overall_gain": 28000,
      // Row 2. Current year. Column (b). Net loss (line 1 b).
      "form-3801.2.part4.row2_col_b_net_loss": 6000,
      // Row 2. Overall gain or loss. Column (e). Loss.
      "form-3801.2.part4.row2_col_e_overall_loss": 6000,
      // Row 6. Total. Enter on Part one, line 1 a, line 1 b, and line 1 c. Current year. Column (a
      "form-3801.2.part4.total_col_a_net_income": 28000,
      // Row 6. Total. Enter on Part one, line 1a, line 1 b, and line 1 c. Current year. Column (b)
      "form-3801.2.part4.total_col_b_net_loss": 6000,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Part One. Income Adjustment Schedule. Section A. Income from federal Form 1040 or 1040-SR.
      "schedule-ca.0.line.1a_federal": 118000,
      // Line 1z. Add line 1a through line 1i. Column A. Federal Amounts.
      "schedule-ca.0.line.1z_federal": 118000,
      // Line 5. Rental real estate, royalties, partnerships, S corporations, trusts, etcetera. Col
      "schedule-ca.0.line.b5_federal": 22000,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 140000,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 140000,
      // Line 30. Enter the larger of the amount on line 29 or your standard deduction shown below:
      "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 5706,
    },
  },
  "schedule-p": {
    engineFields: {
      // Part 1 . Line 1 . If you itemized deductions, go to line 2 . If you did not itemize deduct
      "schedule-p.0.line.1_standard_deduction": 5706,
      // Line 14 . Total Adjustments and Preferences. Combine line 1 through line 13 .
      "schedule-p.0.line.14_total_adjustments_preferences": 5706,
      // Line 15 . Enter taxable income from Form 540, line 19 . See instructions.
      "schedule-p.0.line.15_taxable_income": 134294,
      // Line 19 . Combine line 14 through line 18 .
      "schedule-p.1.line.19_combine_lines_14_through_18": 140000,
      // Line 21 . Alternative Minimum Taxable Income. Subtract line 20 from line 19 (if married/Re
      "schedule-p.1.line.21_alternative_minimum_taxable_income": 140000,
      // Part 2 . Line 22 . Exemption Amount. (If this schedule is for a certain child under age 24
      "schedule-p.1.line.22_exemption_amount": 92749,
      // Line 23 . Subtract line 22 from line 21 . If zero or less, enter 0 . See instructions.
      "schedule-p.1.line.23_amti_less_exemption": 47251,
      // Line 24 . Tentative Minimum Tax. Multiply line 23 by 7.0% (.07)
      "schedule-p.1.line.24_tentative_minimum_tax": 3308,
      // Line 25 . Regular tax before credits from Form 540, line 31 .
      "schedule-p.1.line.25_regular_tax_before_credits": 8928,
      // Part 3 . Line 1 . Enter the amount from Form 540, line 35 .
      "schedule-p.1.part3.1_tax_from_form_540_line_35": 8775,
      // Line 2 . Enter the tentative minimum tax from Part 2, line 24 .
      "schedule-p.1.part3.2_tentative_minimum_tax": 3308,
      // Section A. Line 3 . Subtract line 2 from line 1 . If zero or less enter 0 and see instruct
      "schedule-p.1.part3.3_excess_tax_offset_by_credits_col_c": 5467,
      // Section B. Line 11 . If Part 3, line 3 is zero, enter the amount from line 1 . If line 3 i
      "schedule-p.2.part3.11_tax_balance_col_c": 8775,
      // Line 16 . Column A. Credit amount.
      "schedule-p.3.part3.16_credit_amount_col_a": 2133,
      // Line 16 . Column B*. Credit used this year. *If the taxpayer is subject to the business cr
      "schedule-p.3.part3.16_credit_used_col_b": 2133,
      // Line 16 . Column C. Tax balance that may be offset by credits.
      "schedule-p.3.part3.16_tax_balance_col_c": 6642,
      // Line 17 . Column A. Credit amount.
      "schedule-p.3.part3.17_credit_amount_col_a": 378,
      // Line 17 . Column B*. Credit used this year. *If the taxpayer is subject to the business cr
      "schedule-p.3.part3.17_credit_used_col_b": 378,
      // Line 17 . Column C. Tax balance that may be offset by credits.
      "schedule-p.3.part3.17_tax_balance_col_c": 6264,
      // Line 18 . Column A. Credit amount.
      "schedule-p.3.part3.18_credit_amount_col_a": 5500,
      // Line 18 . Column B*. Credit used this year. *If the taxpayer is subject to the business cr
      "schedule-p.3.part3.18_credit_used_col_b": 5500,
      // Line 18 . Column C. Tax balance that may be offset by credits.
      "schedule-p.3.part3.18_tax_balance_col_c": 764,
    },
  },
  "form-3801-cr": {
    engineFields: {
      // Part I, Line 1a. Credits from federal Worksheet 1, column (a).
      "form-3801-cr.0.line.1a_rental_real_estate_credits": 1200,
      // Line 1b. Prior year unallowed credits from federal Worksheet 1, column (b).
      "form-3801-cr.0.line.1b_rental_real_estate_prior_unallowed": 300,
      // Line 1c. Add line 1a and line 1b.
      "form-3801-cr.0.line.1c_rental_real_estate_total": 1500,
      // Line 3a. Credits from federal Worksheet 3, column (a).
      "form-3801-cr.0.line.3a_housing_post_1989_credits": 4000,
      // Line 3b. Prior year unallowed credits from federal Worksheet 3, column (b).
      "form-3801-cr.0.line.3b_housing_post_1989_prior_unallowed": 1500,
      // Line 3c. Add line 3a and line 3b.
      "form-3801-cr.0.line.3c_housing_post_1989_total": 5500,
      // Line 4a. Credits from federal Worksheet 4, column (a).
      "form-3801-cr.0.line.4a_other_passive_credits": 2500,
      // Line 4b. Prior year unallowed credits from federal Worksheet 4, column (b).
      "form-3801-cr.0.line.4b_other_passive_prior_unallowed": 800,
      // Line 4c. Add line 4a and line 4b.
      "form-3801-cr.0.line.4c_other_passive_total": 3300,
      // Line 5. Add line 1c, line 2c, line 3c, and line 4c.
      "form-3801-cr.0.line.5_total_passive_credits": 10300,
      // Line 6. Enter the tax attributable to net passive income. See instructions.
      "form-3801-cr.0.line.6_tax_on_net_passive_income": 2046,
      // Line 7. Subtract line 6 from line 5. If line 6 is more than or equal to line 5, enter 0. S
      "form-3801-cr.0.line.7_credits_over_passive_tax": 8254,
      // Part II, Line 8. Enter the smaller of line 1c or line 7.
      "form-3801-cr.0.line.8_smaller_of_1c_or_7": 1500,
      // Line 9. Enter $150,000 ($75,000 if married/R D P filing a separate return and you lived ap
      "form-3801-cr.0.line.9_special_allowance_income_limit": 150000,
      // Line 10. Enter federal modified adjusted gross income, but not less than zero. See instruc
      "form-3801-cr.0.line.10_federal_modified_agi": 140000,
      // Line 11. Subtract line 10 from line 9.
      "form-3801-cr.0.line.11_limit_minus_modified_agi": 10000,
      // Line 12. Multiply line 11 by 50% (.50). Do not enter more than $25,000 ($12,500 if married
      "form-3801-cr.0.line.12_half_of_line_11": 5000,
      // Line 14. Subtract line 13 from line 12.
      "form-3801-cr.0.line.14_remaining_special_allowance": 5000,
      // Line 15. Enter the tax attributable to the amount on line 14. See instructions.
      "form-3801-cr.0.line.15_tax_on_line_14_amount": 465,
      // Line 16. Enter the smaller of line 8 or line 15.
      "form-3801-cr.0.line.16_smaller_of_8_or_15": 465,
      // Part III, Line 17. Passive Activity Credits Allowed. Add line 6 and line 16. See instructi
      "form-3801-cr.1.line.17_passive_activity_credits_allowed": 8011,
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
      "form-540.line.12_state_wages": 118000,
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
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 8775,
      // Line 45. To claim more than two credits, see instructions. Attach Schedule P (540).
      "form-540.line.45_schedule_p_credits": 8011,
      // Line 47. Add line 40 through line 46. These are your total credits.
      "form-540.line.47_total_credits": 8011,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 764,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 764,
      // Payments. Line 71. California income tax withheld. See instructions.
      "form-540.line.71_ca_income_tax_withheld": 7400,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 7400,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 7400,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 7400,
      // Line 97. Overpaid tax. If line 95 is more than line 64, subtract line 64 from line 95.
      "form-540.line.97_overpaid_tax": 6636,
      // Line 99. Overpaid tax available this year. Subtract line 98 from line 97.
      "form-540.line.99_overpaid_tax_available": 6636,
      // Refund and Direct Deposit. Line 115. Refund or no amount due. Subtract the sum of line 110
      "form-540.line.115_refund_or_no_amount_due": 6636,
    },
  },
};

export function kirunaExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
