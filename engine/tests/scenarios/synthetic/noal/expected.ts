/*
 * noal — LOCKED expected values, drafted from the engine's
 * output on 2026-11-24 (scripts/draftExpected.ts).
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
      "schedule-e.0.line.3_rents_received_a": 18000,
      // Line 3 — Rents received (Property B)
      "schedule-e.0.line.3_rents_received_b": 14400,
      // Line 4 — Royalties received (Property C)
      "schedule-e.0.line.4_royalties_received_c": 6000,
      // Line 9 — Insurance (Property A)
      "schedule-e.0.line.9_insurance_a": 1200,
      // Line 9 — Insurance (Property B)
      "schedule-e.0.line.9_insurance_b": 700,
      // Line 10 — Legal and other professional fees (Property C)
      "schedule-e.0.line.10_legal_professional_fees_c": 1000,
      // Line 11 — Management fees (Property A)
      "schedule-e.0.line.11_management_fees_a": 1800,
      // Line 12 — Mortgage interest paid to banks, etc. (Property A)
      "schedule-e.0.line.12_mortgage_interest_a": 9000,
      // Line 12 — Mortgage interest paid to banks, etc. (Property B)
      "schedule-e.0.line.12_mortgage_interest_b": 4000,
      // Line 14 — Repairs (Property A)
      "schedule-e.0.line.14_repairs_a": 2400,
      // Line 16 — Taxes (Property A)
      "schedule-e.0.line.16_taxes_a": 3200,
      // Line 16 — Taxes (Property B)
      "schedule-e.0.line.16_taxes_b": 2100,
      // Line 18 — Depreciation expense or depletion (Property A)
      "schedule-e.0.line.18_depreciation_or_depletion_a": 9500,
      // Line 18 — Depreciation expense or depletion (Property B)
      "schedule-e.0.line.18_depreciation_or_depletion_b": 3000,
      // Line 20 — Total expenses. Add lines 5 through 19 (Property A)
      "schedule-e.0.line.20_total_expenses_a": 27100,
      // Line 20 — Total expenses. Add lines 5 through 19 (Property B)
      "schedule-e.0.line.20_total_expenses_b": 9800,
      // Line 20 — Total expenses. Add lines 5 through 19 (Property C)
      "schedule-e.0.line.20_total_expenses_c": 1000,
      // Line 21 — Subtract line 20 from line 3 (rents) and/or 4 (royalties) (Property A)
      "schedule-e.0.line.21_income_or_loss_a": -9100,
      // Line 21 — Subtract line 20 from line 3 (rents) and/or 4 (royalties) (Property B)
      "schedule-e.0.line.21_income_or_loss_b": 4600,
      // Line 21 — Subtract line 20 from line 3 (rents) and/or 4 (royalties) (Property C)
      "schedule-e.0.line.21_income_or_loss_c": 5000,
      // Line 22 — Deductible rental real estate loss after limitation, if any, on Form 8582 (Prope
      "schedule-e.0.line.22_deductible_loss_a": 13100,
      // Line 22 — Deductible rental real estate loss after limitation, if any, on Form 8582 (Prope
      "schedule-e.0.line.22_deductible_loss_b": 2500,
      // Line 23a — Total of all amounts reported on line 3 for all rental properties
      "schedule-e.0.line.23a_total_rents": 32400,
      // Line 23b — Total of all amounts reported on line 4 for all royalty properties
      "schedule-e.0.line.23b_total_royalties": 6000,
      // Line 23c — Total of all amounts reported on line 12 for all properties
      "schedule-e.0.line.23c_total_mortgage_interest": 13000,
      // Line 23d — Total of all amounts reported on line 18 for all properties
      "schedule-e.0.line.23d_total_depreciation": 12500,
      // Line 23e — Total of all amounts reported on line 20 for all properties
      "schedule-e.0.line.23e_total_expenses": 37900,
      // Line 24 — Income. Add positive amounts shown on line 21. Do not include any losses
      "schedule-e.0.line.24_income": 9600,
      // Line 25 — Losses. Add royalty losses from line 21 and rental real estate losses from line
      "schedule-e.0.line.25_losses": 15600,
      // Line 26 — Total rental real estate and royalty income or (loss). Combine lines 24 and 25
      "schedule-e.0.line.26_total_income_or_loss": -6000,
      // Line 41 — Total income or (loss). Combine lines 26, 32, 37, 39, and 40
      "schedule-e.1.line.41_total_income_or_loss": -6000,
    },
  },
  "form-8582": {
    engineFields: {
      // Line 1a — Rental real estate activities with active participation: activities with net inc
      "form-8582.0.line.1a_rental_net_income": 4600,
      // Line 1b — Rental real estate activities with active participation: activities with net los
      "form-8582.0.line.1b_rental_net_loss": 9100,
      // Line 1c — Rental real estate activities with active participation: prior years' unallowed
      "form-8582.0.line.1c_rental_prior_unallowed": 2500,
      // Line 1d — Combine lines 1a, 1b, and 1c
      "form-8582.0.line.1d_rental_combined": -7000,
      // Line 2a — All other passive activities: activities with net income (enter the amount from
      "form-8582.0.line.2a_other_net_income": 5000,
      // Line 2c — All other passive activities: prior years' unallowed losses (enter the amount fr
      "form-8582.0.line.2c_other_prior_unallowed": 10000,
      // Line 2d — Combine lines 2a, 2b, and 2c
      "form-8582.0.line.2d_other_combined": -5000,
      // Line 3 — Combine lines 1d and 2d and subtract any prior year unallowed CRD
      "form-8582.0.line.3_combined": -12000,
      // Line 4 — Enter the smaller of the loss on line 1d or the loss on line 3
      "form-8582.0.line.4_smaller_loss_1d_or_3": 7000,
      // Line 5 — Enter $150,000. If married filing separately, see instructions
      "form-8582.0.line.5_allowance_threshold": 150000,
      // Line 6 — Enter modified adjusted gross income, but not less than zero
      "form-8582.0.line.6_modified_agi": 138000,
      // Line 7 — Subtract line 6 from line 5
      "form-8582.0.line.7_line5_minus_line6": 12000,
      // Line 8 — Multiply line 7 by 50% (0.50). Do not enter more than $25,000
      "form-8582.0.line.8_half_of_line7": 6000,
      // Line 9 — Enter the smaller of line 4 or line 8
      "form-8582.0.line.9_special_allowance": 6000,
      // Line 10 — Add the income, if any, on lines 1a and 2a and enter the total
      "form-8582.0.line.10_income_lines_1a_2a": 9600,
      // Line 11 — Total losses allowed from all passive activities for 2025. Add lines 9 and 10
      "form-8582.0.line.11_total_losses_allowed": 15600,
      // Part IV Row 1 — (b) Current year net loss (line 1b)
      "form-8582.0.part4.row_1_col_b_net_loss": 9100,
      // Part IV Row 1 — (e) Overall loss
      "form-8582.0.part4.row_1_col_e_loss": 9100,
      // Part IV Row 2 — (a) Current year net income (line 1a)
      "form-8582.0.part4.row_2_col_a_net_income": 4600,
      // Part IV Row 2 — (c) Prior years unallowed loss (line 1c)
      "form-8582.0.part4.row_2_col_c_unallowed_loss": 2500,
      // Part IV Row 2 — (d) Overall gain
      "form-8582.0.part4.row_2_col_d_gain": 2100,
      // Part IV Total — (a) Current year net income (line 1a)
      "form-8582.0.part4.total_col_a_net_income": 4600,
      // Part IV Total — (b) Current year net loss (line 1b)
      "form-8582.0.part4.total_col_b_net_loss": 9100,
      // Part IV Total — (c) Prior years unallowed loss (line 1c)
      "form-8582.0.part4.total_col_c_unallowed_loss": 2500,
      // Part V, row 1 — (c) Prior years unallowed loss (line 2c)
      "form-8582.1.part5.row_1_col_c_unallowed_loss": 10000,
      // Part V, row 1 — (e) Overall loss
      "form-8582.1.part5.row_1_col_e_loss": 10000,
      // Part V, row 2 — (a) Current year net income (line 2a)
      "form-8582.1.part5.row_2_col_a_net_income": 5000,
      // Part V, row 2 — (d) Overall gain
      "form-8582.1.part5.row_2_col_d_gain": 5000,
      // Part V total — (a) Current year net income (line 2a)
      "form-8582.1.part5.total_col_a_net_income": 5000,
      // Part V total — (c) Prior years unallowed loss (line 2c)
      "form-8582.1.part5.total_col_c_unallowed_loss": 10000,
      // Part VI, row 1 — (a) Loss
      "form-8582.1.part6.row_1_col_a_loss": 9100,
      // Part VI, row 1 — (c) Special allowance
      "form-8582.1.part6.row_1_col_c_special_allowance": 6000,
      // Part VI, row 1 — (d) Subtract column (c) from column (a)
      "form-8582.1.part6.row_1_col_d_subtract": 3100,
      // Part VI total — (a) Loss
      "form-8582.1.part6.total_col_a_loss": 9100,
      // Part VI total — (c) Special allowance
      "form-8582.1.part6.total_col_c_special_allowance": 6000,
      // Part VI total — (d) Subtract column (c) from column (a)
      "form-8582.1.part6.total_col_d_subtract": 3100,
      // Part VII, row 1 — (a) Loss
      "form-8582.1.part7.row_1_col_a_loss": 13100,
      // Part VII, row 1 — (c) Unallowed loss
      "form-8582.1.part7.row_1_col_c_unallowed_loss": 6000,
      // Part VII total — (a) Loss
      "form-8582.1.part7.total_col_a_loss": 13100,
      // Part VII total — (c) Unallowed loss
      "form-8582.1.part7.total_col_c_unallowed_loss": 6000,
      // Part VIII, row 1 — (a) Loss
      "form-8582.1.part8.row_1_col_a_loss": 19100,
      // Part VIII, row 1 — (b) Unallowed loss
      "form-8582.1.part8.row_1_col_b_unallowed_loss": 6000,
      // Part VIII, row 1 — (c) Allowed loss
      "form-8582.1.part8.row_1_col_c_allowed_loss": 13100,
      // Part VIII total — (a) Loss
      "form-8582.1.part8.total_col_a_loss": 19100,
      // Part VIII total — (b) Unallowed loss
      "form-8582.1.part8.total_col_b_unallowed_loss": 6000,
      // Part VIII total — (c) Allowed loss
      "form-8582.1.part8.total_col_c_allowed_loss": 13100,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 5 — Rental real estate, royalties, partnerships, S corporations, trusts, etc. Attach
      "schedule-1.0.line.5": -6000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": -6000,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 138000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 138000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": -6000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 132000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 132000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 132000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 31500,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 31500,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 100500,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 11938,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 11938,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 11938,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 11938,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 13800,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 13800,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 13800,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 1862,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 1862,
    },
  },
  "form-3885a": {
    engineFields: {
      // Line 5 . California depreciation for assets placed in service prior to 2025.
      "form-3885a.0.line.5_prior_year_depreciation": 8000,
      // Line 6 . Total California depreciation from this activity. Add the amounts on line 2, line
      "form-3885a.0.line.6_total_california_depreciation": 8000,
      // Line 7 . Total federal depreciation from this activity. Enter depreciation from federal Fo
      "form-3885a.0.line.7_federal_depreciation": 9500,
      // Line 8 b. If line 6 is less than line 7, enter the difference here and see instructions.
      "form-3885a.0.line.8b_california_less": 1500,
    },
  },
  "form-3801": {
    engineFields: {
      // Part one. 2025 Passive Activity Loss. Rental Real Estate Activities with Active Participat
      "form-3801.0.line.1a_rental_real_estate_net_income": 4600,
      // Line 1 b. Activities with net loss from Part four, column (b).
      "form-3801.0.line.1b_rental_real_estate_net_loss": 7600,
      // Line 1 c. Prior year unallowed losses from Part four, column (c).
      "form-3801.0.line.1c_rental_real_estate_prior_unallowed_losses": 2500,
      // Line 1 d. Combine line 1 a, line 1 b, and line 1 c.
      "form-3801.0.line.1d_rental_real_estate_combined": -5500,
      // All Other Passive Activities. Line 2 a. Activities with net income from Part five, column
      "form-3801.0.line.2a_other_passive_net_income": 5000,
      // Line 2 c. Prior year unallowed losses from Part five, column (c).
      "form-3801.0.line.2c_other_passive_prior_unallowed_losses": 9000,
      // Line 2 d. Combine line 2 a, line 2 b, and line 2 c.
      "form-3801.0.line.2d_other_passive_combined": -4000,
      // Line 3. Combine line 1 d and line 2 d. If the result is net income or zero, see the instru
      "form-3801.0.line.3_total_passive_income_or_loss": -9500,
      // Part two. Special Allowance for Rental Real Estate Activities with Active Participation. L
      "form-3801.0.line.4_smaller_of_1d_or_3_loss": 5500,
      // Line 5. Enter $150,000. If married/Registered Domestic Partner filing a separate tax retur
      "form-3801.0.line.5_special_allowance_income_limit": 150000,
      // Line 6. Enter federal modified adjusted gross income, but not less than zero. See instruct
      "form-3801.0.line.6_federal_modified_agi": 138000,
      // Line 7. Subtract line 6 from line 5.
      "form-3801.0.line.7_limit_minus_modified_agi": 12000,
      // Line 8. Multiply line 7 by 50% (.50). Do not enter more than $25,000.
      "form-3801.0.line.8_half_of_line_7": 6000,
      // Line 9. Enter the smaller of line 4 or line 8.
      "form-3801.0.line.9_special_allowance": 5500,
      // Part three. Total Losses Allowed. Line 10. Add the income, if any, from line 1 a and line
      "form-3801.0.line.10_passive_income_total": 9600,
      // Line 11. Total losses allowed from all passive activities for 2025. Add line 9 and line 10
      "form-3801.0.line.11_total_losses_allowed": 15100,
      // Row 1. Column (d) Federal Amount. Enter your current year federal net income (loss) before
      "form-3801.1.passive_worksheet.row1_federal_amount_col_d": -9100,
      // Row 1. Column (e). California Adjustment. Enter any adjustment resulting from differences
      "form-3801.1.passive_worksheet.row1_california_adjustment_col_e": 1500,
      // Row 1. Column (f). California Amount. Combine column (d) and column (e).
      "form-3801.1.passive_worksheet.row1_california_amount_col_f": -7600,
      // Row 2. Column (d) Federal Amount. Enter your current year federal net income (loss) before
      "form-3801.1.passive_worksheet.row2_federal_amount_col_d": 4600,
      // Row 2. Column (f). California Amount. Combine column (d) and column (e).
      "form-3801.1.passive_worksheet.row2_california_amount_col_f": 4600,
      // Row 3. Column (d) Federal Amount. Enter your current year federal net income (loss) before
      "form-3801.1.passive_worksheet.row3_federal_amount_col_d": 5000,
      // Row 3. Column (f). California Amount. Combine column (d) and column (e).
      "form-3801.1.passive_worksheet.row3_california_amount_col_f": 5000,
      // Row 1. Column (c). California Amount.
      "form-3801.1.adjustment_worksheet.schedule_e_row1_california_amount_col_c": -12600,
      // Row 1. Column (d). Federal Amount.
      "form-3801.1.adjustment_worksheet.schedule_e_row1_federal_amount_col_d": -13100,
      // Row 2. Column (c). California Amount.
      "form-3801.1.adjustment_worksheet.schedule_e_row2_california_amount_col_c": 2100,
      // Row 2. Column (d). Federal Amount.
      "form-3801.1.adjustment_worksheet.schedule_e_row2_federal_amount_col_d": 2100,
      // Row 3. Column (c). California Amount.
      "form-3801.1.adjustment_worksheet.schedule_e_row3_california_amount_col_c": 5000,
      // Row 3. Column (d). Federal Amount.
      "form-3801.1.adjustment_worksheet.schedule_e_row3_federal_amount_col_d": 5000,
      // Row 8. Total. Column (c). California Amount. Line 2(c).
      "form-3801.1.adjustment_worksheet.2c_schedule_e_total_california_amount": -5500,
      // Row 8. Total. Column (d). Federal Amount. Line 2(d).**
      "form-3801.1.adjustment_worksheet.2d_schedule_e_total_federal_amount": -6000,
      // Row 8. Total. Column (e). California Adjustment. Line 2 (e). If the amount is positive, tr
      "form-3801.1.adjustment_worksheet.2e_schedule_e_california_adjustment": 500,
      // Row 1. Current year. Column (b). Net loss (line 1 b).
      "form-3801.2.part4.row1_col_b_net_loss": 7600,
      // Row 1. Overall gain or loss. Column (e). Loss.
      "form-3801.2.part4.row1_col_e_overall_loss": 7600,
      // Row 2. Current year. Column (a). Net income (line 1 a).
      "form-3801.2.part4.row2_col_a_net_income": 4600,
      // Row 2. Prior year. Column (c). Unallowed loss (line 1 c).
      "form-3801.2.part4.row2_col_c_prior_unallowed_loss": 2500,
      // Row 2. Overall gain or loss. Column (d). Gain.
      "form-3801.2.part4.row2_col_d_overall_gain": 2100,
      // Row 6. Total. Enter on Part one, line 1 a, line 1 b, and line 1 c. Current year. Column (a
      "form-3801.2.part4.total_col_a_net_income": 4600,
      // Row 6. Total. Enter on Part one, line 1a, line 1 b, and line 1 c. Current year. Column (b)
      "form-3801.2.part4.total_col_b_net_loss": 7600,
      // Row 6. Total. Enter on Part one, line 1 a, line 1 b, and line 1 c. Prior year. Column (c).
      "form-3801.2.part4.total_col_c_prior_unallowed_loss": 2500,
      // Row 1. Prior year. Column (c). Unallowed loss (line 2 c).
      "form-3801.2.part5.row1_col_c_prior_unallowed_loss": 9000,
      // Row 1. Overall gain or loss. Column (e). Loss.
      "form-3801.2.part5.row1_col_e_overall_loss": 9000,
      // Row 2. Current year. Column (a). Net income (line 2 a).
      "form-3801.2.part5.row2_col_a_net_income": 5000,
      // Row 2. Overall gain or loss. Column (d). Gain.
      "form-3801.2.part5.row2_col_d_overall_gain": 5000,
      // Row 6. Total. Enter on Part one, line 2 a, line 2 b, and line 2 c. Current year. Column (a
      "form-3801.2.part5.total_col_a_net_income": 5000,
      // Row 6. Total. Enter on Part one, line 2 a, line 2 b, and line 2 c. Prior year. Column (c).
      "form-3801.2.part5.total_col_c_prior_unallowed_loss": 9000,
      // Row 1. Column (a). Loss.
      "form-3801.2.part6.row1_col_a_loss": 7600,
      // Row 1. Column (c). Special allowance.
      "form-3801.2.part6.row1_col_c_special_allowance": 5500,
      // Row 1. Column (d). Subtract column (c) from column (a).
      "form-3801.2.part6.row1_col_d_loss_less_allowance": 2100,
      // Row 6. Total. Column (a). Loss.
      "form-3801.2.part6.total_col_a_loss": 7600,
      // Row 6. Total. Column (c). Special allowance.
      "form-3801.2.part6.total_col_c_special_allowance": 5500,
      // Row 6. Total. Column (d). Subtract column (c) from column (a).
      "form-3801.2.part6.total_col_d_loss_less_allowance": 2100,
      // Row 1. Column (a). Loss.
      "form-3801.2.part7.row1_col_a_loss": 11100,
      // Row 1. Column (c). Unallowed loss.
      "form-3801.2.part7.row1_col_c_unallowed_loss": 4000,
      // Row 7. Total. Column (a). Loss.
      "form-3801.2.part7.total_col_a_loss": 11100,
      // Row 7. Total. Column (c). Unallowed loss.
      "form-3801.2.part7.total_col_c_unallowed_loss": 4000,
      // Row 1. Column (a). Loss.
      "form-3801.2.part8.row1_col_a_loss": 16600,
      // Row 1. Column (b). Unallowed loss.
      "form-3801.2.part8.row1_col_b_unallowed_loss": 4000,
      // Row 1. Column (c). Allowed loss.
      "form-3801.2.part8.row1_col_c_allowed_loss": 12600,
      // Row 6. Total. Column (a). Loss.
      "form-3801.2.part8.total_col_a_loss": 16600,
      // Row 6. Total. Column (b). Unallowed loss.
      "form-3801.2.part8.total_col_b_unallowed_loss": 4000,
      // Row 6. Total. Column (c). Allowed loss.
      "form-3801.2.part8.total_col_c_allowed_loss": 12600,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Part One. Income Adjustment Schedule. Section A. Income from federal Form 1040 or 1040-SR.
      "schedule-ca.0.line.1a_federal": 138000,
      // Line 1z. Add line 1a through line 1i. Column A. Federal Amounts.
      "schedule-ca.0.line.1z_federal": 138000,
      // Line 5. Rental real estate, royalties, partnerships, S corporations, trusts, etcetera. Col
      "schedule-ca.0.line.b5_federal": -6000,
      // Line 5. Column C. Additions.
      "schedule-ca.0.line.b5_additions": 500,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 132000,
      // Line 10. Column C. Additions.
      "schedule-ca.2.line.b10_additions": 500,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 132000,
      // Line 27. Column C. Additions.
      "schedule-ca.3.line.c27_additions": 500,
      // Line 30. Enter the larger of the amount on line 29 or your standard deduction shown below:
      "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 11412,
    },
  },
  "form-540": {
    engineFields: {
      // Exemptions. For line 7, line 8, line 9, and line 10: Multiply the number you enter in the
      "form-540.line.7_personal_exemption_count": 2,
      // Multiply the number you put in the line 7 box by $153. Enter this number into this field.
      "form-540.line.7_personal_exemption_amount": 306,
      // Line 11. Exemption amount: Add line 7 through line 10. Transfer this amount to line 32. Wh
      "form-540.line.11_total_exemption_amount": 306,
      // Taxable Income. Line 12. State wages from your federal Form or Forms W-2, box 16 .
      "form-540.line.12_state_wages": 138000,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040 or 1040-SR, li
      "form-540.line.13_federal_agi": 132000,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 132000,
      // Line 16. California adjustments – additions. Enter the amount from Schedule CA (540), Part
      "form-540.line.16_ca_adjustments_additions": 500,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 132500,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 11412,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 121088,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 4455,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 306,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 4149,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 4149,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 4149,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 4149,
      // Payments. Line 71. California income tax withheld. See instructions.
      "form-540.line.71_ca_income_tax_withheld": 6000,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 6000,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 6000,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 6000,
      // Line 97. Overpaid tax. If line 95 is more than line 64, subtract line 64 from line 95.
      "form-540.line.97_overpaid_tax": 1851,
      // Line 99. Overpaid tax available this year. Subtract line 98 from line 97.
      "form-540.line.99_overpaid_tax_available": 1851,
      // Refund and Direct Deposit. Line 115. Refund or no amount due. Subtract the sum of line 110
      "form-540.line.115_refund_or_no_amount_due": 1851,
    },
  },
};

export function noalExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
