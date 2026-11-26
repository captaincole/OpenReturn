/*
 * edarra — LOCKED expected values, drafted from the engine's
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
  "schedule-f": {
    engineFields: {
      // Line 9 — Gross income. Add amounts in the right column (lines 1c, 2, 3b, 4b, 5a, 5c, 6b, 6
      "schedule-f.0.line.9_gross_income": 172000,
      // Line 11 — Chemicals
      "schedule-f.0.line.11_chemicals": 18000,
      // Line 24a — Rent or lease: Vehicles, machinery, equipment
      "schedule-f.0.line.24a_rent_vehicles_machinery_equipment": 36000,
      // Line 24b — Rent or lease: Other (land, animals, etc.)
      "schedule-f.0.line.24b_rent_other": 48000,
      // Line 13 — Custom hire (machine work)
      "schedule-f.0.line.13_custom_hire_expense": 12000,
      // Line 25 — Repairs and maintenance
      "schedule-f.0.line.25_repairs_maintenance": 6500,
      // Line 26 — Seeds and plants
      "schedule-f.0.line.26_seeds_plants": 22000,
      // Line 28 — Supplies
      "schedule-f.0.line.28_supplies": 14000,
      // Line 29 — Taxes
      "schedule-f.0.line.29_taxes": 4200,
      // Line 30 — Utilities
      "schedule-f.0.line.30_utilities": 11800,
      // Line 18 — Freight and trucking
      "schedule-f.0.line.18_freight_trucking": 4000,
      // Line 20 — Insurance (other than health)
      "schedule-f.0.line.20_insurance_other_than_health": 9500,
      // Line 22 — Labor hired (less employment credits)
      "schedule-f.0.line.22_labor_hired": 374000,
      // Line 33 — Total expenses. Add lines 10 through 32f
      "schedule-f.0.line.33_total_expenses": 560000,
      // Line 34 — Net farm profit or (loss). Subtract line 33 from line 9
      "schedule-f.0.line.34_net_farm_profit_loss": -340000,
      // Line 37 — Sales of livestock, produce, grains, and other products
      "schedule-f.1.line.37_sales_livestock_produce_accrual": 225000,
      // Line 38a — Cooperative distributions (Form(s) 1099-PATR)
      "schedule-f.1.line.38a_cooperative_distributions_accrual": 2000,
      // Line 38b — Cooperative distributions: taxable amount
      "schedule-f.1.line.38b_cooperative_distributions_taxable_accrual": 2000,
      // Line 39a — Agricultural program payments
      "schedule-f.1.line.39a_agricultural_program_payments_accrual": 6000,
      // Line 39b — Agricultural program payments: taxable amount
      "schedule-f.1.line.39b_agricultural_program_payments_taxable_accrual": 6000,
      // Line 40a — Commodity Credit Corporation (CCC) loans reported under election
      "schedule-f.1.line.40a_ccc_loans_under_election_accrual": 5000,
      // Line 40b — Commodity Credit Corporation (CCC) loans forfeited
      "schedule-f.1.line.40b_ccc_loans_forfeited_accrual": 4000,
      // Line 40c — Commodity Credit Corporation (CCC) loans forfeited: taxable amount
      "schedule-f.1.line.40c_ccc_loans_forfeited_taxable_accrual": 500,
      // Line 41 — Crop insurance proceeds
      "schedule-f.1.line.41_crop_insurance_proceeds_accrual": 9000,
      // Line 42 — Custom hire (machine work) income
      "schedule-f.1.line.42_custom_hire_income_accrual": 3000,
      // Line 43 — Other income
      "schedule-f.1.line.43_other_income_accrual": 1500,
      // Line 44 — Add amounts in the right column for lines 37 through 43 (lines 37, 38b, 39b, 40a
      "schedule-f.1.line.44_total_income_accrual": 252000,
      // Line 45 — Inventory of livestock, produce, grains, and other products at beginning of the
      "schedule-f.1.line.45_inventory_beginning_of_year": 140000,
      // Line 46 — Cost of livestock, produce, grains, and other products purchased during the year
      "schedule-f.1.line.46_cost_products_purchased": 60000,
      // Line 47 — Add lines 45 and 46
      "schedule-f.1.line.47_add_lines_45_46": 200000,
      // Line 48 — Inventory of livestock, produce, grains, and other products at end of year
      "schedule-f.1.line.48_inventory_end_of_year": 120000,
      // Line 49 — Cost of livestock, produce, grains, and other products sold. Subtract line 48 fr
      "schedule-f.1.line.49_cost_products_sold": 80000,
      // Line 50 — Gross income. Subtract line 49 from line 44
      "schedule-f.1.line.50_gross_income_accrual": 172000,
    },
  },
  "form-6198": {
    engineFields: {
      // Line 1 — Ordinary income (loss) from the activity
      "form-6198.0.line.1_ordinary_income_loss": -388000,
      // Line 5 — Current year profit (loss) from the activity. Combine lines 1 through 4
      "form-6198.0.line.5_current_year_profit_loss": -388000,
      // Line 6 — Adjusted basis (as defined in section 1011) in the activity (or in your interest
      "form-6198.0.line.6_adjusted_basis_first_day": 310000,
      // Line 7 — Increases for the tax year
      "form-6198.0.line.7_increases_for_tax_year": 30000,
      // Line 8 — Add lines 6 and 7
      "form-6198.0.line.8_add_lines_6_7": 340000,
      // Line 10a — Subtract line 9 from line 8
      "form-6198.0.line.10a_subtract_line_9_from_8": 340000,
      // Line 10b — If line 10a is more than zero, enter that amount here. Otherwise, enter -0-
      "form-6198.0.line.10b_simplified_amount_at_risk": 340000,
      // Line 20 — Amount at risk. Enter the larger of line 10b or line 19b
      "form-6198.0.line.20_amount_at_risk": 340000,
      // Line 21 — Deductible loss. Enter the smaller of the line 5 loss (treated as a positive num
      "form-6198.0.line.21_deductible_loss": 340000,
    },
  },
  "form-461": {
    engineFields: {
      // Line 6 — Enter amount from Schedule 1 (Form 1040), line 6
      "form-461.0.line.6_schedule_1_line_6": -340000,
      // Line 9 — Combine lines 1 through 8
      "form-461.0.line.9_total_income_loss_items": -340000,
      // Line 14 — Add lines 9 and 13
      "form-461.0.line.14_net_business_income_loss": -340000,
      // Line 15 — Enter $313,000 (or $626,000 if married filing jointly)
      "form-461.0.line.15_threshold_amount": 313000,
      // Line 16 — Add lines 14 and 15
      "form-461.0.line.16_excess_business_loss": -27000,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 6 — Farm income or (loss). Attach Schedule F
      "schedule-1.0.line.6": -340000,
      // Line 8p — Section 461(l) excess business loss adjustment
      "schedule-1.0.line.8p": 27000,
      // Line 9 — Total other income. Add lines 8a through 8z
      "schedule-1.0.line.9": 27000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": -313000,
    },
  },
  "form-8995-a": {
    engineFields: {
      // Line 33 — Taxable income before qualified business income deduction
      "form-8995-a.1.line.33": 91250,
      // Line 35 — Subtract line 34 from line 33. If zero or less, enter -0-
      "form-8995-a.1.line.35": 91250,
      // Line 36 — Income limitation. Multiply line 35 by 20% (0.20)
      "form-8995-a.1.line.36": 18250,
    },
  },
  "form-8995-a-schedule-c": {
    engineFields: {
      // Line 1, row A (a) — Qualified business income/(loss)
      "form-8995-a-schedule-c.0.line.1_col_a_qbi_a": -313000,
      // Line 3 — Total of the trades, businesses, or aggregations losses. Combine the negative amo
      "form-8995-a-schedule-c.0.line.3_total_losses": 313000,
      // Line 6 — Qualified business net (loss) carryforward. Subtract line 5 from line 3. If zero
      "form-8995-a-schedule-c.0.line.6_net_loss_carryforward": 313000,
    },
  },
  "form-8959": {
    engineFields: {
      // Line 1 — Medicare wages and tips from Form W-2, box 5
      "form-8959.0.line.1_medicare_wages_tips": 420000,
      // Line 4 — Add lines 1 through 3
      "form-8959.0.line.4_total_medicare_wages": 420000,
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 200000,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-8959.0.line.6_excess_medicare_wages": 220000,
      // Line 7 — Additional Medicare Tax on Medicare wages. Multiply line 6 by 0.9% (0.009)
      "form-8959.0.line.7_additional_medicare_tax_wages": 1980,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 1980,
      // Line 19 — Medicare tax withheld from Form W-2, box 6
      "form-8959.0.line.19_medicare_tax_withheld": 7830,
      // Line 20 — Enter the amount from line 1
      "form-8959.0.line.20_medicare_wages_from_line1": 420000,
      // Line 21 — Multiply line 20 by 1.45% (0.0145). Regular Medicare tax withholding on Medicare
      "form-8959.0.line.21_regular_medicare_tax_on_wages": 6090,
      // Line 22 — Subtract line 21 from line 19. If zero or less, enter -0-. Additional Medicare T
      "form-8959.0.line.22_additional_medicare_tax_withholding_wages": 1740,
      // Line 24 — Total Additional Medicare Tax withholding. Add lines 22 and 23
      "form-8959.0.line.24_total_additional_medicare_tax_withholding": 1740,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 1980,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 1980,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 420000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 420000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": -313000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 107000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 107000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 107000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 91250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 14995,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 14995,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 14995,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 1980,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 16975,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 98000,
      // Line 25c — Federal income tax withheld from other forms (see instructions)
      "form-1040.line.25c": 1740,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 99740,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 99740,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 82765,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 82765,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Part One. Income Adjustment Schedule. Section A. Income from federal Form 1040 or 1040-SR.
      "schedule-ca.0.line.1a_federal": 420000,
      // Line 1z. Add line 1a through line 1i. Column A. Federal Amounts.
      "schedule-ca.0.line.1z_federal": 420000,
      // Line 6. Farm income or (loss). Column A. Federal Amounts.
      "schedule-ca.0.line.b6_federal": -340000,
      // Line 8p. IRC Section 461( l ) excess business loss adjustment. Column A. Federal Amounts.
      "schedule-ca.1.line.b8p_federal": 27000,
      // Line 8p. Column B. Subtractions.
      "schedule-ca.1.line.b8p_subtractions": 27000,
      // Line 8p. Column C. Additions.
      "schedule-ca.1.line.b8p_additions": 27000,
      // Line 9 a. Total other income. Add line 8a through line 8z. Column A. Federal Amounts.
      "schedule-ca.2.line.b9a_federal": 27000,
      // Line 9 a. Column B. Subtractions.
      "schedule-ca.2.line.b9a_subtractions": 27000,
      // Line 9 a. Column C. Additions.
      "schedule-ca.2.line.b9a_additions": 27000,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 107000,
      // Line 10. Column B. Subtractions.
      "schedule-ca.2.line.b10_subtractions": 27000,
      // Line 10. Column C. Additions.
      "schedule-ca.2.line.b10_additions": 27000,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 107000,
      // Line 27. Column B. Subtractions.
      "schedule-ca.3.line.c27_subtractions": 27000,
      // Line 27. Column C. Additions.
      "schedule-ca.3.line.c27_additions": 27000,
      // Line 30. Enter the larger of the amount on line 29 or your standard deduction shown below:
      "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 5706,
    },
  },
  "form-3461": {
    engineFields: {
      // Line 6. Enter amount from Schedule C A (540), Part I, Section B, line 6, column A minus co
      "form-3461.0.line.6_schedule_ca_section_b_line_6": -340000,
      // Line 9. Combine line 1 through line 8.
      "form-3461.0.line.9_total_income_loss_items": -340000,
      // Line 14a. Add line 9 and line 13.
      "form-3461.0.line.14a_business_income_or_loss": -340000,
      // Line 14c. Total business losses. Add line 14a and line 14b.
      "form-3461.0.line.14c_total_business_losses": -340000,
      // Line 15. Enter $313,000 (or $626,000 if married/R D P filing jointly). See instructions.
      "form-3461.0.line.15_threshold_amount": 313000,
      // Line 16. Add line 14c and line 15. If the result is zero or greater, you do not have exces
      "form-3461.0.line.16_excess_business_loss": -27000,
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
      "form-540.line.12_state_wages": 420000,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040 or 1040-SR, li
      "form-540.line.13_federal_agi": 107000,
      // Line 14. California adjustments – subtractions. Enter the amount from Schedule CA (540), P
      "form-540.line.14_ca_adjustments_subtractions": 27000,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 80000,
      // Line 16. California adjustments – additions. Enter the amount from Schedule CA (540), Part
      "form-540.line.16_ca_adjustments_additions": 27000,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 107000,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 101294,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 5859,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 153,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 5706,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 5706,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 5706,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 5706,
      // Payments. Line 71. California income tax withheld. See instructions.
      "form-540.line.71_ca_income_tax_withheld": 36500,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 36500,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 36500,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 36500,
      // Line 97. Overpaid tax. If line 95 is more than line 64, subtract line 64 from line 95.
      "form-540.line.97_overpaid_tax": 30794,
      // Line 99. Overpaid tax available this year. Subtract line 98 from line 97.
      "form-540.line.99_overpaid_tax_available": 30794,
      // Refund and Direct Deposit. Line 115. Refund or no amount due. Subtract the sum of line 110
      "form-540.line.115_refund_or_no_amount_due": 30794,
    },
  },
};

export function edarraExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
