/*
 * nisao — LOCKED expected values, drafted from the engine's
 * output on 2026-11-25 (scripts/draftExpected.ts).
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
      "schedule-c.0.line.1": 130000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 130000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 130000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 130000,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 10000,
      // Line 24a — Travel and meals: Travel
      "schedule-c.0.line.24a": 12000,
      // Line 17 — Legal and professional services
      "schedule-c.0.line.17": 8000,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 30000,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 100000,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 100000,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 100000,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 100000,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 92350,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 92350,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 92350,
      // Line 8a — Total social security wages and tips (total of boxes 3 and 7 on Form(s) W-2) and
      "schedule-se.0.line.8a": 176100,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 2678,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 2678,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 1339,
    },
  },
  "form-7203": {
    engineFields: {
      // Line 1 — Stock basis at the beginning of the corporation's tax year
      "form-7203.0.line.1_stock_basis_beginning": 500000,
      // Line 5 — Stock basis before distributions. Add lines 1, 2, and 4
      "form-7203.0.line.5_stock_basis_before_distributions": 500000,
      // Line 7 — Stock basis after distributions. Subtract line 6 from line 5
      "form-7203.0.line.7_stock_basis_after_distributions": 500000,
      // Line 10 — Stock basis before loss and deduction items. Subtract line 9 from line 7
      "form-7203.0.line.10_stock_basis_before_loss_items": 500000,
      // Line 11 — Allowable loss and deduction items. Enter the amount from line 47, column (c)
      "form-7203.0.line.11_allowable_loss_deduction_items": 350000,
      // Line 14 — Add lines 11, 12, and 13
      "form-7203.0.line.14_total_loss_restoration_other": 350000,
      // Line 15 — Stock basis at the end of the corporation's tax year. Subtract line 14 from line
      "form-7203.0.line.15_stock_basis_end": 150000,
      // Line 35 — Ordinary business loss — (a) Current year losses and deductions
      "form-7203.1.line.35_ordinary_business_loss_col_a": 350000,
      // Line 35 — Ordinary business loss — (c) Allowable loss from stock basis
      "form-7203.1.line.35_ordinary_business_loss_col_c": 350000,
      // Line 47 — Total loss. Add lines 35 through 46 for each column — (a) Current year losses an
      "form-7203.1.line.47_total_loss_col_a": 350000,
      // Line 47 — Total loss. Add lines 35 through 46 for each column — (c) Allowable loss from st
      "form-7203.1.line.47_total_loss_col_c": 350000,
    },
  },
  "schedule-e": {
    engineFields: {
      // Line 28 row A — (i) Nonpassive loss allowed (see Schedule K-1)
      "schedule-e.1.line.28_row_a_col_i_nonpassive_loss_allowed": 350000,
      // Line 29b — Totals, column (i) nonpassive loss allowed
      "schedule-e.1.line.29b_totals_col_i": 350000,
      // Line 31 — Add columns (g), (i), and (j) of line 29b
      "schedule-e.1.line.31_add_loss_columns": 350000,
      // Line 32 — Total partnership and S corporation income or (loss). Combine lines 30 and 31
      "schedule-e.1.line.32_total_partnership_s_corp_income": -350000,
      // Line 41 — Total income or (loss). Combine lines 26, 32, 37, 39, and 40
      "schedule-e.1.line.41_total_income_or_loss": -350000,
    },
  },
  "form-461": {
    engineFields: {
      // Line 2 — Enter amount from Schedule 1 (Form 1040), line 3
      "form-461.0.line.2_schedule_1_line_3": 100000,
      // Line 5 — Enter amount from Schedule 1 (Form 1040), line 5
      "form-461.0.line.5_schedule_1_line_5": -350000,
      // Line 9 — Combine lines 1 through 8
      "form-461.0.line.9_total_income_loss_items": -250000,
      // Line 14 — Add lines 9 and 13
      "form-461.0.line.14_net_business_income_loss": -250000,
      // Line 15 — Enter $313,000 (or $626,000 if married filing jointly)
      "form-461.0.line.15_threshold_amount": 313000,
      // Line 16 — Add lines 14 and 15
      "form-461.0.line.16_excess_business_loss": 63000,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 100000,
      // Line 5 — Rental real estate, royalties, partnerships, S corporations, trusts, etc. Attach
      "schedule-1.0.line.5": -350000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": -250000,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 1339,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 1339,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 2678,
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 2811,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 5489,
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
      // Line 8 — Self-employment income from Schedule SE (Form 1040), Part I, line 6
      "form-8959.0.line.8_self_employment_income": 92350,
      // Line 9 — Enter the following amount for your filing status
      "form-8959.0.line.9_filing_status_threshold_se": 200000,
      // Line 10 — Enter the amount from line 4
      "form-8959.0.line.10_medicare_wages_from_line4": 420000,
      // Line 12 — Subtract line 11 from line 8. If zero or less, enter -0-
      "form-8959.0.line.12_excess_se_income": 92350,
      // Line 13 — Additional Medicare Tax on self-employment income. Multiply line 12 by 0.9% (0.0
      "form-8959.0.line.13_additional_medicare_tax_se": 831,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 2811,
      // Line 19 — Medicare tax withheld from Form W-2, box 6
      "form-8959.0.line.19_medicare_tax_withheld": 7710,
      // Line 20 — Enter the amount from line 1
      "form-8959.0.line.20_medicare_wages_from_line1": 420000,
      // Line 21 — Multiply line 20 by 1.45% (0.0145). Regular Medicare tax withholding on Medicare
      "form-8959.0.line.21_regular_medicare_tax_on_wages": 6090,
      // Line 22 — Subtract line 21 from line 19. If zero or less, enter -0-. Additional Medicare T
      "form-8959.0.line.22_additional_medicare_tax_withholding_wages": 1620,
      // Line 24 — Total Additional Medicare Tax withholding. Add lines 22 and 23
      "form-8959.0.line.24_total_additional_medicare_tax_withholding": 1620,
    },
  },
  "form-8995-a": {
    engineFields: {
      // Line 2 — Qualified business income from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.2_a": 98661,
      // Line 3 — Multiply line 2 by 20% (0.20) (Column A)
      "form-8995-a.0.line.3_a": 19732,
      // Line 13 — Qualified business income deduction before patron reduction. Enter the greater o
      "form-8995-a.0.line.13_a": 19732,
      // Line 15 — Qualified business income component. Subtract line 14 from line 13 (Column A)
      "form-8995-a.0.line.15_a": 19732,
      // Line 16 — Total qualified business income component. Add all amounts reported on line 15
      "form-8995-a.0.line.16": 19732,
      // Line 27 — Total qualified business income component from all qualified trades, businesses,
      "form-8995-a.1.line.27": 19732,
      // Line 32 — Qualified business income deduction before the income limitation. Add lines 27 a
      "form-8995-a.1.line.32": 19732,
      // Line 33 — Taxable income before qualified business income deduction
      "form-8995-a.1.line.33": 152911,
      // Line 35 — Subtract line 34 from line 33. If zero or less, enter -0-
      "form-8995-a.1.line.35": 152911,
      // Line 36 — Income limitation. Multiply line 35 by 20% (0.20)
      "form-8995-a.1.line.36": 30582,
      // Line 37 — Qualified business income deduction before the domestic production activities de
      "form-8995-a.1.line.37": 19732,
      // Line 39 — Total qualified business income deduction. Add lines 37 and 38
      "form-8995-a.1.line.39": 19732,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 420000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 420000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": -250000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 170000,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 1339,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 168661,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 168661,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 19732,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 35482,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 133179,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 24810,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 24810,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 24810,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 5489,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 30299,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 95000,
      // Line 25c — Federal income tax withheld from other forms (see instructions)
      "form-1040.line.25c": 1620,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 96620,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 96620,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 66321,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 66321,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Part One. Income Adjustment Schedule. Section A. Income from federal Form 1040 or 1040-SR.
      "schedule-ca.0.line.1a_federal": 420000,
      // Line 1z. Add line 1a through line 1i. Column A. Federal Amounts.
      "schedule-ca.0.line.1z_federal": 420000,
      // Line 3 . Business income or (loss). See instructions. Column A. Federal Amounts.
      "schedule-ca.0.line.b3_federal": 100000,
      // Line 5. Rental real estate, royalties, partnerships, S corporations, trusts, etcetera. Col
      "schedule-ca.0.line.b5_federal": -350000,
      // Line 8z. Column B. Subtractions.
      "schedule-ca.1.line.b8z_subtractions": 63000,
      // Line 9 a. Column B. Subtractions.
      "schedule-ca.2.line.b9a_subtractions": 63000,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 170000,
      // Line 10. Column B. Subtractions.
      "schedule-ca.2.line.b10_subtractions": 63000,
      // Line 15. Deductible part of self-employment tax. See instructions. Column A. Federal Amoun
      "schedule-ca.2.line.c15_federal": 1339,
      // Line 26. Add line 11 through line 23 and line 25 in columns A, B, and C. See instructions.
      "schedule-ca.3.line.c26_federal": 1339,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 168661,
      // Line 27. Column B. Subtractions.
      "schedule-ca.3.line.c27_subtractions": 63000,
      // Line 30. Enter the larger of the amount on line 29 or your standard deduction shown below:
      "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 5706,
    },
  },
  "form-3461": {
    engineFields: {
      // Part I, Line 2. Enter amount from Schedule C A (540), Part I, Section B, line 3, column A
      "form-3461.0.line.2_schedule_ca_section_b_line_3": 100000,
      // Line 5. Enter amount from Schedule C A (540), Part I, Section B, line 5, column A minus co
      "form-3461.0.line.5_schedule_ca_section_b_line_5": -350000,
      // Line 9. Combine line 1 through line 8.
      "form-3461.0.line.9_total_income_loss_items": -250000,
      // Line 14a. Add line 9 and line 13.
      "form-3461.0.line.14a_business_income_or_loss": -250000,
      // Line 14b. Excess business losses carryover from prior years. See instructions.
      "form-3461.0.line.14b_prior_year_excess_loss_carryover": -200000,
      // Line 14c. Total business losses. Add line 14a and line 14b.
      "form-3461.0.line.14c_total_business_losses": -450000,
      // Line 15. Enter $313,000 (or $626,000 if married/R D P filing jointly). See instructions.
      "form-3461.0.line.15_threshold_amount": 313000,
      // Line 16. Add line 14c and line 15. If the result is zero or greater, you do not have exces
      "form-3461.0.line.16_excess_business_loss": -137000,
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
      "form-540.line.13_federal_agi": 168661,
      // Line 14. California adjustments – subtractions. Enter the amount from Schedule CA (540), P
      "form-540.line.14_ca_adjustments_subtractions": 63000,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 105661,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 105661,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 99955,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 5736,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 153,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 5583,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 5583,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 5583,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 5583,
      // Payments. Line 71. California income tax withheld. See instructions.
      "form-540.line.71_ca_income_tax_withheld": 36000,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 36000,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 36000,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 36000,
      // Line 97. Overpaid tax. If line 95 is more than line 64, subtract line 64 from line 95.
      "form-540.line.97_overpaid_tax": 30417,
      // Line 99. Overpaid tax available this year. Subtract line 98 from line 97.
      "form-540.line.99_overpaid_tax_available": 30417,
      // Refund and Direct Deposit. Line 115. Refund or no amount due. Subtract the sum of line 110
      "form-540.line.115_refund_or_no_amount_due": 30417,
    },
  },
};

export function nisaoExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
