/*
 * pevin — LOCKED expected values, drafted from the engine's
 * output on 2026-11-27 (scripts/draftExpected.ts).
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
  "schedule-a": {
    engineFields: {
      // Line 1 — Medical and dental expenses (see instructions)
      "schedule-a.0.line.1_medical_dental_expenses": 26000,
      // Line 2 — Enter amount from Form 1040 or 1040-SR, line 11b
      "schedule-a.0.line.2_agi_from_1040": 281000,
      // Line 3 — Multiply line 2 by 7.5% (0.075)
      "schedule-a.0.line.3_agi_multiplied": 21075,
      // Line 4 — Subtract line 3 from line 1. If line 3 is more than line 1, enter -0-
      "schedule-a.0.line.4_net_medical_dental": 4925,
      // Line 5a — State and local income taxes or general sales taxes
      "schedule-a.0.line.5a_state_local_income_or_sales_tax": 22800,
      // Line 5b — State and local real estate taxes (see instructions)
      "schedule-a.0.line.5b_real_estate_taxes": 2400,
      // Line 5d — Add lines 5a through 5c
      "schedule-a.0.line.5d_total_state_local_taxes": 25200,
      // Line 5e — Enter the smaller of line 5d or $40,000 ($20,000 if married filing separately)
      "schedule-a.0.line.5e_salt_cap": 25200,
      // Line 7 — Add lines 5e and 6
      "schedule-a.0.line.7_total_taxes": 25200,
      // Line 8a — Home mortgage interest and points reported to you on Form 1098
      "schedule-a.0.line.8a_mortgage_interest_form1098": 5500,
      // Line 8e — Add lines 8a through 8c
      "schedule-a.0.line.8e_total_mortgage_interest_points": 5500,
      // Line 10 — Add lines 8e and 9
      "schedule-a.0.line.10_total_interest": 5500,
      // Line 11 — Gifts by cash or check
      "schedule-a.0.line.11_gifts_cash_check": 9000,
      // Line 14 — Add lines 11 through 13
      "schedule-a.0.line.14_total_gifts": 9000,
      // Line 17 — Total Itemized Deductions. Add the amounts in the far right column for lines 4 t
      "schedule-a.0.line.17_total_itemized_deductions": 44625,
    },
  },
  "schedule-b": {
    engineFields: {
      // Line 1 — Amount (row 1)
      "schedule-b.0.line.1_amount_1": 3000,
      // Line 2 — Add the amounts on line 1
      "schedule-b.0.line.2_total_interest": 3000,
      // Line 4 — Subtract line 3 from line 2. Enter the result here and on Form 1040 or 1040-SR, l
      "schedule-b.0.line.4_taxable_interest": 3000,
      // Line 5 — Amount (row 1)
      "schedule-b.0.line.5_amount_1": 16000,
      // Line 6 — Add the amounts on line 5. Enter the total here and on Form 1040 or 1040-SR, line
      "schedule-b.0.line.6_total_ordinary_dividends": 16000,
    },
  },
  "form-6251": {
    engineFields: {
      // Line 1a — Subtract Schedule 1-A (Form 1040), line 37, from Form 1040, 1040-SR, or 1040-NR,
      "form-6251.0.line.1a_deductions_less_schedule_1a": 44625,
      // Line 1b — Subtract line 1a from Form 1040, 1040-SR, or 1040-NR, line 11b (if less than zer
      "form-6251.0.line.1b_taxable_income_start": 236375,
      // Line 2a — If filing Schedule A (Form 1040), enter the taxes from Schedule A, line 7; other
      "form-6251.0.line.2a_taxes_or_standard_deduction": 25200,
      // Line 2i — Exercise of incentive stock options (excess of AMT income over regular tax incom
      "form-6251.0.line.2i_incentive_stock_options": 200000,
      // Line 4 — Alternative minimum taxable income. Combine lines 1b through 3
      "form-6251.0.line.4_alternative_minimum_taxable_income": 461575,
      // Line 5 — Exemption
      "form-6251.0.line.5_exemption": 88100,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-6251.0.line.6_amti_less_exemption": 373475,
      // Line 7 — Tax on line 6: complete Part III and enter line 40 if you have capital gain distr
      "form-6251.0.line.7_tax_on_line_6": 98231,
      // Line 9 — Tentative minimum tax. Subtract line 8 from line 7
      "form-6251.0.line.9_tentative_minimum_tax": 98231,
      // Line 10 — Add Form 1040 or 1040-SR, line 16 (minus any tax from Form 4972), and Schedule 2
      "form-6251.0.line.10_regular_tax_less_credits": 50663,
      // Line 11 — AMT. Subtract line 10 from line 9. If zero or less, enter -0-
      "form-6251.0.line.11_amt": 47568,
      // Line 12 — Enter the amount from Form 6251, line 6
      "form-6251.1.line.12_amount_from_line_6": 373475,
      // Line 13 — Enter the amount from line 4 of the Qualified Dividends and Capital Gain Tax Wor
      "form-6251.1.line.13_qualified_dividends_gain_amount": 12000,
      // Line 15 — If you did not complete a Schedule D Tax Worksheet for the regular tax or the AM
      "form-6251.1.line.15_adjusted_net_capital_gain": 12000,
      // Line 16 — Enter the smaller of line 12 or line 15
      "form-6251.1.line.16_smaller_line_12_or_15": 12000,
      // Line 17 — Subtract line 16 from line 12
      "form-6251.1.line.17_line_12_minus_16": 361475,
      // Line 18 — If line 17 is $239,100 or less ($119,550 or less if married filing separately),
      "form-6251.1.line.18_tax_on_line_17": 96431,
      // Line 19 — Enter: $96,700 if married filing jointly or qualifying surviving spouse; $48,350
      "form-6251.1.line.19_zero_rate_threshold": 48350,
      // Line 20 — Enter the amount from line 5 of the Qualified Dividends and Capital Gain Tax Wor
      "form-6251.1.line.20_regular_tax_taxable_income": 224375,
      // Line 22 — Enter the smaller of line 12 or line 13
      "form-6251.1.line.22_smaller_line_12_or_13": 12000,
      // Line 24 — Subtract line 23 from line 22
      "form-6251.1.line.24_line_22_minus_23": 12000,
      // Line 25 — Enter: $533,400 if single; $300,000 if married filing separately; $600,050 if ma
      "form-6251.1.line.25_fifteen_rate_threshold": 533400,
      // Line 27 — Enter the amount from line 5 of the Qualified Dividends and Capital Gain Tax Wor
      "form-6251.1.line.27_regular_tax_taxable_income": 224375,
      // Line 28 — Add line 26 and line 27
      "form-6251.1.line.28_add_lines_26_27": 224375,
      // Line 29 — Subtract line 28 from line 25. If zero or less, enter -0-
      "form-6251.1.line.29_line_25_minus_28": 309025,
      // Line 30 — Enter the smaller of line 24 or line 29
      "form-6251.1.line.30_smaller_line_24_or_29": 12000,
      // Line 31 — Multiply line 30 by 15% (0.15)
      "form-6251.1.line.31_tax_at_fifteen_percent": 1800,
      // Line 32 — Add lines 23 and 30
      "form-6251.1.line.32_add_lines_23_30": 12000,
      // Line 38 — Add lines 18, 31, 34, and 37
      "form-6251.1.line.38_add_lines_18_31_34_37": 98231,
      // Line 39 — If line 12 is $239,100 or less ($119,550 or less if married filing separately),
      "form-6251.1.line.39_tax_on_line_12": 99791,
      // Line 40 — Enter the smaller of line 38 or line 39 here and on line 7
      "form-6251.1.line.40_smaller_line_38_or_39": 98231,
    },
  },
  "form-8959": {
    engineFields: {
      // Line 1 — Medicare wages and tips from Form W-2, box 5
      "form-8959.0.line.1_medicare_wages_tips": 262000,
      // Line 4 — Add lines 1 through 3
      "form-8959.0.line.4_total_medicare_wages": 262000,
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 200000,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-8959.0.line.6_excess_medicare_wages": 62000,
      // Line 7 — Additional Medicare Tax on Medicare wages. Multiply line 6 by 0.9% (0.009)
      "form-8959.0.line.7_additional_medicare_tax_wages": 558,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 558,
      // Line 19 — Medicare tax withheld from Form W-2, box 6
      "form-8959.0.line.19_medicare_tax_withheld": 3799,
      // Line 20 — Enter the amount from line 1
      "form-8959.0.line.20_medicare_wages_from_line1": 262000,
      // Line 21 — Multiply line 20 by 1.45% (0.0145). Regular Medicare tax withholding on Medicare
      "form-8959.0.line.21_regular_medicare_tax_on_wages": 3799,
    },
  },
  "form-8960": {
    engineFields: {
      // Line 1 — Taxable interest (see instructions)
      "form-8960.0.line.1": 3000,
      // Line 2 — Ordinary dividends (see instructions)
      "form-8960.0.line.2": 16000,
      // Line 8 — Total investment income. Combine lines 1, 2, 3, 4c, 5d, 6, and 7
      "form-8960.0.line.8": 19000,
      // Line 12 — Net investment income. Subtract Part II, line 11, from Part I, line 8. If zero o
      "form-8960.0.line.12": 19000,
      // Line 13 — Modified adjusted gross income (see instructions)
      "form-8960.0.line.13": 281000,
      // Line 14 — Threshold based on filing status (see instructions)
      "form-8960.0.line.14": 200000,
      // Line 15 — Subtract line 14 from line 13. If zero or less, enter -0-
      "form-8960.0.line.15": 81000,
      // Line 16 — Enter the smaller of line 12 or line 15
      "form-8960.0.line.16": 19000,
      // Line 17 — Net investment income tax for individuals. Multiply line 16 by 3.8% (0.038)
      "form-8960.0.line.17": 722,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 2 — Alternative minimum tax. Attach Form 6251
      "schedule-2.0.line.2_alternative_minimum_tax": 47568,
      // Line 3 — Add lines 1z and 2. Enter here and on Form 1040, 1040-SR, or 1040-NR, line 17
      "schedule-2.0.line.3_total_lines_1z_and_2": 47568,
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 558,
      // Line 12 — Net investment income tax. Attach Form 8960
      "schedule-2.0.line.12_net_investment_income_tax": 722,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 1280,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 262000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 262000,
      // Line 2b — Taxable interest
      "form-1040.line.2b": 3000,
      // Line 3a — Qualified dividends
      "form-1040.line.3a": 12000,
      // Line 3b — Ordinary dividends
      "form-1040.line.3b": 16000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 281000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 281000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 281000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 44625,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 44625,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 236375,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 50663,
      // Line 17 — Amount from Schedule 2, line 3
      "form-1040.line.17": 47568,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 98231,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 98231,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 1280,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 99511,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 52400,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 52400,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 52400,
      // Line 37 — Amount you owe
      "form-1040.line.37": 47111,
    },
  },
  "schedule-ca-540nr": {
    engineFields: {
      // Line 6 . The number of days I spent in California for any purpose was. Yourself: Enter the
      "schedule-ca-540nr.0.part1.6_days_in_ca_yourself": 273,
      // Part Two. Income Adjustment Schedule. Section A. Income from federal Form 1040 or 1040-SR.
      "schedule-ca-540nr.0.line.1a_federal": 262000,
      // Line 1a. Column D. Total Amounts Using California Law As If You Were a California Resident
      "schedule-ca-540nr.0.line.1a_total_ca_law": 262000,
      // Line 1a. Column E. California Amounts (income earned or received as a California resident
      "schedule-ca-540nr.0.line.1a_ca_amounts": 262000,
      // Line 1z. Add line 1a through line 1i. Column A. Federal Amounts.
      "schedule-ca-540nr.0.line.1z_federal": 262000,
      // Line 1z. Column D. Total Amounts Using California Law As If You Were a California Resident
      "schedule-ca-540nr.0.line.1z_total_ca_law": 262000,
      // Line 1z. Column E. California Amounts.
      "schedule-ca-540nr.0.line.1z_ca_amounts": 262000,
      // Line 2b. Column A. Federal Amounts.
      "schedule-ca-540nr.0.line.2b_federal": 3000,
      // Line 2b. Column D. Total Amounts Using California Law As If You Were a California Resident
      "schedule-ca-540nr.0.line.2b_total_ca_law": 3000,
      // Line 2b. Column E. California Amounts.
      "schedule-ca-540nr.0.line.2b_ca_amounts": 2250,
      // Line 3 . Ordinary dividends. See instructions. Line 3a. Amount.
      "schedule-ca-540nr.0.line.3a_federal": 12000,
      // Line 3b. Column A. Federal Amounts.
      "schedule-ca-540nr.0.line.3b_federal": 16000,
      // Line 3b. Column D. Total Amounts Using California Law As If You Were a California Resident
      "schedule-ca-540nr.0.line.3b_total_ca_law": 16000,
      // Line 3b. Column E. California Amounts.
      "schedule-ca-540nr.0.line.3b_ca_amounts": 4000,
      // Line 10 . Total. Add Section A, line 1z through line 7a, and Section B, line 1 through lin
      "schedule-ca-540nr.2.line.b10_federal": 281000,
      // Line 10 . Column D. Total Amounts Using California Law As If You Were a California Residen
      "schedule-ca-540nr.2.line.b10_total_ca_law": 281000,
      // Line 10 . Column E. California Amounts.
      "schedule-ca-540nr.2.line.b10_ca_amounts": 268250,
      // Line 27. Total. Subtract line 26 from line 10 in each column, A through E. See instruction
      "schedule-ca-540nr.3.line.c27_federal": 281000,
      // Line 27. Column D. Total Amounts Using California Law As If You Were a California Resident
      "schedule-ca-540nr.3.line.c27_total_ca_law": 281000,
      // Line 27. Column E. California Amounts.
      "schedule-ca-540nr.3.line.c27_ca_amounts": 268250,
      // Medical and Dental Expenses. Line 1. Medical and dental expenses.
      "schedule-ca-540nr.3.part3.1_medical_dental_expenses": 26000,
      // Line 2. Enter amount from federal Form 1040 or 1040-SR, line 11 b .
      "schedule-ca-540nr.3.part3.2_federal_agi_line11b": 281000,
      // Line 3. Multiply line 2 by 7.5% (0.075).
      "schedule-ca-540nr.3.part3.3_medical_agi_threshold": 21075,
      // Line 4. Subtract line 3 from line 1. If line 3 is more than line 1, enter 0. Column A. Fed
      "schedule-ca-540nr.3.part3.4_medical_federal": 4925,
      // Taxes You Paid. Line 5a State and local income tax or general sales taxes. Column A. Feder
      "schedule-ca-540nr.3.part3.5a_taxes_federal": 22800,
      // Line 5a. Column B. Subtractions.
      "schedule-ca-540nr.3.part3.5a_taxes_subtractions": 22800,
      // Line 5b. State and local real estate taxes. Column A. Federal Amounts.
      "schedule-ca-540nr.3.part3.5b_taxes_federal": 2400,
      // Line 5d. Add line 5 a through line 5c. Column A. Federal Amounts.
      "schedule-ca-540nr.3.part3.5d_taxes_federal": 25200,
      // Line 5e. Enter the smaller of line 5d or $40,000 ($20,000 if married filing separately) in
      "schedule-ca-540nr.3.part3.5e_taxes_federal": 25200,
      // Line 5e. Column B. Subtractions.
      "schedule-ca-540nr.3.part3.5e_taxes_subtractions": 22800,
      // Line 7. Add line 5e and line 6. Column A. Federal Amounts.
      "schedule-ca-540nr.3.part3.7_taxes_federal": 25200,
      // Line 7. Column B. Subtractions.
      "schedule-ca-540nr.3.part3.7_taxes_subtractions": 22800,
      // Interest You Paid. Line 8a. Home mortgage interest and points reported to you on federal F
      "schedule-ca-540nr.3.part3.8a_interest_federal": 5500,
      // Line 8e. Add line 8 A through line 8c. Column A. Federal Amounts.
      "schedule-ca-540nr.3.part3.8e_interest_federal": 5500,
      // Line 10. Add line 8e and line 9. Column A. Federal Amounts.
      "schedule-ca-540nr.3.part3.10_interest_federal": 5500,
      // Gifts to Charity. Line 11. Gifts by cash or check. Column A. Federal Amounts.
      "schedule-ca-540nr.3.part3.11_charity_federal": 9000,
      // Line 14. Add line 11 through line 13. Column A. Federal Amounts.
      "schedule-ca-540nr.3.part3.14_charity_federal": 9000,
      // Line 17 . Add lines 4, 7, 10, 14, 15, and 16 in columns A, B, and C. Column A. Federal Amo
      "schedule-ca-540nr.4.part3.17_itemized_subtotal_federal": 44625,
      // Line 17 . Column B. Subtractions.
      "schedule-ca-540nr.4.part3.17_itemized_subtotal_subtractions": 22800,
      // Line 18 . Total. Combine line 17 column A less column B plus column C.
      "schedule-ca-540nr.4.part3.18_itemized_total_combined": 21825,
      // Line 21 . Other expenses: investment, safe deposit box, etcetera. Enter amount.
      "schedule-ca-540nr.4.part3.21_other_expenses_amount": 7000,
      // Line 22 . Add line 19 through line 21 .
      "schedule-ca-540nr.4.part3.22_job_expenses_total": 7000,
      // Line 23 . Enter amount from federal Form 1040 or 1040-SR, line 11 b .
      "schedule-ca-540nr.4.part3.23_federal_agi": 281000,
      // Line 24 . Multiply line 23 by 2% (0.02). If less than zero, enter 0 .
      "schedule-ca-540nr.4.part3.24_two_percent_of_agi": 5620,
      // Line 25 . Subtract line 24 from line 22 . If line 24 is more than line 22, enter 0 .
      "schedule-ca-540nr.4.part3.25_job_expenses_net": 1380,
      // Line 26 . Total Itemized Deductions. Add line 18 and line 25 .
      "schedule-ca-540nr.4.part3.26_total_itemized_deductions": 23205,
      // Line 28 . Combine line 26 and line 27 .
      "schedule-ca-540nr.4.part3.28_itemized_after_adjustments": 23205,
      // Line 29 . Is your federal adjusted gross income (Form 540NR, line 13) more than the amount
      "schedule-ca-540nr.4.part3.29_itemized_after_agi_limit": 21477,
      // Line 30 . Enter the larger of the amount on line 29 or your standard deduction shown below
      "schedule-ca-540nr.4.part3.30_itemized_or_standard_deduction": 21477,
      // Part Four. California Taxable Income. Line 1 . California Adjusted Gross Income (A G I). E
      "schedule-ca-540nr.4.part4.1_california_agi": 268250,
      // Line 2 . Enter your deductions from line 30 .
      "schedule-ca-540nr.4.part4.2_deductions_from_line_30": 21477,
      // Line 4 . California Itemized/Standard Deductions. Multiply line 2 by the percentage on lin
      "schedule-ca-540nr.4.part4.4_california_deductions_prorated": 20502,
      // Line 5 . California Taxable Income. Subtract line 4 from line 1 . Transfer this amount to
      "schedule-ca-540nr.4.part4.5_california_taxable_income": 247748,
    },
  },
  "form-540nr": {
    engineFields: {
      // Exemptions. Line 7. Personal: If you checked box 1, 3, or 4 above, enter 1 in the box. If
      "form-540nr.0.line.7_personal_exemption_count": 1,
      // Multiply the number you put in the line 7 box by $153. Enter this number into this field.
      "form-540nr.0.line.7_personal_exemption_amount": 153,
      // Line 11. Exemption amount: Add line 7 through line 10.
      "form-540nr.1.line.11_total_exemption_amount": 153,
      // Total Taxable Income. Line 12. Total California wages from your federal Form or Forms W-2,
      "form-540nr.1.line.12_state_wages": 262000,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040, 1040-S R, or
      "form-540nr.1.line.13_federal_agi": 281000,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540nr.1.line.15_agi_before_additions": 281000,
      // Line 17. Adjusted gross income from all sources. Combine line 15 and line 16.
      "form-540nr.1.line.17_agi_all_sources": 281000,
      // Line 18. Enter the larger of: Your California itemized deductions from Schedule CA (540 N
      "form-540nr.1.line.18_deductions": 21477,
      // Line 19. Subtract line 18 from line 17. This is your total taxable income. If less than ze
      "form-540nr.1.line.19_total_taxable_income": 259523,
      // Line 31. Tax amount.
      "form-540nr.1.line.31_tax_amount": 20574,
      // Line 32. California adjusted gross income from Schedule CA (540 N R), Part 4, line 1.
      "form-540nr.1.line.32_ca_agi": 268250,
      // Line 35. California Taxable Income from Schedule CA (540 N R), Part 4, line 5.
      "form-540nr.1.line.35_ca_taxable_income": 247748,
      // Line 37. California Tax Before Exemption Credits. Multiply line 35 by line 36.
      "form-540nr.1.line.37_ca_tax_before_exemption_credits": 19646,
      // Line 39. California Prorated Exemption Credits. Multiply line 11 by line 38. If the amount
      "form-540nr.1.line.39_ca_prorated_exemption_credits": 77,
      // Line 40. California Regular Tax Before Credits. Subtract line 39 from line 37. If less tha
      "form-540nr.1.line.40_ca_regular_tax_before_credits": 19569,
      // Line 42. Add line 40 and line 41.
      "form-540nr.1.line.42_tax_before_special_credits": 19569,
      // Line 63. Subtract line 62 from line 42. If less than zero, enter 0.
      "form-540nr.2.line.63_tax_after_credits": 19569,
      // Other Taxes. Line 71. Alternative Minimum Tax. Attach Schedule P (540 N R).
      "form-540nr.2.line.71_alternative_minimum_tax": 7829,
      // Line 74. Add line 63, line 71, line 72, and line 73. This is your total tax.
      "form-540nr.2.line.74_total_tax": 27398,
      // Payments. Line 81. California income tax withheld. See instructions.
      "form-540nr.2.line.81_ca_income_tax_withheld": 22800,
      // Line 88. Add line 81 through line 87. These are your total payments. See instructions.
      "form-540nr.2.line.88_total_payments": 22800,
      // Overpaid Tax or Tax Due. Line 92. Payments after Individual Shared Responsibility Penalty.
      "form-540nr.2.line.92_payments_after_isr_penalty": 22800,
      // Line 104. Tax due. If line 92 is less than line 74, subtract line 92 from line 74.
      "form-540nr.3.line.104_tax_due": 4598,
      // Amount You Owe. Line 121. AMOUNT YOU OWE. Add line 93, line 104, and line 120. See instruc
      "form-540nr.4.line.121_amount_you_owe": 4598,
      // Line 124. Total amount due. See instructions. Enclose, but do not staple, any payment.
      "form-540nr.4.line.124_total_amount_due": 4598,
    },
  },
  "schedule-p-540nr": {
    engineFields: {
      // Line 2. Medical and dental expenses. Enter the smaller of federal Schedule A (Form 1040),
      "schedule-p-540nr.0.line.2_medical_dental_expenses": 4925,
      // Line 3. Personal property taxes and real property taxes. See instructions.
      "schedule-p-540nr.0.line.3_personal_real_property_taxes": 2400,
      // Line 5. Miscellaneous itemized deductions. See instructions.
      "schedule-p-540nr.0.line.5_miscellaneous_itemized_deductions": 1380,
      // Line 10. Incentive stock options (I S Os) and California qualified stock options (C Q S Os
      "schedule-p-540nr.0.line.10_iso_cqso": 200000,
      // Line 14. Total Adjustments and Preferences. Combine line 1 through line 13.
      "schedule-p-540nr.0.line.14_total_adjustments_preferences": 208705,
      // Line 15. Enter taxable income from Form 540N R, line 19. See instructions.
      "schedule-p-540nr.0.line.15_taxable_income": 259523,
      // Line 18. If your federal adjusted gross income (A G I) is less than the amount for your fi
      "schedule-p-540nr.0.line.18_itemized_deductions_limitation": 1728,
      // Line 19. Combine line 14 through line 18.
      "schedule-p-540nr.0.line.19_combine_lines_14_through_18": 466500,
      // Line 21. Alternative Minimum Taxable Income. Subtract line 20 from line 19 (if married/R D
      "schedule-p-540nr.0.line.21_alternative_minimum_taxable_income": 466500,
      // Part II, Line 22. Exemption Amount. (If this schedule is for certain children under age 24
      "schedule-p-540nr.1.line.22_exemption_amount": 63076,
      // Line 23. Subtract line 22 from Part I, line 21. If zero or less, enter 0. See instructions
      "schedule-p-540nr.1.line.23_amti_less_exemption": 403424,
      // Line 24. Total Tentative Minimum Tax (T M T). Multiply line 23 by 7% (.07).
      "schedule-p-540nr.1.line.24_total_tentative_minimum_tax": 28240,
      // Line 25. California adjusted gross income (A G I) from Schedule C A (540N R), Part IV, lin
      "schedule-p-540nr.1.line.25_california_agi": 268250,
      // Line 28. Combine line 25 through line 27.
      "schedule-p-540nr.1.line.28_combine_lines_25_through_27": 268250,
      // Line 29d. Incentive stock options and C Q S O s.
      "schedule-p-540nr.1.line.29d_iso_cqso": 200000,
      // Line 29. Add amounts on line a through line r, and enter total here.
      "schedule-p-540nr.1.line.29_adjustments_preferences_total": 200000,
      // Line 30. Combine line 28 and line 29.
      "schedule-p-540nr.1.line.30_combine_lines_28_and_29": 468250,
      // Line 32. California A M T A G I. Subtract line 31 from line 30. If you did not itemize ded
      "schedule-p-540nr.1.line.32_california_amt_agi": 468250,
      // Line 33. Itemized deductions (before federal A G I limitation and proration). Enter the am
      "schedule-p-540nr.1.line.33_itemized_deductions": 23205,
      // Line 34a. Medical and dental expense, enter amount from Part I, line 2.
      "schedule-p-540nr.1.line.34a_medical_dental_expense": 4925,
      // Line 34b. Personal property taxes and real property taxes, enter amount from Part I, line
      "schedule-p-540nr.1.line.34b_personal_real_property_taxes": 2400,
      // Line 34d. Miscellaneous itemized deductions, enter amount from Part I, line 5.
      "schedule-p-540nr.1.line.34d_miscellaneous_itemized_deductions": 1380,
      // Line 34. Combine amounts on line a through line e, and enter total here.
      "schedule-p-540nr.1.line.34_itemized_deductions_part1_total": 8705,
      // Line 35. Total A M T Itemized Deductions. Combine line 33 and line 34.
      "schedule-p-540nr.1.line.35_total_amt_itemized_deductions": 14500,
      // Line 36. Total A M T I. Enter the amount from Part I, line 21.
      "schedule-p-540nr.1.line.36_total_amti": 466500,
      // Line 37. Total A M T A G I. Add line 35 and line 36.
      "schedule-p-540nr.1.line.37_total_amt_agi": 481000,
      // Line 39. Prorated A M T Itemized Deductions. Multiply line 35 by line 38.
      "schedule-p-540nr.1.line.39_prorated_amt_itemized_deductions": 14116,
      // Line 40. California A M T I. Subtract line 39 from line 32.
      "schedule-p-540nr.1.line.40_california_amti": 454134,
      // Line 41. Total T M T. Enter the amount from line 24.
      "schedule-p-540nr.1.line.41_total_tmt": 28240,
      // Line 43. California T M T. Multiply line 40 by line 42.
      "schedule-p-540nr.1.line.43_california_tmt": 27475,
      // Line 44. Regular Tax. Enter the amount from Form 540N R, line 37.
      "schedule-p-540nr.1.line.44_regular_tax": 19646,
      // Line 45. Alternative Minimum Tax. Subtract line 44 from line 43. If zero or less, enter 0
      "schedule-p-540nr.1.line.45_alternative_minimum_tax": 7829,
      // Part III, Line 1. Enter the amount from Form 540NR, line 42.
      "schedule-p-540nr.2.part3.1_tax_from_form_540nr_line_42": 19569,
      // Line 2. Enter the tentative minimum tax from Side 2, Part II, line 43.
      "schedule-p-540nr.2.part3.2_tentative_minimum_tax": 27475,
      // Section B, Line 11. If Part III, line 3 is zero, enter the amount from line 1. If line 3 i
      "schedule-p-540nr.2.part3.11_tax_balance_col_c": 19569,
      // Section C, Line 22. Enter your alternative minimum tax from Side 2, Part II, line 45, (c)
      "schedule-p-540nr.2.part3.22_alternative_minimum_tax_col_c": 7829,
      // Line 25. Adjusted A M T. Enter the balance from line 24, column (c) here and on Form 540NR
      "schedule-p-540nr.2.part3.25_adjusted_amt_col_c": 7829,
    },
  },
};

export function pevinExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
