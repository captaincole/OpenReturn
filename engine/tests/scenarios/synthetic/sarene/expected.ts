/*
 * sarene — LOCKED expected values, drafted from the engine's
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
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 260000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 260000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 260000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 260000,
      // Line 20b — Rent or lease: Other business property
      "schedule-c.0.line.20b": 24000,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 40000,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 5000,
      // Line 25 — Utilities
      "schedule-c.0.line.25": 6000,
      // Line 26 — Wages (less employment credits)
      "schedule-c.0.line.26": 60000,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 135000,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 125000,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 125000,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 125000,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 125000,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 115438,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 115438,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 115438,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 14314,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 3348,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 17662,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 8831,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 125000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 125000,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 8831,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 8831,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 17662,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 17662,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": 116169,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": 116169,
      // Line 4 — Total qualified business income. Combine lines 2 and 3. If zero or less, enter -0
      "form-8995.0.line.4": 116169,
      // Line 5 — Qualified business income component. Multiply line 4 by 20% (0.20)
      "form-8995.0.line.5": 23234,
      // Line 10 — Qualified business income deduction before the income limitation. Add lines 5 an
      "form-8995.0.line.10": 23234,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 100419,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 100419,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 20084,
      // Line 15 — Qualified business income deduction. Enter the smaller of line 10 or line 14
      "form-8995.0.line.15": 20084,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 125000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 125000,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 8831,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 116169,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 116169,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 20084,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 35834,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 80335,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 12586,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 12586,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 12586,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 17662,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 30248,
      // Line 26 — 2025 estimated tax payments and amount applied from 2024 return
      "form-1040.line.26": 28000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 28000,
      // Line 37 — Amount you owe
      "form-1040.line.37": 2248,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Line 3 . Business income or (loss). See instructions. Column A. Federal Amounts.
      "schedule-ca.0.line.b3_federal": 125000,
      // Line 9 b3. Net operating loss deduction from form FTB 3805Z, 3807, or 3809. Column B. Subt
      "schedule-ca.2.line.b9b3_subtractions": 15000,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 125000,
      // Line 10. Column B. Subtractions.
      "schedule-ca.2.line.b10_subtractions": 15000,
      // Line 15. Deductible part of self-employment tax. See instructions. Column A. Federal Amoun
      "schedule-ca.2.line.c15_federal": 8831,
      // Line 26. Add line 11 through line 23 and line 25 in columns A, B, and C. See instructions.
      "schedule-ca.3.line.c26_federal": 8831,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 116169,
      // Line 27. Column B. Subtractions.
      "schedule-ca.3.line.c27_subtractions": 15000,
      // Line 30. Enter the larger of the amount on line 29 or your standard deduction shown below:
      "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 5706,
    },
  },
  "form-3805z": {
    engineFields: {
      // Line F. Total number of employees in the E Z.
      "form-3805z.0.header.f_total_employees_in_ez": 2,
      // Line G. Gross annual receipts of the business. Enter dollar amount.
      "form-3805z.0.header.g_gross_annual_receipts": 260000,
      // Line H. Total asset value of the business. Enter dollar amount.
      "form-3805z.0.header.h_total_asset_value": 200000,
      // Part One. Line 1a. Hiring credit carryover from Schedule Z, line 8A, column (f) or line 10
      "form-3805z.0.line.1a_hiring_credit_carryover": 1400,
      // Line 1b. Sales or use tax credit carryover from Schedule Z, line 9A, column (f) or line 11
      "form-3805z.0.line.1b_sales_use_tax_credit_carryover": 1800,
      // Line 1c. Add line 1a and line 1b. Enter dollar amount.
      "form-3805z.0.line.1c_total_credit_carryover": 3200,
      // Part Three. Line 3a. Enter the total E Z N O L carryover from prior years from Worksheet T
      "form-3805z.0.line.3a_ez_nol_carryover_prior_years": 15000,
      // Line 3b. Enter the total E Z N O L deduction used in the current year from Worksheet Two,
      "form-3805z.0.line.3b_ez_nol_deduction_current_year": 15000,
      // Schedule Z. Part One. Line 1 . Trade or business income. Individuals. Enter the amount fro
      "form-3805z.1.line.1_trade_or_business_income": 87688,
      // Line 3 . Multiply line 1 by line 2 . Enter dollar amount.
      "form-3805z.1.line.3_apportioned_business_income": 87688,
      // Line 4 . Enter the E Z N O L deduction from Worksheet Two, line 9, column (c). Enter dolla
      "form-3805z.1.line.4_ez_nol_deduction": 15000,
      // Line 5 . E Z taxable income. Subtract line 4 from line 3 . Enter dollar amount.
      "form-3805z.1.line.5_ez_taxable_income": 72688,
      // Line 6a. Compute the amount of tax due using the amount on line 5 . See Instructions. Ente
      "form-3805z.1.line.6a_tax_on_ez_income": 3200,
      // Line 6b. Enter the amount of tax from Form 540, line 35, Form 540NR, line 42, Form 541, li
      "form-3805z.1.line.6b_tax_from_return": 5167,
      // Line 7 . Enter the smaller of line 6a or line 6b. This is the limitation based on the E Z
      "form-3805z.1.line.7_ez_income_limitation": 3200,
      // Part Two. Column (a) Credit name. Line 8 Hiring credit carryover, Row A. Column (e) Limita
      "form-3805z.1.line.8_hiring_credit_row_a_col_e": 3200,
      // Line 8 Hiring credit carryover, Row A. Column (f) Credit carryover used on Schedule P can
      "form-3805z.1.line.8_hiring_credit_row_a_col_f": 1400,
      // Line 8 Hiring credit carryover, Row B. Column (b) Total prior year carryover. Enter dollar
      "form-3805z.1.line.8_hiring_credit_row_b_col_b": 1400,
      // Line 8 Hiring credit carryover, Row B. Column (d) Total credit column (b) minus column (c)
      "form-3805z.1.line.8_hiring_credit_row_b_col_d": 1400,
      // Line 8 Hiring credit carryover, Row B. Column (e) Limitation based on E Z business income.
      "form-3805z.1.line.8_hiring_credit_row_b_col_e": 1400,
      // Line 9 Sales or use tax credit carryover, Row A. Column (e) Limitation based on E Z busine
      "form-3805z.1.line.9_sales_use_tax_credit_row_a_col_e": 1800,
      // Line 9 Sales or use tax credit carryover, Row A. Column (f) Credit carryover used on Sched
      "form-3805z.1.line.9_sales_use_tax_credit_row_a_col_f": 1800,
      // Line 9 Sales or use tax credit carryover, Row B. Column (b) Total prior year carryover. En
      "form-3805z.1.line.9_sales_use_tax_credit_row_b_col_b": 2600,
      // Line 9 Sales or use tax credit carryover, Row B. Column (d) Total credit column (b) minus
      "form-3805z.1.line.9_sales_use_tax_credit_row_b_col_d": 2600,
      // Line 9 Sales or use tax credit carryover, Row B. Column (e) Limitation based on E Z busine
      "form-3805z.1.line.9_sales_use_tax_credit_row_b_col_e": 1800,
      // Line 9 Sales or use tax credit carryover, Row B. Column (g) Total credit carryover column
      "form-3805z.1.line.9_sales_use_tax_credit_row_b_col_g": 800,
      // Zeros checked by hand: no FTB 3870 election, no NOL left, the hiring credit used in full.
      "form-3805z.0.line.1d_credit_elected_refundable": 0,
      "form-3805z.0.line.3c_ez_nol_carryover_future_years": 0,
      "form-3805z.1.line.8_hiring_credit_row_b_col_g": 0,
    },
    renderedText: {
      "form-3805z.0.header.b_ez_business_name": "Kestrel Machine Works",
      "form-3805z.0.header.d_enterprise_zone_name": "Fresno – City",
      "form-3805z.0.header.e_principal_business_activity_code": "332710",
      "form-3805z.0.line.2_average_apportionment_percentage": "70.15%",
    },
    // An individual skips Schedule Z line 2 and leaves column (c) blank.
    renderedBlank: [
      "form-3805z.1.line.2_average_apportionment_percentage",
      "form-3805z.1.line.8_hiring_credit_row_b_col_c",
      "form-3805z.1.line.9_sales_use_tax_credit_row_b_col_c",
    ],
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
      "form-540.line.13_federal_agi": 116169,
      // Line 14. California adjustments – subtractions. Enter the amount from Schedule CA (540), P
      "form-540.line.14_ca_adjustments_subtractions": 15000,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 101169,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 101169,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 95463,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 5320,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 153,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 5167,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 5167,
      // Line 43. Enter credit amount
      "form-540.line.43_credit_amount": 3200,
      // Line 47. Add line 40 through line 46. These are your total credits.
      "form-540.line.47_total_credits": 3200,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 1967,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 1967,
      // Line 72. 2025 California estimated tax and other payments. See instructions.
      "form-540.line.72_ca_estimated_tax_payments": 5000,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 5000,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 5000,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 5000,
      // Line 97. Overpaid tax. If line 95 is more than line 64, subtract line 64 from line 95.
      "form-540.line.97_overpaid_tax": 3033,
      // Line 99. Overpaid tax available this year. Subtract line 98 from line 97.
      "form-540.line.99_overpaid_tax_available": 3033,
      // Refund and Direct Deposit. Line 115. Refund or no amount due. Subtract the sum of line 110
      "form-540.line.115_refund_or_no_amount_due": 3033,
    },
    renderedText: {
      "form-540.line.43_credit_name": "Enterprise Zone",
      "form-540.line.43_credit_code": "176",
    },
    // One other credit: line 43 holds it; lines 44 and 45 stay blank.
    renderedBlank: ["form-540.line.44_credit_amount", "form-540.line.45_schedule_p_credits"],
  },
};

export function sareneExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
