/*
 * beslan — LOCKED expected values, drafted from the engine's
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
  "form-4797": {
    engineFields: {
      // Line 2, row 1 — (d) Gross sales price
      "form-4797.0.line.2_row1_col_d": 80000,
      // Line 2, row 1 — (f) Cost or other basis, plus improvements and expense of sale
      "form-4797.0.line.2_row1_col_f": 50000,
      // Line 2, row 1 — (g) Gain or (loss). Subtract (f) from the sum of (d) and (e)
      "form-4797.0.line.2_row1_col_g": 30000,
      // Line 6 — Gain, if any, from line 32, from other than casualty or theft
      "form-4797.0.line.6_gain_from_line_32": 102000,
      // Line 7 — Combine lines 2 through 6. Enter the gain or (loss) here and on the appropriate l
      "form-4797.0.line.7_net_section_1231_gain_loss": 132000,
      // Line 10, row 1 — (d) Gross sales price
      "form-4797.0.line.10_row1_col_d": 30000,
      // Line 10, row 1 — (e) Depreciation allowed or allowable since acquisition
      "form-4797.0.line.10_row1_col_e": 6800,
      // Line 10, row 1 — (f) Cost or other basis, plus improvements and expense of sale
      "form-4797.0.line.10_row1_col_f": 34000,
      // Line 10, row 1 — (g) Gain or (loss). Subtract (f) from the sum of (d) and (e)
      "form-4797.0.line.10_row1_col_g": 2800,
      // Line 13 — Gain, if any, from line 31
      "form-4797.0.line.13_gain_from_line_31": 6000,
      // Line 17 — Combine lines 10 through 16
      "form-4797.0.line.17_ordinary_gain_loss_total": 8800,
      // Line 18b — Redetermine the gain or (loss) on line 17 excluding the loss, if any, on line 1
      "form-4797.0.line.18b_redetermined_ordinary_gain_loss": 8800,
      // Line 20 — Gross sales price — Property A
      "form-4797.1.line.20_gross_sales_price_col_a": 300000,
      // Line 20 — Gross sales price — Property B
      "form-4797.1.line.20_gross_sales_price_col_b": 12000,
      // Line 21 — Cost or other basis plus expense of sale — Property A
      "form-4797.1.line.21_cost_basis_plus_expense_col_a": 258000,
      // Line 21 — Cost or other basis plus expense of sale — Property B
      "form-4797.1.line.21_cost_basis_plus_expense_col_b": 20000,
      // Line 22 — Depreciation (or depletion) allowed or allowable — Property A
      "form-4797.1.line.22_depreciation_allowed_col_a": 60000,
      // Line 22 — Depreciation (or depletion) allowed or allowable — Property B
      "form-4797.1.line.22_depreciation_allowed_col_b": 14000,
      // Line 23 — Adjusted basis. Subtract line 22 from line 21 — Property A
      "form-4797.1.line.23_adjusted_basis_col_a": 198000,
      // Line 23 — Adjusted basis. Subtract line 22 from line 21 — Property B
      "form-4797.1.line.23_adjusted_basis_col_b": 6000,
      // Line 24 — Total gain. Subtract line 23 from line 20 — Property A
      "form-4797.1.line.24_total_gain_col_a": 102000,
      // Line 24 — Total gain. Subtract line 23 from line 20 — Property B
      "form-4797.1.line.24_total_gain_col_b": 6000,
      // Line 25a — If section 1245 property: Depreciation allowed or allowable from line 22 — Prop
      "form-4797.1.line.25a_sec_1245_depreciation_col_b": 14000,
      // Line 25b — If section 1245 property: Enter the smaller of line 24 or 25a — Property B
      "form-4797.1.line.25b_sec_1245_smaller_amount_col_b": 6000,
      // Line 30 — Total gains for all properties. Add property columns A through D, line 24
      "form-4797.1.line.30_total_gains_all_properties": 108000,
      // Line 31 — Add property columns A through D, lines 25b, 26g, 27c, 28b, and 29b
      "form-4797.1.line.31_total_recapture_amounts": 6000,
      // Line 32 — Subtract line 31 from line 30
      "form-4797.1.line.32_gain_less_recapture": 102000,
      // Line 33 — Section 179 expense deduction or depreciation allowable in prior years — (b) Sec
      "form-4797.1.line.33_sec_179_or_depreciation_prior_years_col_b": 12000,
      // Line 34 — Recomputed depreciation — (b) Section 280F(b)(2)
      "form-4797.1.line.34_recomputed_depreciation_col_b": 9000,
      // Line 35 — Recapture amount. Subtract line 34 from line 33 — (b) Section 280F(b)(2)
      "form-4797.1.line.35_recapture_amount_col_b": 3000,
    },
  },
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 120000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 120000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 120000,
      // Line 6 — Other income, including federal and state gasoline or fuel tax credit or refund
      "schedule-c.0.line.6": 3000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 123000,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 30000,
      // Line 13 — Depreciation and section 179 expense deduction (not included in Part III)
      "schedule-c.0.line.13": 6000,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 5000,
      // Line 25 — Utilities
      "schedule-c.0.line.25": 9000,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 50000,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 73000,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 73000,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 73000,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 73000,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 67416,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 67416,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 67416,
      // Line 8a — Total social security wages and tips (total of boxes 3 and 7 on Form(s) W-2) and
      "schedule-se.0.line.8a": 18000,
      // Line 8d — Add lines 8a, 8b, and 8c
      "schedule-se.0.line.8d": 18000,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 158100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 8360,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 1955,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 10315,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 5158,
    },
  },
  "schedule-d": {
    engineFields: {
      // Line 11 — Gain from Form 4797, Part I; long-term gain from Forms 2439 and 6252; and long-t
      "schedule-d.0.line.11_long_term_gain_other_forms": 132000,
      // Line 15 — Net long-term capital gain or (loss). Combine lines 8a through 14 in column (h)
      "schedule-d.0.line.15_net_long_term_gain_loss": 132000,
      // Line 16 — Combine lines 7 and 15 and enter the result
      "schedule-d.1.line.16_combined_gain_loss": 132000,
      // Line 19 — If you are required to complete the Unrecaptured Section 1250 Gain Worksheet, en
      "schedule-d.1.line.19_unrecaptured_sec1250_gain": 60000,
    },
  },
  "form-8995-a": {
    engineFields: {
      // Line 2 — Qualified business income from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.2_a": 76642,
      // Line 3 — Multiply line 2 by 20% (0.20) (Column A)
      "form-8995-a.0.line.3_a": 15328,
      // Line 12 — Phased-in reduction. Enter the amount from line 26, if any (Column A)
      "form-8995-a.0.line.12_a": 11161,
      // Line 13 — Qualified business income deduction before patron reduction. Enter the greater o
      "form-8995-a.0.line.13_a": 11161,
      // Line 15 — Qualified business income component. Subtract line 14 from line 13 (Column A)
      "form-8995-a.0.line.15_a": 11161,
      // Line 16 — Total qualified business income component. Add all amounts reported on line 15
      "form-8995-a.0.line.16": 11161,
      // Line 17 — Enter the amounts from line 3, Column A
      "form-8995-a.1.line.17_a": 15328,
      // Line 19 — Subtract line 18 from line 17, Column A
      "form-8995-a.1.line.19_a": 15328,
      // Line 20 — Taxable income before qualified business income deduction
      "form-8995-a.1.line.20": 210892,
      // Line 21 — Threshold. Enter $197,300 ($394,600 if married filing jointly)
      "form-8995-a.1.line.21": 197300,
      // Line 22 — Subtract line 21 from line 20
      "form-8995-a.1.line.22": 13592,
      // Line 23 — Phase-in range. Enter $50,000 ($100,000 if married filing jointly)
      "form-8995-a.1.line.23": 50000,
      // Line 25 — Total phase-in reduction. Multiply line 19 by line 24, Column A
      "form-8995-a.1.line.25_a": 4167,
      // Line 26 — Qualified business income after phase-in reduction, Column A
      "form-8995-a.1.line.26_a": 11161,
      // Line 27 — Total qualified business income component from all qualified trades, businesses,
      "form-8995-a.1.line.27": 11161,
      // Line 32 — Qualified business income deduction before the income limitation. Add lines 27 a
      "form-8995-a.1.line.32": 11161,
      // Line 33 — Taxable income before qualified business income deduction
      "form-8995-a.1.line.33": 210892,
      // Line 34 — Enter your net capital gain, if any, increased by any qualified dividends
      "form-8995-a.1.line.34": 132000,
      // Line 35 — Subtract line 34 from line 33. If zero or less, enter -0-
      "form-8995-a.1.line.35": 78892,
      // Line 36 — Income limitation. Multiply line 35 by 20% (0.20)
      "form-8995-a.1.line.36": 15778,
      // Line 37 — Qualified business income deduction before the domestic production activities de
      "form-8995-a.1.line.37": 11161,
      // Line 39 — Total qualified business income deduction. Add lines 37 and 38
      "form-8995-a.1.line.39": 11161,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 73000,
      // Line 4 — Other gains or (losses)
      "schedule-1.0.line.4": 8800,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 81800,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 5158,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 5158,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 10315,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 10315,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 18000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 18000,
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": 132000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 81800,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 231800,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 5158,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 226642,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 226642,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 11161,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 26911,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 199731,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 34302,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 34302,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 34302,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 10315,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 44617,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 1200,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 1200,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 1200,
      // Line 37 — Amount you owe
      "form-1040.line.37": 43417,
    },
  },
  "schedule-d-1": {
    engineFields: {
      // Line 2(d). Gross sales price (1).
      "schedule-d-1.0.line.2_row1_col_d": 80000,
      // Line 2(f). Cost or other basis, plus improvements and expense of sale (1).
      "schedule-d-1.0.line.2_row1_col_f": 50000,
      // Line 2(g). Gain or (Loss) Subtract (f) from the sum of (d) and (e) (1).
      "schedule-d-1.0.line.2_row1_col_g": 30000,
      // Line 6. Gain, if any, from line 35, from other than casualty and theft.
      "schedule-d-1.0.line.6_gain_from_line_35": 92000,
      // Line 7. Combine line 2 through line 6. Enter gain or (loss) here and on the appropriate li
      "schedule-d-1.0.line.7_net_section_1231_gain_loss": 122000,
      // Line 10(d). Gross sales price (1).
      "schedule-d-1.0.line.10_row1_col_d": 30000,
      // Line 10(e). Depreciation allowed or allowable since acquisition (1).
      "schedule-d-1.0.line.10_row1_col_e": 6800,
      // Line 10(f). Cost or other basis, plus improvements and expense of sale (1).
      "schedule-d-1.0.line.10_row1_col_f": 31000,
      // Line 10(g). Gain or (Loss) Subtract (f) from the sum of (d) and (e) (1).
      "schedule-d-1.0.line.10_row1_col_g": 5800,
      // Line 13. Gain, if any, from line 34.
      "schedule-d-1.0.line.13_gain_from_line_34": 8000,
      // Line 17. Combine line 10 through line 16.
      "schedule-d-1.0.line.17_total_ordinary_gain_loss": 13800,
      // Line 18b. Redetermine the gain or (loss) on line 17, excluding the loss, if any, on line 1
      "schedule-d-1.0.line.18b_redetermined_gain_loss": 13800,
      // Part II, Section B, Line 19. Enter ordinary federal gain or (loss) from federal Schedule 1
      "schedule-d-1.1.line.19_federal_ordinary_gain_loss": 8800,
      // Line 20. Enter ordinary California gain or (loss) from line 18b.
      "schedule-d-1.1.line.20_california_ordinary_gain_loss": 13800,
      // Line 21b. If line 20 is more than line 19, enter the difference here and on Schedule C A (
      "schedule-d-1.1.line.21b_california_exceeds_federal_difference": 5000,
      // Line 23. Gross sales price, Property A.
      "schedule-d-1.1.line.23_gross_sales_price_col_a": 300000,
      // Line 23. Gross sales price, Property B.
      "schedule-d-1.1.line.23_gross_sales_price_col_b": 12000,
      // Line 24. Cost or other basis plus expense of sale, Property A.
      "schedule-d-1.1.line.24_cost_basis_plus_expense_col_a": 268000,
      // Line 24. Cost or other basis plus expense of sale, Property B.
      "schedule-d-1.1.line.24_cost_basis_plus_expense_col_b": 18000,
      // Line 25. Depreciation (or depletion) allowed or allowable, Property A.
      "schedule-d-1.1.line.25_depreciation_allowed_col_a": 60000,
      // Line 25. Depreciation (or depletion) allowed or allowable, Property B.
      "schedule-d-1.1.line.25_depreciation_allowed_col_b": 14000,
      // Line 26. Adjusted basis. Subtract line 25 from line 24, Property A.
      "schedule-d-1.1.line.26_adjusted_basis_col_a": 208000,
      // Line 26. Adjusted basis. Subtract line 25 from line 24, Property B.
      "schedule-d-1.1.line.26_adjusted_basis_col_b": 4000,
      // Line 27. Total gain. Subtract line 26 from line 23, Property A.
      "schedule-d-1.1.line.27_total_gain_col_a": 92000,
      // Line 27. Total gain. Subtract line 26 from line 23, Property B.
      "schedule-d-1.1.line.27_total_gain_col_b": 8000,
      // Line 28a. Depreciation allowed or allowable from line 25, Property B.
      "schedule-d-1.1.line.28a_sec_1245_depreciation_col_b": 14000,
      // Line 28b. Enter the smaller of line 27 or line 28a, Property B.
      "schedule-d-1.1.line.28b_sec_1245_smaller_amount_col_b": 8000,
      // Line 33. Total gains for all properties. Add column A through column D of line 27.
      "schedule-d-1.1.line.33_total_gains_all_properties": 100000,
      // Line 34. Add column A through column D of lines 28b, 29g, 30c, 31b, and 32b. Enter here an
      "schedule-d-1.1.line.34_total_recapture_ordinary_income": 8000,
      // Line 35. Subtract line 34 from line 33. Enter the portion from other than casualty and the
      "schedule-d-1.1.line.35_gain_less_recapture": 92000,
      // Line 36. Expense deductions or recovery deductions. See instructions, (b) Recovery deducti
      "schedule-d-1.1.line.36_expense_or_recovery_deductions_col_b": 10000,
      // Line 37. Depreciation or recovery deductions. See instructions, (b) Recovery deductions.
      "schedule-d-1.1.line.37_depreciation_or_recovery_deductions_col_b": 6000,
      // Line 38. Recapture amount. Subtract line 37 from line 36. See instructions, (b) Recovery d
      "schedule-d-1.1.line.38_recapture_amount_col_b": 4000,
    },
  },
  "schedule-d-ca": {
    engineFields: {
      // Line 1 a . (e) Gain. If (b) is more than (c), subtract (c) from (b).
      "schedule-d-ca.0.line.1a.gain": 122000,
      // Line 4 . Total 2025 gains from all sources. Add column (e) amounts of line 1, line 2, and
      "schedule-d-ca.3.line.4": 122000,
      // Line 8 . Net gain or (loss). Combine line 4 and line 7. If a loss, go to line 9. If a gain
      "schedule-d-ca.3.line.8": 122000,
      // Line 10 . Enter the gain or (loss) from federal Form 1040 or 1040-SR, line 7a.
      "schedule-d-ca.3.line.10": 132000,
      // Line 11 . Enter the California gain from line 8 or (loss) from line 9.
      "schedule-d-ca.3.line.11": 122000,
      // Line 12 a . If line 10 is more than line 11, enter the difference here and on Schedule CA
      "schedule-d-ca.3.line.12a": 10000,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Part One. Income Adjustment Schedule. Section A. Income from federal Form 1040 or 1040-SR.
      "schedule-ca.0.line.1a_federal": 18000,
      // Line 1z. Add line 1a through line 1i. Column A. Federal Amounts.
      "schedule-ca.0.line.1z_federal": 18000,
      // Line 7a. Capital gain or (loss). See instructions. Column A. Federal Amounts.
      "schedule-ca.0.line.7a_federal": 132000,
      // Line 7a. Column B. Subtractions.
      "schedule-ca.0.line.7a_subtractions": 10000,
      // Line 3 . Business income or (loss). See instructions. Column A. Federal Amounts.
      "schedule-ca.0.line.b3_federal": 73000,
      // Line 3 . Column C. Additions.
      "schedule-ca.0.line.b3_additions": 1000,
      // Line 4. Other gains or (losses). Column A. Federal Amounts.
      "schedule-ca.0.line.b4_federal": 8800,
      // Line 4. Column C. Additions.
      "schedule-ca.0.line.b4_additions": 5000,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 231800,
      // Line 10. Column B. Subtractions.
      "schedule-ca.2.line.b10_subtractions": 10000,
      // Line 10. Column C. Additions.
      "schedule-ca.2.line.b10_additions": 6000,
      // Line 15. Deductible part of self-employment tax. See instructions. Column A. Federal Amoun
      "schedule-ca.2.line.c15_federal": 5158,
      // Line 26. Add line 11 through line 23 and line 25 in columns A, B, and C. See instructions.
      "schedule-ca.3.line.c26_federal": 5158,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 226642,
      // Line 27. Column B. Subtractions.
      "schedule-ca.3.line.c27_subtractions": 10000,
      // Line 27. Column C. Additions.
      "schedule-ca.3.line.c27_additions": 6000,
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
      // Taxable Income. Line 12. State wages from your federal Form or Forms W-2, box 16 .
      "form-540.line.12_state_wages": 18000,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040 or 1040-SR, li
      "form-540.line.13_federal_agi": 226642,
      // Line 14. California adjustments – subtractions. Enter the amount from Schedule CA (540), P
      "form-540.line.14_ca_adjustments_subtractions": 10000,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 216642,
      // Line 16. California adjustments – additions. Enter the amount from Schedule CA (540), Part
      "form-540.line.16_ca_adjustments_additions": 6000,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 222642,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 216936,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 16614,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 153,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 16461,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 16461,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 16461,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 16461,
      // Payments. Line 71. California income tax withheld. See instructions.
      "form-540.line.71_ca_income_tax_withheld": 450,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 450,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 450,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 450,
      // Line 100. Tax due. If line 95 is less than line 64, subtract line 95 from line 64.
      "form-540.line.100_tax_due": 16011,
      // Amount You Owe. Line 111. Amount You Owe. If you do not have an amount on line 99, add lin
      "form-540.line.111_amount_you_owe": 16011,
      // Line 114. Total amount due. See instructions. Enclose, but do not staple, any payment.
      "form-540.line.114_total_amount_due": 16011,
    },
  },
};

export function beslanExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
