/*
 * zerah — LOCKED expected values, drafted from the engine's
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
      // Line 2 — Sales of livestock, produce, grains, and other products you raised
      "schedule-f.0.line.2_sales_products_raised": 262000,
      // Line 4a — Agricultural program payments
      "schedule-f.0.line.4a_agricultural_program_payments": 6000,
      // Line 4b — Agricultural program payments: Taxable amount
      "schedule-f.0.line.4b_agricultural_program_taxable": 6000,
      // Line 7 — Custom hire (machine work) income
      "schedule-f.0.line.7_custom_hire_income": 4000,
      // Line 9 — Gross income. Add amounts in the right column (lines 1c, 2, 3b, 4b, 5a, 5c, 6b, 6
      "schedule-f.0.line.9_gross_income": 272000,
      // Line 11 — Chemicals
      "schedule-f.0.line.11_chemicals": 9800,
      // Line 13 — Custom hire (machine work)
      "schedule-f.0.line.13_custom_hire_expense": 7400,
      // Line 25 — Repairs and maintenance
      "schedule-f.0.line.25_repairs_maintenance": 5200,
      // Line 14 — Depreciation and section 179 expense
      "schedule-f.0.line.14_depreciation_section_179": 12500,
      // Line 28 — Supplies
      "schedule-f.0.line.28_supplies": 2900,
      // Line 29 — Taxes
      "schedule-f.0.line.29_taxes": 3600,
      // Line 30 — Utilities
      "schedule-f.0.line.30_utilities": 4800,
      // Line 17 — Fertilizers and lime
      "schedule-f.0.line.17_fertilizers_lime": 11200,
      // Line 19 — Gasoline, fuel, and oil
      "schedule-f.0.line.19_gasoline_fuel_oil": 6300,
      // Line 20 — Insurance (other than health)
      "schedule-f.0.line.20_insurance_other_than_health": 4100,
      // Line 22 — Labor hired (less employment credits)
      "schedule-f.0.line.22_labor_hired": 30000,
      // Line 33 — Total expenses. Add lines 10 through 32f
      "schedule-f.0.line.33_total_expenses": 97800,
      // Line 34 — Net farm profit or (loss). Subtract line 33 from line 9
      "schedule-f.0.line.34_net_farm_profit_loss": 174200,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 1a — Net farm profit or (loss) from Schedule F, line 34, and farm partnerships, Sched
      "schedule-se.0.line.1a": 174200,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 174200,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 160874,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 160874,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 160874,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 19948,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 4665,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 24613,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 12307,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 6 — Farm income or (loss). Attach Schedule F
      "schedule-1.0.line.6": 174200,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 174200,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 12307,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 12307,
    },
  },
  "schedule-b": {
    engineFields: {
      // Line 1 — Amount (row 1)
      "schedule-b.0.line.1_amount_1": 2600,
      // Line 2 — Add the amounts on line 1
      "schedule-b.0.line.2_total_interest": 2600,
      // Line 4 — Subtract line 3 from line 2. Enter the result here and on Form 1040 or 1040-SR, l
      "schedule-b.0.line.4_taxable_interest": 2600,
    },
  },
  "schedule-1-a": {
    engineFields: {
      // Line 1 — Enter the amount from Form 1040, 1040-SR, or 1040-NR, line 11b
      "schedule-1-a.0.line.1_agi_form_1040": 200493,
      // Line 3 — Add lines 1 and 2e
      "schedule-1-a.0.line.3_modified_agi": 200493,
      // Line 31 — Enter the amount from line 3
      "schedule-1-a.1.line.31_magi_from_line_3": 200493,
      // Line 32 — Enter $75,000 ($150,000 if married filing jointly)
      "schedule-1-a.1.line.32_senior_threshold": 75000,
      // Line 33 — Subtract line 32 from line 31. If zero or less, enter $6,000 on line 35
      "schedule-1-a.1.line.33_magi_over_threshold": 125493,
      // Line 34 — Multiply line 33 by 6% (0.06)
      "schedule-1-a.1.line.34_senior_phaseout": 7530,
    },
  },
  "form-8995-a": {
    engineFields: {
      // Line 2 — Qualified business income from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.2_a": 161893,
      // Line 3 — Multiply line 2 by 20% (0.20) (Column A)
      "form-8995-a.0.line.3_a": 32379,
      // Line 4 — Allocable share of W-2 wages from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.4_a": 30000,
      // Line 5 — Multiply line 4 by 50% (0.50) (Column A)
      "form-8995-a.0.line.5_a": 15000,
      // Line 6 — Multiply line 4 by 25% (0.25) (Column A)
      "form-8995-a.0.line.6_a": 7500,
      // Line 7 — Allocable share of the unadjusted basis immediately after acquisition (UBIA) of a
      "form-8995-a.0.line.7_a": 240000,
      // Line 8 — Multiply line 7 by 2.5% (0.025) (Column A)
      "form-8995-a.0.line.8_a": 6000,
      // Line 9 — Add lines 6 and 8 (Column A)
      "form-8995-a.0.line.9_a": 13500,
      // Line 10 — Enter the greater of line 5 or line 9 (Column A)
      "form-8995-a.0.line.10_a": 15000,
      // Line 11 — W-2 wage and UBIA of qualified property limitation. Enter the smaller of line 3
      "form-8995-a.0.line.11_a": 15000,
      // Line 13 — Qualified business income deduction before patron reduction. Enter the greater o
      "form-8995-a.0.line.13_a": 32379,
      // Line 15 — Qualified business income component. Subtract line 14 from line 13 (Column A)
      "form-8995-a.0.line.15_a": 32379,
      // Line 16 — Total qualified business income component. Add all amounts reported on line 15
      "form-8995-a.0.line.16": 32379,
      // Line 27 — Total qualified business income component from all qualified trades, businesses,
      "form-8995-a.1.line.27": 32379,
      // Line 32 — Qualified business income deduction before the income limitation. Add lines 27 a
      "form-8995-a.1.line.32": 32379,
      // Line 33 — Taxable income before qualified business income deduction
      "form-8995-a.1.line.33": 182743,
      // Line 35 — Subtract line 34 from line 33. If zero or less, enter -0-
      "form-8995-a.1.line.35": 182743,
      // Line 36 — Income limitation. Multiply line 35 by 20% (0.20)
      "form-8995-a.1.line.36": 36549,
      // Line 37 — Qualified business income deduction before the domestic production activities de
      "form-8995-a.1.line.37": 32379,
      // Line 39 — Total qualified business income deduction. Add lines 37 and 38
      "form-8995-a.1.line.39": 32379,
    },
  },
  "form-8960": {
    engineFields: {
      // Line 1 — Taxable interest (see instructions)
      "form-8960.0.line.1": 2600,
      // Line 4a — Rental real estate, royalties, partnerships, S corporations, trusts, trades or b
      "form-8960.0.line.4a": 174200,
      // Line 4b — Adjustment for net income or loss derived in the ordinary course of a non-sectio
      "form-8960.0.line.4b": -174200,
      // Line 8 — Total investment income. Combine lines 1, 2, 3, 4c, 5d, 6, and 7
      "form-8960.0.line.8": 2600,
      // Line 12 — Net investment income. Subtract Part II, line 11, from Part I, line 8. If zero o
      "form-8960.0.line.12": 2600,
      // Line 13 — Modified adjusted gross income (see instructions)
      "form-8960.0.line.13": 200493,
      // Line 14 — Threshold based on filing status (see instructions)
      "form-8960.0.line.14": 200000,
      // Line 15 — Subtract line 14 from line 13. If zero or less, enter -0-
      "form-8960.0.line.15": 493,
      // Line 16 — Enter the smaller of line 12 or line 15
      "form-8960.0.line.16": 493,
      // Line 17 — Net investment income tax for individuals. Multiply line 16 by 3.8% (0.038)
      "form-8960.0.line.17": 19,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 24613,
      // Line 12 — Net investment income tax. Attach Form 8960
      "schedule-2.0.line.12_net_investment_income_tax": 19,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 24632,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 2b — Taxable interest
      "form-1040.line.2b": 2600,
      // Line 5a — Pensions and annuities
      "form-1040.line.5a": 40000,
      // Line 5b — Taxable amount
      "form-1040.line.5b": 36000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 174200,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 212800,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 12307,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 200493,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 200493,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 17750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 32379,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 50129,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 150364,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 28934,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 28934,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 28934,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 24632,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 53566,
      // Line 25b — Federal income tax withheld from Form(s) 1099
      "form-1040.line.25b": 3600,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 3600,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 3600,
      // Line 37 — Amount you owe
      "form-1040.line.37": 49966,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Line 2. Taxable interest. Line 2b. Column A. Federal Amounts.
      "schedule-ca.0.line.2b_federal": 2600,
      // Line 5. Pensions and annuities. See instructions. Line 5 a.
      "schedule-ca.0.line.5a_federal": 40000,
      // Line 5. Pensions and annuities. Line 5b. Column A. Federal Amounts.
      "schedule-ca.0.line.5b_federal": 36000,
      // Line 5b. Column B. Subtractions.
      "schedule-ca.0.line.5b_subtractions": 36000,
      // Line 6. Farm income or (loss). Column A. Federal Amounts.
      "schedule-ca.0.line.b6_federal": 174200,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 212800,
      // Line 10. Column B. Subtractions.
      "schedule-ca.2.line.b10_subtractions": 36000,
      // Line 15. Deductible part of self-employment tax. See instructions. Column A. Federal Amoun
      "schedule-ca.2.line.c15_federal": 12307,
      // Line 26. Add line 11 through line 23 and line 25 in columns A, B, and C. See instructions.
      "schedule-ca.3.line.c26_federal": 12307,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 200493,
      // Line 27. Column B. Subtractions.
      "schedule-ca.3.line.c27_subtractions": 36000,
      // Line 30. Enter the larger of the amount on line 29 or your standard deduction shown below:
      "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 5706,
    },
  },
  "schedule-g-1": {
    engineFields: {
      // Part II, Line 6. Capital gain from federal Form 1099-R, box 3. If you are taking the death
      "schedule-g-1.0.line.6_capital_gain_1099r_box_3": 4000,
      // Line 7. Multiply line 6 by 5.5% (.055) and enter here. If you elect to use Part III, go to
      "schedule-g-1.0.line.7_capital_gain_election_tax": 220,
      // Part III, Line 8. If you completed Part II, enter the amount from federal Form 1099-R, box
      "schedule-g-1.0.line.8_ordinary_income_1099r_box_2a": 32000,
      // Line 10. Total taxable amount. Subtract line 9 from line 8.
      "schedule-g-1.0.line.10_total_taxable_amount": 32000,
      // Line 12. Adjusted total taxable amount. Add line 10 and line 11. If this amount is $70,000
      "schedule-g-1.0.line.12_adjusted_total_taxable_amount": 32000,
      // Line 13. Multiply line 12 by 50% (.50), but do not enter more than $10,000.
      "schedule-g-1.0.line.13_half_of_line_12": 10000,
      // Line 14. Subtract $20,000 from line 12 and enter the difference. If the result is zero or
      "schedule-g-1.0.line.14_line_12_over_20000": 12000,
      // Line 15. Multiply line 14 by 20% (.20).
      "schedule-g-1.0.line.15_twenty_percent_of_line_14": 2400,
      // Line 16. Minimum distribution allowance. Subtract line 15 from line 13.
      "schedule-g-1.0.line.16_minimum_distribution_allowance": 7600,
      // Line 17. Subtract line 16 from line 12.
      "schedule-g-1.0.line.17_amount_after_allowance": 24400,
      // Line 18. Multiply line 17 by 10% (.10).
      "schedule-g-1.0.line.18_ten_percent_of_line_17": 2440,
      // Line 19. Tax on amount on line 18. Use the Tax Rate Schedule in the instructions.
      "schedule-g-1.0.line.19_tax_on_line_18": 24,
      // Line 20. Multiply line 19 by ten (10). If line 11 is blank, skip line 21 through line 26 a
      "schedule-g-1.0.line.20_ten_times_line_19": 240,
      // Line 27. Subtract line 26 from line 20.
      "schedule-g-1.0.line.27_ten_year_averaging_tax": 240,
      // Line 28. Tax on lump-sum distribution. Add Part II, line 7 and Part III, line 27. Enter he
      "schedule-g-1.0.line.28_tax_on_lump_sum_distribution": 460,
    },
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
      "form-540.line.13_federal_agi": 200493,
      // Line 14. California adjustments – subtractions. Enter the amount from Schedule CA (540), P
      "form-540.line.14_ca_adjustments_subtractions": 36000,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 164493,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 164493,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 158787,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 11206,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 306,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 10900,
      // Line 34. Tax. See instructions.
      "form-540.line.34_tax_amount": 460,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 11360,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 11360,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 11360,
      // Payments. Line 71. California income tax withheld. See instructions.
      "form-540.line.71_ca_income_tax_withheld": 1000,
      // Line 72. 2025 California estimated tax and other payments. See instructions.
      "form-540.line.72_ca_estimated_tax_payments": 2300,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 3300,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 3300,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 3300,
      // Line 100. Tax due. If line 95 is less than line 64, subtract line 95 from line 64.
      "form-540.line.100_tax_due": 8060,
      // Amount You Owe. Line 111. Amount You Owe. If you do not have an amount on line 99, add lin
      "form-540.line.111_amount_you_owe": 8060,
      // Line 113. Underpayment of estimated tax.
      "form-540.line.113_underpayment_estimated_tax": 42,
      // Line 114. Total amount due. See instructions. Enclose, but do not staple, any payment.
      "form-540.line.114_total_amount_due": 8102,
    },
    // Line 113's FTB 5805F box
    renderedChecked: ["form-540.line.112_ftb_5805f_attached"],
  },
  "form-5805f": {
    engineFields: {
      // Part I, Line 1. 2025 tax after credits from Form 540, line 48, line 61, line 62, and any I
      "form-5805f.0.line.1_current_year_tax_after_credits": 11360,
      // Line 2. 2025 tax on lump-sum distributions and accumulation distribution of trusts from Fo
      "form-5805f.0.line.2_current_year_lump_sum_tax": 460,
      // Line 3. Subtract line 2 from line 1.
      "form-5805f.0.line.3_current_year_tax_less_lump_sum": 10900,
      // Line 4. Multiply line 3 by 66 and two-thirds % (.6667).
      "form-5805f.0.line.4_two_thirds_of_current_year_tax": 7267,
      // Line 5. 2025 withholding taxes from Form 540, line 71 and line 73; Form 540NR, line 81 and
      "form-5805f.0.line.5_current_year_withholding": 1000,
      // Line 6. Subtract line 5 from line 3. If less than $500 ($250 if married/R D P filing separ
      "form-5805f.0.line.6_current_year_tax_less_withholding": 9900,
      // Line 7. 2024 tax after credits from Form 540, line 48, line 61, line 62, and any I R C Sec
      "form-5805f.0.line.7_prior_year_tax_after_credits": 9410,
      // Line 8. 2024 tax on lump-sum distributions and accumulation distribution of trusts from Fo
      "form-5805f.0.line.8_prior_year_lump_sum_tax": 310,
      // Line 9. Subtract line 8 from line 7. If less than $500 ($250 if married/R D P filing separ
      "form-5805f.0.line.9_prior_year_tax_less_lump_sum": 9100,
      // Line 10. Enter the smaller of line 4 or line 9. (If your California A G I is equal to or g
      "form-5805f.0.line.10_required_annual_payment": 7267,
      // Line 11. 2025 withholding taxes and estimated tax payments made on or before January 15, 2
      "form-5805f.0.line.11_withholding_and_estimated_payments": 3300,
      // Line 12. Underpayment. Subtract line 11 from line 10. If zero or less, you do not owe a pe
      "form-5805f.0.line.12_underpayment": 3967,
      // Line 14. Number of days after January 15, 2026, to and including the date on line 13.
      "form-5805f.0.line.14_number_of_days": 81,
      // Line 15. Penalty: Number of days on line 14 divided by 365 multiplied by 0.7 multiplied by
      "form-5805f.0.line.15_penalty": 62,
      // Line 16. To request a waiver, check the box on this line and provide an explanation below.
      "form-5805f.0.line.16_waiver_amount": 42,
    },
    renderedText: {
      "form-5805f.0.header.name": "Zerah Okonkwo-Hale",
      // Line 13 — paid with the return on April 6, 2026, before April 15
      "form-5805f.0.line.13_date_underpayment_paid": "04/06/2026",
    },
    renderedChecked: ["form-5805f.0.line.16_waiver_request_checkbox"],
  },
};

export function zerahExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
