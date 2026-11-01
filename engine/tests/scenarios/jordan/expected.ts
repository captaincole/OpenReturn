/*
 * jordan — LOCKED expected values (2026-10-16).
 *
 * Drafted from the engine's output (scripts/draftExpected.ts). Edit by
 * hand. Change a value only after you verify it against the form
 * instructions or a filed return (scripts/compareFiled).
 */

import type { ExpectedResults } from "../../types.js";

const EXPECTED: Record<string, Partial<ExpectedResults>> = {
  "form-8949": {
    engineFields: {
      // Row 1 — (d) Proceeds (sales price)
      "form-8949.0.part1.row1_proceeds": 36122,
      // Row 1 — (e) Cost or other basis
      "form-8949.0.part1.row1_cost_basis": 37702,
      // Row 1 — (h) Gain or (loss)
      "form-8949.0.part1.row1_gain_loss": -1580,
      // Row 2 — (d) Proceeds (sales price)
      "form-8949.0.part1.row2_proceeds": 22312,
      // Row 2 — (e) Cost or other basis
      "form-8949.0.part1.row2_cost_basis": 23822,
      // Row 2 — (h) Gain or (loss)
      "form-8949.0.part1.row2_gain_loss": -1510,
      // Row 3 — (d) Proceeds (sales price)
      "form-8949.0.part1.row3_proceeds": 25814,
      // Row 3 — (e) Cost or other basis
      "form-8949.0.part1.row3_cost_basis": 28511,
      // Row 3 — (h) Gain or (loss)
      "form-8949.0.part1.row3_gain_loss": -2697,
      // Row 4 — (d) Proceeds (sales price)
      "form-8949.0.part1.row4_proceeds": 26996,
      // Row 4 — (e) Cost or other basis
      "form-8949.0.part1.row4_cost_basis": 27020,
      // Row 4 — (h) Gain or (loss)
      "form-8949.0.part1.row4_gain_loss": -24,
      // Row 5 — (d) Proceeds (sales price)
      "form-8949.0.part1.row5_proceeds": 28580,
      // Row 5 — (e) Cost or other basis
      "form-8949.0.part1.row5_cost_basis": 28184,
      // Row 5 — (h) Gain or (loss)
      "form-8949.0.part1.row5_gain_loss": 396,
      // Row 6 — (d) Proceeds (sales price)
      "form-8949.0.part1.row6_proceeds": 30122,
      // Row 6 — (e) Cost or other basis
      "form-8949.0.part1.row6_cost_basis": 28668,
      // Row 6 — (h) Gain or (loss)
      "form-8949.0.part1.row6_gain_loss": 1454,
      // Row 7 — (d) Proceeds (sales price)
      "form-8949.0.part1.row7_proceeds": 32939,
      // Row 7 — (e) Cost or other basis
      "form-8949.0.part1.row7_cost_basis": 33272,
      // Row 7 — (h) Gain or (loss)
      "form-8949.0.part1.row7_gain_loss": -333,
      // Line 2 Totals — (d) Proceeds (sales price)
      "form-8949.0.part1.totals_proceeds": 202886,
      // Line 2 Totals — (e) Cost or other basis
      "form-8949.0.part1.totals_cost_basis": 207179,
      // Line 2 Totals — (h) Gain or (loss)
      "form-8949.0.part1.totals_gain_loss": -4293,
      // Row 1 — (d) Proceeds (sales price)
      "form-8949.1.part2.row1_proceeds": 1386,
      // Row 1 — (e) Cost or other basis
      "form-8949.1.part2.row1_cost_basis": 2095,
      // Row 1 — (h) Gain or (loss)
      "form-8949.1.part2.row1_gain_loss": -709,
      // Row 2 — (d) Proceeds (sales price)
      "form-8949.1.part2.row2_proceeds": 1358,
      // Row 2 — (e) Cost or other basis
      "form-8949.1.part2.row2_cost_basis": 2088,
      // Row 2 — (h) Gain or (loss)
      "form-8949.1.part2.row2_gain_loss": -730,
      // Row 3 — (d) Proceeds (sales price)
      "form-8949.1.part2.row3_proceeds": 875,
      // Row 3 — (e) Cost or other basis
      "form-8949.1.part2.row3_cost_basis": 1284,
      // Row 3 — (h) Gain or (loss)
      "form-8949.1.part2.row3_gain_loss": -409,
      // Row 4 — (d) Proceeds (sales price)
      "form-8949.1.part2.row4_proceeds": 1381,
      // Row 4 — (e) Cost or other basis
      "form-8949.1.part2.row4_cost_basis": 2078,
      // Row 4 — (h) Gain or (loss)
      "form-8949.1.part2.row4_gain_loss": -697,
      // Row 5 — (d) Proceeds (sales price)
      "form-8949.1.part2.row5_proceeds": 446,
      // Row 5 — (e) Cost or other basis
      "form-8949.1.part2.row5_cost_basis": 687,
      // Row 5 — (h) Gain or (loss)
      "form-8949.1.part2.row5_gain_loss": -241,
      // Row 6 — (d) Proceeds (sales price)
      "form-8949.1.part2.row6_proceeds": 1293,
      // Row 6 — (e) Cost or other basis
      "form-8949.1.part2.row6_cost_basis": 1944,
      // Row 6 — (h) Gain or (loss)
      "form-8949.1.part2.row6_gain_loss": -651,
      // Row 7 — (d) Proceeds (sales price)
      "form-8949.1.part2.row7_proceeds": 485,
      // Row 7 — (e) Cost or other basis
      "form-8949.1.part2.row7_cost_basis": 737,
      // Row 7 — (h) Gain or (loss)
      "form-8949.1.part2.row7_gain_loss": -252,
      // Row 8 — (d) Proceeds (sales price)
      "form-8949.1.part2.row8_proceeds": 1239,
      // Row 8 — (e) Cost or other basis
      "form-8949.1.part2.row8_cost_basis": 2000,
      // Row 8 — (h) Gain or (loss)
      "form-8949.1.part2.row8_gain_loss": -761,
      // Row 9 — (d) Proceeds (sales price)
      "form-8949.1.part2.row9_proceeds": 1270,
      // Row 9 — (e) Cost or other basis
      "form-8949.1.part2.row9_cost_basis": 1962,
      // Row 9 — (h) Gain or (loss)
      "form-8949.1.part2.row9_gain_loss": -692,
      // Row 10 — (d) Proceeds (sales price)
      "form-8949.1.part2.row10_proceeds": 1500,
      // Row 10 — (e) Cost or other basis
      "form-8949.1.part2.row10_cost_basis": 2270,
      // Row 10 — (h) Gain or (loss)
      "form-8949.1.part2.row10_gain_loss": -770,
      // Row 11 — (d) Proceeds (sales price)
      "form-8949.1.part2.row11_proceeds": 1867,
      // Row 11 — (e) Cost or other basis
      "form-8949.1.part2.row11_cost_basis": 2992,
      // Row 11 — (h) Gain or (loss)
      "form-8949.1.part2.row11_gain_loss": -1125,
      // Line 2 Totals — (d) Proceeds (sales price)
      "form-8949.1.part2.totals_proceeds": 13100,
      // Line 2 Totals — (e) Cost or other basis
      "form-8949.1.part2.totals_cost_basis": 20137,
      // Line 2 Totals — (h) Gain or (loss)
      "form-8949.1.part2.totals_gain_loss": -7037,
    },
  },
  "schedule-d": {
    engineFields: {
      // Line 2 — Proceeds (sales price) — Totals for all transactions reported on Form(s) 8949 wit
      "schedule-d.0.line.2_proceeds": 202888,
      // Line 2 — Cost (or other basis) — Totals for all transactions reported on Form(s) 8949 with
      "schedule-d.0.line.2_cost": 207181,
      // Line 2 — Gain or (loss) — Totals for all transactions reported on Form(s) 8949 with Box B
      "schedule-d.0.line.2_gain_loss": -4293,
      // Line 7 — Net short-term capital gain or (loss). Combine lines 1a through 6 in column (h)
      "schedule-d.0.line.7_net_short_term_gain_loss": -4293,
      // Line 8b — Proceeds (sales price) — Totals for all transactions reported on Form(s) 8949 wi
      "schedule-d.0.line.8b_proceeds": 102094,
      // Line 8b — Cost (or other basis) — Totals for all transactions reported on Form(s) 8949 wit
      "schedule-d.0.line.8b_cost": 41480,
      // Line 8b — Gain or (loss) — Totals for all transactions reported on Form(s) 8949 with Box D
      "schedule-d.0.line.8b_gain_loss": 60614,
      // Line 9 — Proceeds (sales price) — Totals for all transactions reported on Form(s) 8949 wit
      "schedule-d.0.line.9_proceeds": 305,
      // Line 9 — Gain or (loss) — Totals for all transactions reported on Form(s) 8949 with Box E
      "schedule-d.0.line.9_gain_loss": 305,
      // Line 15 — Net long-term capital gain or (loss). Combine lines 8a through 14 in column (h)
      "schedule-d.0.line.15_net_long_term_gain_loss": 60919,
      // Line 16 — Combine lines 7 and 15 and enter the result
      "schedule-d.1.line.16_combined_gain_loss": 56626,
    },
  },
  "schedule-b": {
    engineFields: {
      // Line 1 — Amount (row 1)
      "schedule-b.0.line.1_amount_1": 10,
      // Line 1 — Amount (row 2)
      "schedule-b.0.line.1_amount_2": 2287,
      // Line 2 — Add the amounts on line 1
      "schedule-b.0.line.2_total_interest": 2297,
      // Line 4 — Subtract line 3 from line 2. Enter the result here and on Form 1040 or 1040-SR, l
      "schedule-b.0.line.4_taxable_interest": 2297,
      // Line 5 — Amount (row 1)
      "schedule-b.0.line.5_amount_1": 885,
      // Line 6 — Add the amounts on line 5. Enter the total here and on Form 1040 or 1040-SR, line
      "schedule-b.0.line.6_total_ordinary_dividends": 885,
    },
    renderedChecked: [
      "schedule-b.0.line.7a_foreign_account_no",
      "schedule-b.0.line.8_foreign_trust_no",
    ],
  },
  "schedule-1": {
    engineFields: {
      // Line 8z — Other income amount
      "schedule-1.0.line.8z": 1055,
      // Line 9 — Total other income. Add lines 8a through 8z
      "schedule-1.0.line.9": 1055,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 1055,
    },
  },
  "form-8889": {
    engineFields: {
      // Line 2 — HSA contributions you made for 2025
      "form-8889.0.line.2_hsa_contributions": 0,
      // Line 3 — Annual HSA contribution limit
      "form-8889.0.line.3_annual_hsa_contribution_limit": 4300,
      // Line 5 — Subtract line 4 from line 3
      "form-8889.0.line.5_subtract_line4_from_line3": 4300,
      // Line 6 — Amount from line 5 (adjusted for separate HSAs with family coverage)
      "form-8889.0.line.6_adjusted_limit_separate_hsa": 4300,
      // Line 8 — Add lines 6 and 7
      "form-8889.0.line.8_add_lines_6_and_7": 4300,
      // Line 9 — Employer contributions made to your HSAs for 2025
      "form-8889.0.line.9_employer_contributions": 3826,
      // Line 11 — Add lines 9 and 10
      "form-8889.0.line.11_add_lines_9_and_10": 3826,
      // Line 12 — Subtract line 11 from line 8. If zero or less, enter -0-
      "form-8889.0.line.12_subtract_line11_from_line8": 474,
      // Line 13 — HSA deduction
      "form-8889.0.line.13_hsa_deduction": 0,
      // Line 14a — Total distributions you received in 2025 from all HSAs
      "form-8889.0.line.14a_total_distributions": 145,
      // Line 14c — Subtract line 14b from line 14a
      "form-8889.0.line.14c_subtract_14b_from_14a": 145,
      // Line 15 — Qualified medical expenses paid using HSA distributions
      "form-8889.0.line.15_qualified_medical_expenses": 145,
      // Line 16 — Taxable HSA distributions. Subtract line 15 from line 14c
      "form-8889.0.line.16_taxable_hsa_distributions": 0,
    },
    renderedChecked: ["form-8889.0.line.1_self_only_coverage"],
  },
  "form-8959": {
    engineFields: {
      // Line 1 — Medicare wages and tips from Form W-2, box 5
      "form-8959.0.line.1_medicare_wages_tips": 695242,
      // Line 4 — Add lines 1 through 3
      "form-8959.0.line.4_total_medicare_wages": 695242,
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 200000,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-8959.0.line.6_excess_medicare_wages": 495242,
      // Line 7 — Additional Medicare Tax on Medicare wages. Multiply line 6 by 0.9% (0.009)
      "form-8959.0.line.7_additional_medicare_tax_wages": 4457,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 4457,
      // Line 19 — Medicare tax withheld from Form W-2, box 6
      "form-8959.0.line.19_medicare_tax_withheld": 14538,
      // Line 20 — Enter the amount from line 1
      "form-8959.0.line.20_medicare_wages_from_line1": 695242,
      // Line 21 — Multiply line 20 by 1.45% (0.0145). Regular Medicare tax withholding on Medicare
      "form-8959.0.line.21_regular_medicare_tax_on_wages": 10081,
      // Line 22 — Subtract line 21 from line 19. If zero or less, enter -0-. Additional Medicare T
      "form-8959.0.line.22_additional_medicare_tax_withholding_wages": 4457,
      // Line 24 — Total Additional Medicare Tax withholding. Add lines 22 and 23
      "form-8959.0.line.24_total_additional_medicare_tax_withholding": 4457,
    },
  },
  "form-8960": {
    engineFields: {
      // Line 1 — Taxable interest (see instructions)
      "form-8960.0.line.1": 2297,
      // Line 2 — Ordinary dividends (see instructions)
      "form-8960.0.line.2": 885,
      // Line 5a — Net gain or loss from disposition of property (see instructions)
      "form-8960.0.line.5a": 56626,
      // Line 5d — Combine lines 5a through 5c
      "form-8960.0.line.5d": 56626,
      // Line 8 — Total investment income. Combine lines 1, 2, 3, 4c, 5d, 6, and 7
      "form-8960.0.line.8": 59808,
      // Line 12 — Net investment income. Subtract Part II, line 11, from Part I, line 8
      "form-8960.0.line.12": 59808,
      // Line 13 — Modified adjusted gross income (see instructions)
      "form-8960.0.line.13": 733836,
      // Line 14 — Threshold based on filing status (see instructions)
      "form-8960.0.line.14": 200000,
      // Line 15 — Subtract line 14 from line 13. If zero or less, enter -0-
      "form-8960.0.line.15": 533836,
      // Line 16 — Enter the smaller of line 12 or line 15
      "form-8960.0.line.16": 59808,
      // Line 17 — Net investment income tax for individuals. Multiply line 16 by 3.8% (0.038)
      "form-8960.0.line.17": 2273,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 4457,
      // Line 12 — Net investment income tax. Attach Form 8960
      "schedule-2.0.line.12_net_investment_income_tax": 2273,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 6730,
    },
  },
  "form-8995-a": {
    engineFields: {
      // Line 28 — Qualified REIT dividends and publicly traded partnership (PTP) income or (loss)
      "form-8995-a.1.line.28": 21,
      // Line 30 — Total qualified REIT dividends and PTP income. Combine lines 28 and 29. If less
      "form-8995-a.1.line.30": 21,
      // Line 31 — REIT and PTP component. Multiply line 30 by 20% (0.20)
      "form-8995-a.1.line.31": 4,
      // Line 32 — Qualified business income deduction before the income limitation. Add lines 27 a
      "form-8995-a.1.line.32": 4,
      // Line 33 — Taxable income before qualified business income deduction
      "form-8995-a.1.line.33": 718086,
      // Line 34 — Enter your net capital gain, if any, increased by any qualified dividends
      "form-8995-a.1.line.34": 57490,
      // Line 35 — Subtract line 34 from line 33. If zero or less, enter -0-
      "form-8995-a.1.line.35": 660596,
      // Line 36 — Income limitation. Multiply line 35 by 20% (0.20)
      "form-8995-a.1.line.36": 132119,
      // Line 37 — Qualified business income deduction before the domestic production activities de
      "form-8995-a.1.line.37": 4,
      // Line 39 — Total qualified business income deduction. Add lines 37 and 38
      "form-8995-a.1.line.39": 4,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 672973,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 672973,
      // Line 2b — Taxable interest
      "form-1040.line.2b": 2297,
      // Line 3a — Qualified dividends
      "form-1040.line.3a": 864,
      // Line 3b — Ordinary dividends
      "form-1040.line.3b": 885,
      // Line 5a — Pensions and annuities
      "form-1040.line.5a": 89310,
      // Line 5b — Taxable amount
      "form-1040.line.5b": 0,
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": 56626,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 1055,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 733836,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 733836,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 733836,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 4,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15754,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 718082,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 212937,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 212937,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 212937,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 6730,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 219667,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 199087,
      // Line 25c — Federal income tax withheld from other forms (see instructions)
      "form-1040.line.25c": 4457,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 203544,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 203544,
      // Line 37 — Amount you owe
      "form-1040.line.37": 16123,
    },
    renderedChecked: ["form-1040.header.digital_assets_yes", "form-1040.line.5c_rollover"],
  },
  "schedule-ca": {
    engineFields: {
      // Part One. Income Adjustment Schedule. Section A. Income from federal Form 1040 or 1040-SR.
      "schedule-ca.0.line.1a_federal": 672973,
      // Line 1a. Column C. Additions. See instructions.
      "schedule-ca.0.line.1a_additions": 3826,
      // Line 1z. Add line 1a through line 1i. Column A. Federal Amounts.
      "schedule-ca.0.line.1z_federal": 672973,
      // Line 1z. Column C. Additions.
      "schedule-ca.0.line.1z_additions": 3826,
      // Line 2. Taxable interest. Line 2b. Column A. Federal Amounts.
      "schedule-ca.0.line.2b_federal": 2297,
      // Line 3. Ordinary dividends. Line 3b. Column A. Federal Amounts.
      "schedule-ca.0.line.3b_federal": 885,
      // Line 7a. Capital gain or (loss). See instructions. Column A. Federal Amounts.
      "schedule-ca.0.line.7a_federal": 56626,
      // Line 8 z. Other income. Enter amount. Column A. Federal Amounts.
      "schedule-ca.1.line.b8z_federal": 1055,
      // Line 9 a. Total other income. Add line 8a through line 8z. Column A. Federal Amounts.
      "schedule-ca.2.line.b9a_federal": 1055,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 733836,
      // Line 10. Column C. Additions.
      "schedule-ca.2.line.b10_additions": 3826,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 733836,
      // Line 27. Column C. Additions.
      "schedule-ca.3.line.c27_additions": 3826,
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
      "form-540.line.12_state_wages": 676800,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040 or 1040-SR, li
      "form-540.line.13_federal_agi": 733836,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 733836,
      // Line 16. California adjustments – additions. Enter the amount from Schedule CA (540), Part
      "form-540.line.16_ca_adjustments_additions": 3826,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 737662,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 731956,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 70977,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 0,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 70977,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 70977,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 70977,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 70977,
      // Payments. Line 71. California income tax withheld. See instructions.
      "form-540.line.71_ca_income_tax_withheld": 62972,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 62972,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 62972,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 62972,
      // Line 100. Tax due. If line 95 is less than line 64, subtract line 95 from line 64.
      "form-540.line.100_tax_due": 8005,
      // Amount You Owe. Line 111. Amount You Owe. If you do not have an amount on line 99, add lin
      "form-540.line.111_amount_you_owe": 8005,
      // Line 113. Underpayment of estimated tax.
      "form-540.line.113_underpayment_estimated_tax": 46,
      // Line 114. Total amount due. See instructions. Enclose, but do not staple, any payment.
      "form-540.line.114_total_amount_due": 8051,
    },
  },
  "form-5805": {
    engineFields: {
      // Part 2. Line 1. Current year tax. Enter your 2025 tax after credits. See instructions.
      "form-5805.1.part2.line_1": 70977,
      // Line 2 . Multiply line 1 by 90% (.90).
      "form-5805.1.part2.line_2": 63879,
      // Line 3 . Withholding taxes. Do not include any estimated tax payments on this line. See in
      "form-5805.1.part2.line_3": 62972,
      // Line 4 . Subtract line 3 from line 1 . If less than $500 (or less than $250 if married/Reg
      "form-5805.1.part2.line_4": 8005,
      // Line 5 . Enter the tax shown on your 2024 tax return. See instructions. (110% (1.10) of th
      "form-5805.1.part2.line_5": 64352,
      // Line 6 . Required annual payment. Enter the smaller of line 2 or line 5 . (If your Califor
      "form-5805.1.part2.line_6": 63879,
      // Short Method Line 7 . Enter the amount, if any, from Part 2, line 3 above.
      "form-5805.1.part2.line_7": 62972,
      // Line 9 . Add line 7 and line 8 .
      "form-5805.1.part2.line_9": 62972,
      // Line 10 . Total underpayment for the year. Subtract line 9 from line 6 . If zero or less,
      "form-5805.1.part2.line_10": 907,
      // Line 11 . Multiply line 10 by .05028767
      "form-5805.1.part2.line_11": 46,
      // Line 13 . Penalty. Subtract line 12 from line 11 . Enter the result here and on Form 540,
      "form-5805.1.part2.line_13": 46,
    },
  },
};

export function jordanExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
