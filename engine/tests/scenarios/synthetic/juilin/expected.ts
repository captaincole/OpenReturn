/*
 * juilin — LOCKED expected values, drafted from the engine's
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
  "schedule-b": {
    engineFields: {
      // Line 5 — Amount (row 1)
      "schedule-b.0.line.5_amount_1": 2400,
      // Line 6 — Add the amounts on line 5. Enter the total here and on Form 1040 or 1040-SR, line
      "schedule-b.0.line.6_total_ordinary_dividends": 2400,
    },
  },
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 60000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 60000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 60000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 60000,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 6000,
      // Line 24a — Travel and meals: Travel
      "schedule-c.0.line.24a": 7000,
      // Line 17 — Legal and professional services
      "schedule-c.0.line.17": 5000,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 18000,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 42000,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 42000,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 42000,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 42000,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 38787,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 38787,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 38787,
      // Line 8a — Total social security wages and tips (total of boxes 3 and 7 on Form(s) W-2) and
      "schedule-se.0.line.8a": 176100,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 1125,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 1125,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 563,
    },
  },
  "form-7203": {
    engineFields: {
      // Line 1 — Stock basis at the beginning of the corporation's tax year
      "form-7203.0.line.1_stock_basis_beginning": 900000,
      // Line 5 — Stock basis before distributions. Add lines 1, 2, and 4
      "form-7203.0.line.5_stock_basis_before_distributions": 900000,
      // Line 7 — Stock basis after distributions. Subtract line 6 from line 5
      "form-7203.0.line.7_stock_basis_after_distributions": 900000,
      // Line 10 — Stock basis before loss and deduction items. Subtract line 9 from line 7
      "form-7203.0.line.10_stock_basis_before_loss_items": 900000,
      // Line 11 — Allowable loss and deduction items. Enter the amount from line 47, column (c)
      "form-7203.0.line.11_allowable_loss_deduction_items": 650000,
      // Line 14 — Add lines 11, 12, and 13
      "form-7203.0.line.14_total_loss_restoration_other": 650000,
      // Line 15 — Stock basis at the end of the corporation's tax year. Subtract line 14 from line
      "form-7203.0.line.15_stock_basis_end": 250000,
      // Line 35 — Ordinary business loss — (a) Current year losses and deductions
      "form-7203.1.line.35_ordinary_business_loss_col_a": 650000,
      // Line 35 — Ordinary business loss — (c) Allowable loss from stock basis
      "form-7203.1.line.35_ordinary_business_loss_col_c": 650000,
      // Line 47 — Total loss. Add lines 35 through 46 for each column — (a) Current year losses an
      "form-7203.1.line.47_total_loss_col_a": 650000,
      // Line 47 — Total loss. Add lines 35 through 46 for each column — (c) Allowable loss from st
      "form-7203.1.line.47_total_loss_col_c": 650000,
    },
  },
  "schedule-e": {
    engineFields: {
      // Line 2 — Fair Rental Days (Property A)
      "schedule-e.0.line.2_fair_rental_days_a": 365,
      // Line 3 — Rents received (Property A)
      "schedule-e.0.line.3_rents_received_a": 24000,
      // Line 4 — Royalties received (Property B)
      "schedule-e.0.line.4_royalties_received_b": 2000,
      // Line 9 — Insurance (Property A)
      "schedule-e.0.line.9_insurance_a": 1500,
      // Line 10 — Legal and other professional fees (Property B)
      "schedule-e.0.line.10_legal_professional_fees_b": 3500,
      // Line 11 — Management fees (Property A)
      "schedule-e.0.line.11_management_fees_a": 2400,
      // Line 14 — Repairs (Property A)
      "schedule-e.0.line.14_repairs_a": 2500,
      // Line 16 — Taxes (Property A)
      "schedule-e.0.line.16_taxes_a": 3000,
      // Line 18 — Depreciation expense or depletion (Property A)
      "schedule-e.0.line.18_depreciation_or_depletion_a": 2600,
      // Line 20 — Total expenses. Add lines 5 through 19 (Property A)
      "schedule-e.0.line.20_total_expenses_a": 12000,
      // Line 20 — Total expenses. Add lines 5 through 19 (Property B)
      "schedule-e.0.line.20_total_expenses_b": 3500,
      // Line 21 — Subtract line 20 from line 3 (rents) and/or 4 (royalties) (Property A)
      "schedule-e.0.line.21_income_or_loss_a": 12000,
      // Line 21 — Subtract line 20 from line 3 (rents) and/or 4 (royalties) (Property B)
      "schedule-e.0.line.21_income_or_loss_b": -1500,
      // Line 23a — Total of all amounts reported on line 3 for all rental properties
      "schedule-e.0.line.23a_total_rents": 24000,
      // Line 23b — Total of all amounts reported on line 4 for all royalty properties
      "schedule-e.0.line.23b_total_royalties": 2000,
      // Line 23d — Total of all amounts reported on line 18 for all properties
      "schedule-e.0.line.23d_total_depreciation": 2600,
      // Line 23e — Total of all amounts reported on line 20 for all properties
      "schedule-e.0.line.23e_total_expenses": 15500,
      // Line 24 — Income. Add positive amounts shown on line 21. Do not include any losses
      "schedule-e.0.line.24_income": 12000,
      // Line 25 — Losses. Add royalty losses from line 21 and rental real estate losses from line
      "schedule-e.0.line.25_losses": 1500,
      // Line 26 — Total rental real estate and royalty income or (loss). Combine lines 24 and 25
      "schedule-e.0.line.26_total_income_or_loss": 10500,
      // Line 28 row A — (i) Nonpassive loss allowed (see Schedule K-1)
      "schedule-e.1.line.28_row_a_col_i_nonpassive_loss_allowed": 650000,
      // Line 29b — Totals, column (i) nonpassive loss allowed
      "schedule-e.1.line.29b_totals_col_i": 650000,
      // Line 31 — Add columns (g), (i), and (j) of line 29b
      "schedule-e.1.line.31_add_loss_columns": 650000,
      // Line 32 — Total partnership and S corporation income or (loss). Combine lines 30 and 31
      "schedule-e.1.line.32_total_partnership_s_corp_income": -650000,
      // Line 41 — Total income or (loss). Combine lines 26, 32, 37, 39, and 40
      "schedule-e.1.line.41_total_income_or_loss": -639500,
    },
  },
  "form-8582": {
    engineFields: {
      // Line 1a — Rental real estate activities with active participation: activities with net inc
      "form-8582.0.line.1a_rental_net_income": 12000,
      // Line 1d — Combine lines 1a, 1b, and 1c
      "form-8582.0.line.1d_rental_combined": 12000,
      // Line 3 — Combine lines 1d and 2d and subtract any prior year unallowed CRD
      "form-8582.0.line.3_combined": 12000,
      // Part IV Row 1 — (a) Current year net income (line 1a)
      "form-8582.0.part4.row_1_col_a_net_income": 12000,
      // Part IV Row 1 — (d) Overall gain
      "form-8582.0.part4.row_1_col_d_gain": 12000,
      // Part IV Total — (a) Current year net income (line 1a)
      "form-8582.0.part4.total_col_a_net_income": 12000,
    },
  },
  "form-461": {
    engineFields: {
      // Line 2 — Enter amount from Schedule 1 (Form 1040), line 3
      "form-461.0.line.2_schedule_1_line_3": 42000,
      // Line 3 — Enter amount from Form 1040 or 1040-SR, line 7a
      "form-461.0.line.3_form_1040_line_7a": 30000,
      // Line 5 — Enter amount from Schedule 1 (Form 1040), line 5
      "form-461.0.line.5_schedule_1_line_5": -639500,
      // Line 8 — Enter other income, gain, or losses from a trade or business not reported on line
      "form-461.0.line.8_other_business_income_loss": 6000,
      // Line 9 — Combine lines 1 through 8
      "form-461.0.line.9_total_income_loss_items": -561500,
      // Line 10 — Enter any income or gain reported on lines 1 through 8 that is not attributable
      "form-461.0.line.10_nonbusiness_income_gain": 42000,
      // Line 11 — Enter any losses or deductions reported on lines 1 through 8 that are not attrib
      "form-461.0.line.11_nonbusiness_losses_deductions": 1500,
      // Line 12 — Subtract line 11 from line 10
      "form-461.0.line.12_nonbusiness_net_adjustment": 40500,
      // Line 13 — If line 12 is a negative number, enter it here as a positive number. If line 12
      "form-461.0.line.13_line_12_sign_reversed": -40500,
      // Line 14 — Add lines 9 and 13
      "form-461.0.line.14_net_business_income_loss": -602000,
      // Line 15 — Enter $313,000 (or $626,000 if married filing jointly)
      "form-461.0.line.15_threshold_amount": 313000,
      // Line 16 — Add lines 14 and 15
      "form-461.0.line.16_excess_business_loss": -289000,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 42000,
      // Line 5 — Rental real estate, royalties, partnerships, S corporations, trusts, etc. Attach
      "schedule-1.0.line.5": -639500,
      // Line 8p — Section 461(l) excess business loss adjustment
      "schedule-1.0.line.8p": 289000,
      // Line 8z — Other income amount
      "schedule-1.0.line.8z": 6000,
      // Line 9 — Total other income. Add lines 8a through 8z
      "schedule-1.0.line.9": 295000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": -302500,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 563,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 563,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 1125,
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 1969,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 3094,
    },
  },
  "form-8959": {
    engineFields: {
      // Line 1 — Medicare wages and tips from Form W-2, box 5
      "form-8959.0.line.1_medicare_wages_tips": 380000,
      // Line 4 — Add lines 1 through 3
      "form-8959.0.line.4_total_medicare_wages": 380000,
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 200000,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-8959.0.line.6_excess_medicare_wages": 180000,
      // Line 7 — Additional Medicare Tax on Medicare wages. Multiply line 6 by 0.9% (0.009)
      "form-8959.0.line.7_additional_medicare_tax_wages": 1620,
      // Line 8 — Self-employment income from Schedule SE (Form 1040), Part I, line 6
      "form-8959.0.line.8_self_employment_income": 38787,
      // Line 9 — Enter the following amount for your filing status
      "form-8959.0.line.9_filing_status_threshold_se": 200000,
      // Line 10 — Enter the amount from line 4
      "form-8959.0.line.10_medicare_wages_from_line4": 380000,
      // Line 12 — Subtract line 11 from line 8. If zero or less, enter -0-
      "form-8959.0.line.12_excess_se_income": 38787,
      // Line 13 — Additional Medicare Tax on self-employment income. Multiply line 12 by 0.9% (0.0
      "form-8959.0.line.13_additional_medicare_tax_se": 349,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 1969,
      // Line 19 — Medicare tax withheld from Form W-2, box 6
      "form-8959.0.line.19_medicare_tax_withheld": 7130,
      // Line 20 — Enter the amount from line 1
      "form-8959.0.line.20_medicare_wages_from_line1": 380000,
      // Line 21 — Multiply line 20 by 1.45% (0.0145). Regular Medicare tax withholding on Medicare
      "form-8959.0.line.21_regular_medicare_tax_on_wages": 5510,
      // Line 22 — Subtract line 21 from line 19. If zero or less, enter -0-. Additional Medicare T
      "form-8959.0.line.22_additional_medicare_tax_withholding_wages": 1620,
      // Line 24 — Total Additional Medicare Tax withholding. Add lines 22 and 23
      "form-8959.0.line.24_total_additional_medicare_tax_withholding": 1620,
    },
  },
  "form-8960": {
    engineFields: {
      // Line 2 — Ordinary dividends (see instructions)
      "form-8960.0.line.2": 2400,
      // Line 4a — Rental real estate, royalties, partnerships, S corporations, trusts, trades or b
      "form-8960.0.line.4a": -597500,
      // Line 4b — Adjustment for net income or loss derived in the ordinary course of a non-sectio
      "form-8960.0.line.4b": 608000,
      // Line 4c — Combine lines 4a and 4b
      "form-8960.0.line.4c": 10500,
      // Line 5a — Net gain or loss from disposition of property (see instructions)
      "form-8960.0.line.5a": 30000,
      // Line 5d — Combine lines 5a through 5c
      "form-8960.0.line.5d": 30000,
      // Line 8 — Total investment income. Combine lines 1, 2, 3, 4c, 5d, 6, and 7
      "form-8960.0.line.8": 42900,
      // Line 12 — Net investment income. Subtract Part II, line 11, from Part I, line 8. If zero o
      "form-8960.0.line.12": 42900,
      // Line 13 — Modified adjusted gross income (see instructions)
      "form-8960.0.line.13": 109337,
      // Line 14 — Threshold based on filing status (see instructions)
      "form-8960.0.line.14": 200000,
    },
  },
  "form-8995-a": {
    engineFields: {
      // Line 2 — Qualified business income from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.2_a": 41437,
      // Line 3 — Multiply line 2 by 20% (0.20) (Column A)
      "form-8995-a.0.line.3_a": 8287,
      // Line 13 — Qualified business income deduction before patron reduction. Enter the greater o
      "form-8995-a.0.line.13_a": 8287,
      // Line 15 — Qualified business income component. Subtract line 14 from line 13 (Column A)
      "form-8995-a.0.line.15_a": 8287,
      // Line 16 — Total qualified business income component. Add all amounts reported on line 15
      "form-8995-a.0.line.16": 8287,
      // Line 27 — Total qualified business income component from all qualified trades, businesses,
      "form-8995-a.1.line.27": 8287,
      // Line 32 — Qualified business income deduction before the income limitation. Add lines 27 a
      "form-8995-a.1.line.32": 8287,
      // Line 33 — Taxable income before qualified business income deduction
      "form-8995-a.1.line.33": 93587,
      // Line 34 — Enter your net capital gain, if any, increased by any qualified dividends
      "form-8995-a.1.line.34": 32000,
      // Line 35 — Subtract line 34 from line 33. If zero or less, enter -0-
      "form-8995-a.1.line.35": 61587,
      // Line 36 — Income limitation. Multiply line 35 by 20% (0.20)
      "form-8995-a.1.line.36": 12317,
      // Line 37 — Qualified business income deduction before the domestic production activities de
      "form-8995-a.1.line.37": 8287,
      // Line 39 — Total qualified business income deduction. Add lines 37 and 38
      "form-8995-a.1.line.39": 8287,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 380000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 380000,
      // Line 3a — Qualified dividends
      "form-1040.line.3a": 2000,
      // Line 3b — Ordinary dividends
      "form-1040.line.3b": 2400,
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": 30000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": -302500,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 109900,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 563,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 109337,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 109337,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 8287,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 24037,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 85300,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 11446,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 11446,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 11446,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 3094,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 14540,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 80000,
      // Line 25c — Federal income tax withheld from other forms (see instructions)
      "form-1040.line.25c": 1620,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 81620,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 81620,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 67080,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 67080,
    },
  },
};

export function juilinExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
