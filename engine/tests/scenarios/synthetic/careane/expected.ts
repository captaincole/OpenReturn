/*
 * careane — LOCKED expected values, drafted from the engine's
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
  "form-8958": {
    engineFields: {
      // Line 1 — Wages (each employer), row 1, column A — Total Amount
      "form-8958.0.line.1_wages_each_employer_row_1_col_a": 72000,
      // Line 1 — Wages (each employer), row 1, column B — Allocated to Spouse or RDP
      "form-8958.0.line.1_wages_each_employer_row_1_col_b": 36000,
      // Line 1 — Wages (each employer), row 1, column C — Allocated to Spouse or RDP
      "form-8958.0.line.1_wages_each_employer_row_1_col_c": 36000,
      // Line 1 — Wages (each employer), row 2, column A — Total Amount
      "form-8958.0.line.1_wages_each_employer_row_2_col_a": 48000,
      // Line 1 — Wages (each employer), row 2, column B — Allocated to Spouse or RDP
      "form-8958.0.line.1_wages_each_employer_row_2_col_b": 24000,
      // Line 1 — Wages (each employer), row 2, column C — Allocated to Spouse or RDP
      "form-8958.0.line.1_wages_each_employer_row_2_col_c": 24000,
      // Line 1 — Wages (each employer), row 3, column A — Total Amount
      "form-8958.0.line.1_wages_each_employer_row_3_col_a": 24000,
      // Line 1 — Wages (each employer), row 3, column B — Allocated to Spouse or RDP
      "form-8958.0.line.1_wages_each_employer_row_3_col_b": 12000,
      // Line 1 — Wages (each employer), row 3, column C — Allocated to Spouse or RDP
      "form-8958.0.line.1_wages_each_employer_row_3_col_c": 12000,
      // Line 2 — Interest income (each payer), row 1, column A — Total Amount
      "form-8958.0.line.2_interest_income_each_payer_row_1_col_a": 1200,
      // Line 2 — Interest income (each payer), row 1, column B — Allocated to Spouse or RDP
      "form-8958.0.line.2_interest_income_each_payer_row_1_col_b": 600,
      // Line 2 — Interest income (each payer), row 1, column C — Allocated to Spouse or RDP
      "form-8958.0.line.2_interest_income_each_payer_row_1_col_c": 600,
      // Line 2 — Interest income (each payer), row 2, column A — Total Amount
      "form-8958.0.line.2_interest_income_each_payer_row_2_col_a": 800,
      // Line 2 — Interest income (each payer), row 2, column B — Allocated to Spouse or RDP
      "form-8958.0.line.2_interest_income_each_payer_row_2_col_b": 400,
      // Line 2 — Interest income (each payer), row 2, column C — Allocated to Spouse or RDP
      "form-8958.0.line.2_interest_income_each_payer_row_2_col_c": 400,
      // Line 2 — Interest income (each payer), row 3, column A — Total Amount
      "form-8958.0.line.2_interest_income_each_payer_row_3_col_a": 400,
      // Line 2 — Interest income (each payer), row 3, column B — Allocated to Spouse or RDP
      "form-8958.0.line.2_interest_income_each_payer_row_3_col_b": 200,
      // Line 2 — Interest income (each payer), row 3, column C — Allocated to Spouse or RDP
      "form-8958.0.line.2_interest_income_each_payer_row_3_col_c": 200,
      // Line 3 — Dividends (each payer), row 1, column A — Total Amount
      "form-8958.0.line.3_dividends_each_payer_row_1_col_a": 2000,
      // Line 3 — Dividends (each payer), row 1, column B — Allocated to Spouse or RDP
      "form-8958.0.line.3_dividends_each_payer_row_1_col_b": 1000,
      // Line 3 — Dividends (each payer), row 1, column C — Allocated to Spouse or RDP
      "form-8958.0.line.3_dividends_each_payer_row_1_col_c": 1000,
      // Line 3 — Dividends (each payer), row 2, column A — Total Amount
      "form-8958.0.line.3_dividends_each_payer_row_2_col_a": 2000,
      // Line 3 — Dividends (each payer), row 2, column B — Allocated to Spouse or RDP
      "form-8958.0.line.3_dividends_each_payer_row_2_col_b": 1000,
      // Line 3 — Dividends (each payer), row 2, column C — Allocated to Spouse or RDP
      "form-8958.0.line.3_dividends_each_payer_row_2_col_c": 1000,
      // Line 5 — Self-employment income, row 1, column A — Total Amount
      "form-8958.0.line.5_self_employment_income_row_1_col_a": 30000,
      // Line 5 — Self-employment income, row 1, column B — Allocated to Spouse or RDP
      "form-8958.0.line.5_self_employment_income_row_1_col_b": 15000,
      // Line 5 — Self-employment income, row 1, column C — Allocated to Spouse or RDP
      "form-8958.0.line.5_self_employment_income_row_1_col_c": 15000,
      // Line 5 — Self-employment income, row 2, column A — Total Amount
      "form-8958.0.line.5_self_employment_income_row_2_col_a": 30000,
      // Line 5 — Self-employment income, row 2, column B — Allocated to Spouse or RDP
      "form-8958.0.line.5_self_employment_income_row_2_col_b": 15000,
      // Line 5 — Self-employment income, row 2, column C — Allocated to Spouse or RDP
      "form-8958.0.line.5_self_employment_income_row_2_col_c": 15000,
      // Line 6 — Capital gains and losses, row 1, column A — Total Amount
      "form-8958.0.line.6_capital_gains_losses_row_1_col_a": 5000,
      // Line 6 — Capital gains and losses, row 1, column B — Allocated to Spouse or RDP
      "form-8958.0.line.6_capital_gains_losses_row_1_col_b": 5000,
      // Verified zero (by hand): a separate gain of Careane's, none of it Davram's.
      "form-8958.0.line.6_capital_gains_losses_row_1_col_c": 0,
      // Line 6 — Capital gains and losses, row 2, column A — Total Amount
      "form-8958.0.line.6_capital_gains_losses_row_2_col_a": -800,
      // Verified zero (by hand): Davram's separate loss, none of it Careane's.
      "form-8958.0.line.6_capital_gains_losses_row_2_col_b": 0,
      // Line 6 — Capital gains and losses, row 2, column C — Allocated to Spouse or RDP
      "form-8958.0.line.6_capital_gains_losses_row_2_col_c": -800,
      // Line 7 — Pension income, row 1, column A — Total Amount
      "form-8958.0.line.7_pension_income_row_1_col_a": 12000,
      // Line 7 — Pension income, row 1, column B — Allocated to Spouse or RDP
      "form-8958.0.line.7_pension_income_row_1_col_b": 9000,
      // Line 7 — Pension income, row 1, column C — Allocated to Spouse or RDP
      "form-8958.0.line.7_pension_income_row_1_col_c": 3000,
      // Line 7 — Pension income, row 2, column A — Total Amount
      "form-8958.0.line.7_pension_income_row_2_col_a": 6000,
      // Line 7 — Pension income, row 2, column B — Allocated to Spouse or RDP
      "form-8958.0.line.7_pension_income_row_2_col_b": 3000,
      // Line 7 — Pension income, row 2, column C — Allocated to Spouse or RDP
      "form-8958.0.line.7_pension_income_row_2_col_c": 3000,
      // Line 8 — Rents, royalties, partnerships, estates, trusts, row 1, column A — Total Amount
      "form-8958.0.line.8_rents_royalties_partnerships_trusts_row_1_col_a": 3000,
      // Line 8 — Rents, royalties, partnerships, estates, trusts, row 1, column B — Allocated to S
      "form-8958.0.line.8_rents_royalties_partnerships_trusts_row_1_col_b": 1500,
      // Line 8 — Rents, royalties, partnerships, estates, trusts, row 1, column C — Allocated to S
      "form-8958.0.line.8_rents_royalties_partnerships_trusts_row_1_col_c": 1500,
      // Line 8 — Rents, royalties, partnerships, estates, trusts, row 2, column A — Total Amount
      "form-8958.0.line.8_rents_royalties_partnerships_trusts_row_2_col_a": 3000,
      // Line 8 — Rents, royalties, partnerships, estates, trusts, row 2, column B — Allocated to S
      "form-8958.0.line.8_rents_royalties_partnerships_trusts_row_2_col_b": 1500,
      // Line 8 — Rents, royalties, partnerships, estates, trusts, row 2, column C — Allocated to S
      "form-8958.0.line.8_rents_royalties_partnerships_trusts_row_2_col_c": 1500,
      // Line 9 — Deductible part of self-employment tax, row 1: Total amount
      "form-8958.1.line.9_deductible_se_tax_row_1_col_a": 2119,
      // Line 9 — Deductible part of self-employment tax, row 1: Allocated to spouse or RDP (column
      "form-8958.1.line.9_deductible_se_tax_row_1_col_b": 2119,
      // Line 9 — Deductible part of self-employment tax, row 2: Total amount
      "form-8958.1.line.9_deductible_se_tax_row_2_col_a": 2119,
      // Line 9 — Deductible part of self-employment tax, row 2: Allocated to spouse or RDP (column
      "form-8958.1.line.9_deductible_se_tax_row_2_col_c": 2119,
      // Line 10 — Self-employment tax, row 1: Total amount
      "form-8958.1.line.10_self_employment_tax_row_1_col_a": 4238,
      // Line 10 — Self-employment tax, row 1: Allocated to spouse or RDP (column B)
      "form-8958.1.line.10_self_employment_tax_row_1_col_b": 4238,
      // Verified zeros (by hand): each spouse's self-employment tax is the spouse's who carries on the business.
      "form-8958.1.line.10_self_employment_tax_row_1_col_c": 0,
      "form-8958.1.line.10_self_employment_tax_row_2_col_b": 0,
      "form-8958.1.line.9_deductible_se_tax_row_1_col_c": 0,
      "form-8958.1.line.9_deductible_se_tax_row_2_col_b": 0,
      // Line 10 — Self-employment tax, row 2: Total amount
      "form-8958.1.line.10_self_employment_tax_row_2_col_a": 4238,
      // Line 10 — Self-employment tax, row 2: Allocated to spouse or RDP (column C)
      "form-8958.1.line.10_self_employment_tax_row_2_col_c": 4238,
      // Line 11 — Taxes withheld, row 1: Total amount
      "form-8958.1.line.11_taxes_withheld_row_1_col_a": 19000,
      // Line 11 — Taxes withheld, row 1: Allocated to spouse or RDP (column B)
      "form-8958.1.line.11_taxes_withheld_row_1_col_b": 9500,
      // Line 11 — Taxes withheld, row 1: Allocated to spouse or RDP (column C)
      "form-8958.1.line.11_taxes_withheld_row_1_col_c": 9500,
      // Line 11 — Taxes withheld, row 2: Total amount
      "form-8958.1.line.11_taxes_withheld_row_2_col_a": 19000,
      // Line 11 — Taxes withheld, row 2: Allocated to spouse or RDP (column B)
      "form-8958.1.line.11_taxes_withheld_row_2_col_b": 9500,
      // Line 11 — Taxes withheld, row 2: Allocated to spouse or RDP (column C)
      "form-8958.1.line.11_taxes_withheld_row_2_col_c": 9500,
      // Line 11 — Taxes withheld, row 3: Total amount
      "form-8958.1.line.11_taxes_withheld_row_3_col_a": 1200,
      // Line 11 — Taxes withheld, row 3: Allocated to spouse or RDP (column B)
      "form-8958.1.line.11_taxes_withheld_row_3_col_b": 900,
      // Line 11 — Taxes withheld, row 3: Allocated to spouse or RDP (column C)
      "form-8958.1.line.11_taxes_withheld_row_3_col_c": 300,
      // Line 11 — Taxes withheld, row 4: Total amount
      "form-8958.1.line.11_taxes_withheld_row_4_col_a": 600,
      // Line 11 — Taxes withheld, row 4: Allocated to spouse or RDP (column B)
      "form-8958.1.line.11_taxes_withheld_row_4_col_b": 300,
      // Line 11 — Taxes withheld, row 4: Allocated to spouse or RDP (column C)
      "form-8958.1.line.11_taxes_withheld_row_4_col_c": 300,
      // Line 12 — Other items such as social security benefits, unemployment compensation, deducti
      "form-8958.1.line.12_other_items_row_1_col_a": 6000,
      // Line 12 — Other items such as social security benefits, unemployment compensation, deducti
      "form-8958.1.line.12_other_items_row_1_col_b": 2000,
      // Line 12 — Other items such as social security benefits, unemployment compensation, deducti
      "form-8958.1.line.12_other_items_row_1_col_c": 4000,
    },
    renderedText: {
      "form-8958.0.header.ssn": "400008958",
      "form-8958.0.header.spouse_first_name_initial": "Davram",
      "form-8958.0.header.col_c_ssn_part_3": "8959",
      "form-8958.0.line.1_wages_each_employer_row_2_description": "Franklin Freight Lines (Davram)",
      "form-8958.1.line.9_deductible_se_tax_row_1_description": "Vellacott Bookkeeping (Careane)",
      "form-8958.1.line.11_taxes_withheld_row_3_description": "Sun City Water pension (Careane)",
      "form-8958.1.line.12_other_items_row_1_description": "2025 estimated tax paid jointly",
    },
    renderedBlank: ["form-8958.0.line.4_state_income_tax_refund_col_a"],
  },
  "schedule-b": {
    engineFields: {
      // Line 1 — Amount (row 1)
      "schedule-b.0.line.1_amount_1": 1200,
      // Line 2 — Add the amounts on line 1
      "schedule-b.0.line.2_total_interest": 1200,
      // Line 4 — Subtract line 3 from line 2. Enter the result here and on Form 1040 or 1040-SR, l
      "schedule-b.0.line.4_taxable_interest": 1200,
      // Line 5 — Amount (row 1)
      "schedule-b.0.line.5_amount_1": 2000,
      // Line 6 — Add the amounts on line 5. Enter the total here and on Form 1040 or 1040-SR, line
      "schedule-b.0.line.6_total_ordinary_dividends": 2000,
    },
  },
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 36000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 36000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 36000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 36000,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 2500,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 1500,
      // Line 25 — Utilities
      "schedule-c.0.line.25": 2000,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 6000,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 30000,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 30000,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 30000,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 30000,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 27705,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 27705,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 27705,
      // Line 8a — Total social security wages and tips (total of boxes 3 and 7 on Form(s) W-2) and
      "schedule-se.0.line.8a": 72000,
      // Line 8d — Add lines 8a, 8b, and 8c
      "schedule-se.0.line.8d": 72000,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 104100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 3435,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 803,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 4238,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 2119,
    },
  },
  "form-8949": {
    engineFields: {
      // Row 1 — (d) Proceeds (sales price)
      "form-8949.1.part2.row1_proceeds": 15000,
      // Row 1 — (e) Cost or other basis
      "form-8949.1.part2.row1_cost_basis": 10000,
      // Row 1 — (h) Gain or (loss)
      "form-8949.1.part2.row1_gain_loss": 5000,
      // Line 2 Totals — (d) Proceeds (sales price)
      "form-8949.1.part2.totals_proceeds": 15000,
      // Line 2 Totals — (e) Cost or other basis
      "form-8949.1.part2.totals_cost_basis": 10000,
      // Line 2 Totals — (h) Gain or (loss)
      "form-8949.1.part2.totals_gain_loss": 5000,
    },
  },
  "schedule-d": {
    engineFields: {
      // Line 8b — Proceeds (sales price) — Totals for all transactions reported on Form(s) 8949 wi
      "schedule-d.0.line.8b_proceeds": 15000,
      // Line 8b — Cost (or other basis) — Totals for all transactions reported on Form(s) 8949 wit
      "schedule-d.0.line.8b_cost": 10000,
      // Line 8b — Gain or (loss) — Totals for all transactions reported on Form(s) 8949 with Box D
      "schedule-d.0.line.8b_gain_loss": 5000,
      // Line 15 — Net long-term capital gain or (loss). Combine lines 8a through 14 in column (h)
      "schedule-d.0.line.15_net_long_term_gain_loss": 5000,
      // Line 16 — Combine lines 7 and 15 and enter the result
      "schedule-d.1.line.16_combined_gain_loss": 5000,
    },
  },
  "schedule-e": {
    engineFields: {
      // Line 4 — Royalties received (Property A)
      "schedule-e.0.line.4_royalties_received_a": 3000,
      // Line 21 — Subtract line 20 from line 3 (rents) and/or 4 (royalties) (Property A)
      "schedule-e.0.line.21_income_or_loss_a": 3000,
      // Line 23b — Total of all amounts reported on line 4 for all royalty properties
      "schedule-e.0.line.23b_total_royalties": 3000,
      // Line 24 — Income. Add positive amounts shown on line 21. Do not include any losses
      "schedule-e.0.line.24_income": 3000,
      // Line 26 — Total rental real estate and royalty income or (loss). Combine lines 24 and 25
      "schedule-e.0.line.26_total_income_or_loss": 3000,
      // Line 41 — Total income or (loss). Combine lines 26, 32, 37, 39, and 40
      "schedule-e.1.line.41_total_income_or_loss": 3000,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": 27881,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": 27881,
      // Line 4 — Total qualified business income. Combine lines 2 and 3. If zero or less, enter -0
      "form-8995.0.line.4": 27881,
      // Line 5 — Qualified business income component. Multiply line 4 by 20% (0.20)
      "form-8995.0.line.5": 5576,
      // Line 10 — Qualified business income deduction before the income limitation. Add lines 5 an
      "form-8995.0.line.10": 5576,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 107331,
      // Line 12 — Enter your net capital gain, if any, increased by any qualified dividends
      "form-8995.0.line.12": 7000,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 100331,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 20066,
      // Line 15 — Qualified business income deduction. Enter the smaller of line 10 or line 14
      "form-8995.0.line.15": 5576,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 30000,
      // Line 5 — Rental real estate, royalties, partnerships, S corporations, trusts, etc. Attach
      "schedule-1.0.line.5": 3000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 33000,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 2119,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 2119,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 4238,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 4238,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 72000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 72000,
      // Line 2b — Taxable interest
      "form-1040.line.2b": 1200,
      // Line 3a — Qualified dividends
      "form-1040.line.3a": 2000,
      // Line 3b — Ordinary dividends
      "form-1040.line.3b": 2000,
      // Line 5a — Pensions and annuities
      "form-1040.line.5a": 12000,
      // Line 5b — Taxable amount
      "form-1040.line.5b": 12000,
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": 5000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 33000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 125200,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 2119,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 123081,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 123081,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 5576,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 21326,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 101755,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 16815,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 16815,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 16815,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 4238,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 21053,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 19000,
      // Line 25b — Federal income tax withheld from Form(s) 1099
      "form-1040.line.25b": 1200,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 20200,
      // Line 26 — 2025 estimated tax payments and amount applied from 2024 return
      "form-1040.line.26": 2000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 22200,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 1147,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 1147,
    },
  },
};

export function careaneExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
