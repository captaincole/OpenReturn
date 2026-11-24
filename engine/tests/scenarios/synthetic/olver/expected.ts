/*
 * olver — LOCKED expected values, drafted from the engine's
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
      // Line 2 — Fair Rental Days (Property C)
      "schedule-e.0.line.2_fair_rental_days_c": 365,
      // Line 3 — Rents received (Property A)
      "schedule-e.0.line.3_rents_received_a": 30000,
      // Line 3 — Rents received (Property B)
      "schedule-e.0.line.3_rents_received_b": 9600,
      // Line 3 — Rents received (Property C)
      "schedule-e.0.line.3_rents_received_c": 8000,
      // Line 9 — Insurance (Property A)
      "schedule-e.0.line.9_insurance_a": 1500,
      // Line 9 — Insurance (Property B)
      "schedule-e.0.line.9_insurance_b": 900,
      // Line 9 — Insurance (Property C)
      "schedule-e.0.line.9_insurance_c": 1000,
      // Line 12 — Mortgage interest paid to banks, etc. (Property A)
      "schedule-e.0.line.12_mortgage_interest_a": 9000,
      // Line 12 — Mortgage interest paid to banks, etc. (Property B)
      "schedule-e.0.line.12_mortgage_interest_b": 6000,
      // Line 14 — Repairs (Property A)
      "schedule-e.0.line.14_repairs_a": 1000,
      // Line 16 — Taxes (Property A)
      "schedule-e.0.line.16_taxes_a": 4500,
      // Line 16 — Taxes (Property B)
      "schedule-e.0.line.16_taxes_b": 2400,
      // Line 16 — Taxes (Property C)
      "schedule-e.0.line.16_taxes_c": 1000,
      // Line 18 — Depreciation expense or depletion (Property A)
      "schedule-e.0.line.18_depreciation_or_depletion_a": 2000,
      // Line 18 — Depreciation expense or depletion (Property B)
      "schedule-e.0.line.18_depreciation_or_depletion_b": 4000,
      // Line 20 — Total expenses. Add lines 5 through 19 (Property A)
      "schedule-e.0.line.20_total_expenses_a": 18000,
      // Line 20 — Total expenses. Add lines 5 through 19 (Property B)
      "schedule-e.0.line.20_total_expenses_b": 13300,
      // Line 20 — Total expenses. Add lines 5 through 19 (Property C)
      "schedule-e.0.line.20_total_expenses_c": 2000,
      // Line 21 — Subtract line 20 from line 3 (rents) and/or 4 (royalties) (Property A)
      "schedule-e.0.line.21_income_or_loss_a": 12000,
      // Line 21 — Subtract line 20 from line 3 (rents) and/or 4 (royalties) (Property B)
      "schedule-e.0.line.21_income_or_loss_b": -3700,
      // Line 21 — Subtract line 20 from line 3 (rents) and/or 4 (royalties) (Property C)
      "schedule-e.0.line.21_income_or_loss_c": 6000,
      // Line 22 — Deductible rental real estate loss after limitation, if any, on Form 8582 (Prope
      "schedule-e.0.line.22_deductible_loss_b": 3700,
      // Line 23a — Total of all amounts reported on line 3 for all rental properties
      "schedule-e.0.line.23a_total_rents": 47600,
      // Line 23c — Total of all amounts reported on line 12 for all properties
      "schedule-e.0.line.23c_total_mortgage_interest": 15000,
      // Line 23d — Total of all amounts reported on line 18 for all properties
      "schedule-e.0.line.23d_total_depreciation": 6000,
      // Line 23e — Total of all amounts reported on line 20 for all properties
      "schedule-e.0.line.23e_total_expenses": 33300,
      // Line 24 — Income. Add positive amounts shown on line 21. Do not include any losses
      "schedule-e.0.line.24_income": 18000,
      // Line 25 — Losses. Add royalty losses from line 21 and rental real estate losses from line
      "schedule-e.0.line.25_losses": 3700,
      // Line 26 — Total rental real estate and royalty income or (loss). Combine lines 24 and 25
      "schedule-e.0.line.26_total_income_or_loss": 14300,
      // Line 41 — Total income or (loss). Combine lines 26, 32, 37, 39, and 40
      "schedule-e.1.line.41_total_income_or_loss": 14300,
      // Line 43 — Reconciliation for real estate professionals. If you were a real estate professi
      "schedule-e.1.line.43_real_estate_professional_reconciliation": 14300,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 5 — Rental real estate, royalties, partnerships, S corporations, trusts, etc. Attach
      "schedule-1.0.line.5": 14300,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 14300,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 2b — Taxable interest
      "form-1040.line.2b": 1200,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 14300,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 15500,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 15500,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 15500,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
    },
  },
  "form-3885a": {
    engineFields: {
      // Line 5 . California depreciation for assets placed in service prior to 2025.
      "form-3885a.0.line.5_prior_year_depreciation": 3300,
      // Line 6 . Total California depreciation from this activity. Add the amounts on line 2, line
      "form-3885a.0.line.6_total_california_depreciation": 3300,
      // Line 7 . Total federal depreciation from this activity. Enter depreciation from federal Fo
      "form-3885a.0.line.7_federal_depreciation": 4000,
      // Line 8 b. If line 6 is less than line 7, enter the difference here and see instructions.
      "form-3885a.0.line.8b_california_less": 700,
    },
  },
  "form-3801": {
    engineFields: {
      // Part one. 2025 Passive Activity Loss. Rental Real Estate Activities with Active Participat
      "form-3801.0.line.1a_rental_real_estate_net_income": 12000,
      // Line 1 b. Activities with net loss from Part four, column (b).
      "form-3801.0.line.1b_rental_real_estate_net_loss": 3000,
      // Line 1 c. Prior year unallowed losses from Part four, column (c).
      "form-3801.0.line.1c_rental_real_estate_prior_unallowed_losses": 7000,
      // Line 1 d. Combine line 1 a, line 1 b, and line 1 c.
      "form-3801.0.line.1d_rental_real_estate_combined": 2000,
      // Line 3. Combine line 1 d and line 2 d. If the result is net income or zero, see the instru
      "form-3801.0.line.3_total_passive_income_or_loss": 2000,
      // Row 1. Column (d) Federal Amount. Enter your current year federal net income (loss) before
      "form-3801.1.passive_worksheet.row1_federal_amount_col_d": 12000,
      // Row 1. Column (f). California Amount. Combine column (d) and column (e).
      "form-3801.1.passive_worksheet.row1_california_amount_col_f": 12000,
      // Row 2. Column (d) Federal Amount. Enter your current year federal net income (loss) before
      "form-3801.1.passive_worksheet.row2_federal_amount_col_d": -3700,
      // Row 2. Column (e). California Adjustment. Enter any adjustment resulting from differences
      "form-3801.1.passive_worksheet.row2_california_adjustment_col_e": 700,
      // Row 2. Column (f). California Amount. Combine column (d) and column (e).
      "form-3801.1.passive_worksheet.row2_california_amount_col_f": -3000,
      // Row 1. Column (c). California Amount.
      "form-3801.1.adjustment_worksheet.schedule_e_row1_california_amount_col_c": 5000,
      // Row 1. Column (d). Federal Amount.
      "form-3801.1.adjustment_worksheet.schedule_e_row1_federal_amount_col_d": 12000,
      // Row 2. Column (c). California Amount.
      "form-3801.1.adjustment_worksheet.schedule_e_row2_california_amount_col_c": -3000,
      // Row 2. Column (d). Federal Amount.
      "form-3801.1.adjustment_worksheet.schedule_e_row2_federal_amount_col_d": -3700,
      // Row 3. Column (c). California Amount.
      "form-3801.1.adjustment_worksheet.schedule_e_row3_california_amount_col_c": 6000,
      // Row 3. Column (d). Federal Amount.
      "form-3801.1.adjustment_worksheet.schedule_e_row3_federal_amount_col_d": 6000,
      // Row 8. Total. Column (c). California Amount. Line 2(c).
      "form-3801.1.adjustment_worksheet.2c_schedule_e_total_california_amount": 8000,
      // Row 8. Total. Column (d). Federal Amount. Line 2(d).**
      "form-3801.1.adjustment_worksheet.2d_schedule_e_total_federal_amount": 14300,
      // Row 8. Total. Column (e). California Adjustment. Line 2 (e). If the amount is positive, tr
      "form-3801.1.adjustment_worksheet.2e_schedule_e_california_adjustment": -6300,
      // Row 1. Current year. Column (a). Net income (line 1 a).
      "form-3801.2.part4.row1_col_a_net_income": 12000,
      // Row 1. Prior year. Column (c). Unallowed loss (line 1 c).
      "form-3801.2.part4.row1_col_c_prior_unallowed_loss": 7000,
      // Row 1. Overall gain or loss. Column (d). Gain.
      "form-3801.2.part4.row1_col_d_overall_gain": 5000,
      // Row 2. Current year. Column (b). Net loss (line 1 b).
      "form-3801.2.part4.row2_col_b_net_loss": 3000,
      // Row 2. Overall gain or loss. Column (e). Loss.
      "form-3801.2.part4.row2_col_e_overall_loss": 3000,
      // Row 6. Total. Enter on Part one, line 1 a, line 1 b, and line 1 c. Current year. Column (a
      "form-3801.2.part4.total_col_a_net_income": 12000,
      // Row 6. Total. Enter on Part one, line 1a, line 1 b, and line 1 c. Current year. Column (b)
      "form-3801.2.part4.total_col_b_net_loss": 3000,
      // Row 6. Total. Enter on Part one, line 1 a, line 1 b, and line 1 c. Prior year. Column (c).
      "form-3801.2.part4.total_col_c_prior_unallowed_loss": 7000,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Line 2. Taxable interest. Line 2b. Column A. Federal Amounts.
      "schedule-ca.0.line.2b_federal": 1200,
      // Line 5. Rental real estate, royalties, partnerships, S corporations, trusts, etcetera. Col
      "schedule-ca.0.line.b5_federal": 14300,
      // Line 5. Column B. Subtractions.
      "schedule-ca.0.line.b5_subtractions": 6300,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 15500,
      // Line 10. Column B. Subtractions.
      "schedule-ca.2.line.b10_subtractions": 6300,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 15500,
      // Line 27. Column B. Subtractions.
      "schedule-ca.3.line.c27_subtractions": 6300,
      // Line 30. Enter the larger of the amount on line 29 or your standard deduction shown below:
      "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 5706,
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
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040 or 1040-SR, li
      "form-540.line.13_federal_agi": 15500,
      // Line 14. California adjustments – subtractions. Enter the amount from Schedule CA (540), P
      "form-540.line.14_ca_adjustments_subtractions": 6300,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 9200,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 9200,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 3494,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 35,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 153,
    },
  },
};

export function olverExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
