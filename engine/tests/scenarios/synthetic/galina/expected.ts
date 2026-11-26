/*
 * galina — LOCKED expected values, drafted from the engine's
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
  "form-172": {
    engineFields: {
      // Line 1 — For individuals, subtract your standard deduction or itemized deductions from you
      "form-172.0.part1.1_agi_less_deductions": -81750,
      // Line 2 — Nonbusiness capital losses before limitation. Enter as a positive number
      "form-172.0.part1.2_nonbusiness_capital_losses": 9000,
      // Line 3 — Nonbusiness capital gains (without regard to any section 1202 exclusion)
      "form-172.0.part1.3_nonbusiness_capital_gains": 2500,
      // Line 4 — If line 2 is more than line 3, enter the difference. Otherwise, enter -0-
      "form-172.0.part1.4_excess_nonbusiness_capital_loss": 6500,
      // Line 6 — Nonbusiness deductions (see instructions). Enter as a positive number
      "form-172.0.part1.6_nonbusiness_deductions": 15750,
      // Line 7 — Nonbusiness income other than capital gains (see instructions)
      "form-172.0.part1.7_nonbusiness_income_other": 2000,
      // Line 8 — Add lines 5 and 7
      "form-172.0.part1.8_add_lines_5_7": 2000,
      // Line 9 — If line 6 is more than line 8, enter the difference. Otherwise, enter -0-
      "form-172.0.part1.9_excess_nonbusiness_deductions": 13750,
      // Line 11 — Business capital losses before limitation. Enter as a positive number
      "form-172.0.part1.11_business_capital_losses": 1500,
      // Line 14 — Subtract line 13 from line 11. If zero or less, enter -0-
      "form-172.0.part1.14_excess_business_capital_loss": 1500,
      // Line 15 — Add lines 4 and 14
      "form-172.0.part1.15_add_lines_4_14": 8000,
      // Line 16 — Enter, if any, the combined net short-term and long-term capital loss from your
      "form-172.0.part1.16_schedule_d_net_loss": 8000,
      // Line 18 — Subtract line 17 from line 16. If zero or less, enter -0-
      "form-172.0.part1.18_line16_less_line17": 8000,
      // Line 19 — If line 16 is a loss, enter, as a positive number, the smaller of the loss on li
      "form-172.0.part1.19_allowed_capital_loss": 3000,
      // Line 20 — If line 18 is more than line 19, enter the difference. Otherwise, enter -0-
      "form-172.0.part1.20_line18_over_line19": 5000,
      // Line 22 — Subtract line 20 from line 15. If zero or less, enter -0-
      "form-172.0.part1.22_line15_less_line20": 3000,
      // Line 23 — NOL deduction for losses from other years. Enter as a positive number
      "form-172.0.part1.23_nol_deduction_other_years": 5000,
      // Line 24 — NOL. Combine lines 1, 9, 17, and 21 through 23. If the result is less than zero,
      "form-172.0.part1.24_net_operating_loss": -60000,
      // Line 1 — NOL deduction. Enter as a positive number (2nd preceding tax year)
      "form-172.1.part2.1_nol_deduction_2nd_preceding": 60000,
      // Line 1 — NOL deduction. Enter as a positive number (1st preceding tax year)
      "form-172.1.part2.1_nol_deduction_1st_preceding": 23775,
      // Line 2 — Taxable income before the current year NOL carryback (2nd preceding tax year)
      "form-172.1.part2.2_taxable_income_before_carryback_2nd_preceding": 28000,
      // Line 2 — Taxable income before the current year NOL carryback (1st preceding tax year)
      "form-172.1.part2.2_taxable_income_before_carryback_1st_preceding": 15000,
      // Line 3 — Net capital loss deduction (2nd preceding tax year)
      "form-172.1.part2.3_net_capital_loss_deduction_2nd_preceding": 3000,
      // Line 3 — Net capital loss deduction (1st preceding tax year)
      "form-172.1.part2.3_net_capital_loss_deduction_1st_preceding": 1500,
      // Line 5 — Qualified business income deduction (2nd preceding tax year)
      "form-172.1.part2.5_qualified_business_income_deduction_2nd_preceding": 4000,
      // Line 5 — Qualified business income deduction (1st preceding tax year)
      "form-172.1.part2.5_qualified_business_income_deduction_1st_preceding": 2000,
      // Line 7 — Adjustment to itemized deductions from line 33 below (2nd preceding tax year)
      "form-172.1.part2.7_adjustment_to_itemized_deductions_2nd_preceding": 1225,
      // Line 7 — Adjustment to itemized deductions from line 33 below (1st preceding tax year)
      "form-172.1.part2.7_adjustment_to_itemized_deductions_1st_preceding": 263,
      // Line 9 — Modified taxable income. Add lines 2 through 8. If zero or less, enter -0- (2nd p
      "form-172.1.part2.9_modified_taxable_income_2nd_preceding": 36225,
      // Line 9 — Modified taxable income. Add lines 2 through 8. If zero or less, enter -0- (1st p
      "form-172.1.part2.9_modified_taxable_income_1st_preceding": 18763,
      // Line 10 — NOL carryover to the subsequent year. Subtract line 9 from line 1. If zero or le
      "form-172.1.part2.10_nol_carryover_subsequent_year_2nd_preceding": 23775,
      // Line 10 — NOL carryover to the subsequent year. Subtract line 9 from line 1. If zero or le
      "form-172.1.part2.10_nol_carryover_subsequent_year_1st_preceding": 5012,
      // Line 11 — AGI before the current year NOL carryback (2nd preceding tax year)
      "form-172.1.part2.11_agi_before_carryback_2nd_preceding": 50000,
      // Line 11 — AGI before the current year NOL carryback (1st preceding tax year)
      "form-172.1.part2.11_agi_before_carryback_1st_preceding": 40000,
      // Line 12 — Add lines 3 through 6 above (2nd preceding tax year)
      "form-172.1.part2.12_add_lines_3_through_6_2nd_preceding": 7000,
      // Line 12 — Add lines 3 through 6 above (1st preceding tax year)
      "form-172.1.part2.12_add_lines_3_through_6_1st_preceding": 3500,
      // Line 13 — Modified AGI. Add lines 11 and 12 (2nd preceding tax year)
      "form-172.1.part2.13_modified_agi_2nd_preceding": 57000,
      // Line 13 — Modified AGI. Add lines 11 and 12 (1st preceding tax year)
      "form-172.1.part2.13_modified_agi_1st_preceding": 43500,
      // Line 14 — Medical and dental expenses after AGI limitation from Sch. A (Form 1040), or as
      "form-172.1.part2.14_medical_after_agi_limitation_2nd_preceding": 2250,
      // Line 14 — Medical and dental expenses after AGI limitation from Sch. A (Form 1040), or as
      "form-172.1.part2.14_medical_after_agi_limitation_1st_preceding": 2000,
      // Line 15 — Medical and dental expenses before AGI limitation from Sch. A (Form 1040), or as
      "form-172.1.part2.15_medical_before_agi_limitation_2nd_preceding": 6000,
      // Line 15 — Medical and dental expenses before AGI limitation from Sch. A (Form 1040), or as
      "form-172.1.part2.15_medical_before_agi_limitation_1st_preceding": 5000,
      // Line 16 — Multiply line 13 by 7.5% (0.075) (2nd preceding tax year)
      "form-172.1.part2.16_modified_agi_times_7_5_pct_2nd_preceding": 4275,
      // Line 16 — Multiply line 13 by 7.5% (0.075) (1st preceding tax year)
      "form-172.1.part2.16_modified_agi_times_7_5_pct_1st_preceding": 3263,
      // Line 17 — Subtract line 16 from line 15. If zero or less, enter -0- (2nd preceding tax yea
      "form-172.1.part2.17_refigured_medical_deduction_2nd_preceding": 1725,
      // Line 17 — Subtract line 16 from line 15. If zero or less, enter -0- (1st preceding tax yea
      "form-172.1.part2.17_refigured_medical_deduction_1st_preceding": 1737,
      // Line 18 — Subtract line 17 from line 14 (2nd preceding tax year)
      "form-172.1.part2.18_medical_adjustment_2nd_preceding": 525,
      // Line 18 — Subtract line 17 from line 14 (1st preceding tax year)
      "form-172.1.part2.18_medical_adjustment_1st_preceding": 263,
      // Line 22 — Modified AGI from line 13 (2nd preceding tax year)
      "form-172.2.part2.22_modified_agi_2nd_preceding": 57000,
      // Line 22 — Modified AGI from line 13 (1st preceding tax year)
      "form-172.2.part2.22_modified_agi_1st_preceding": 43500,
      // Line 23 — Enter as a positive number any NOL carryback from a prior year that was deducted
      "form-172.2.part2.23_nol_carryback_deducted_2nd_preceding": 25000,
      // Line 23 — Enter as a positive number any NOL carryback from a prior year that was deducted
      "form-172.2.part2.23_nol_carryback_deducted_1st_preceding": 10000,
      // Line 24 — Add lines 22 and 23 (2nd preceding tax year)
      "form-172.2.part2.24_add_lines_22_23_2nd_preceding": 82000,
      // Line 24 — Add lines 22 and 23 (1st preceding tax year)
      "form-172.2.part2.24_add_lines_22_23_1st_preceding": 53500,
      // Line 25 — Total charitable contributions for Sch. A (Form 1040 or Form 1040-NR), or as pre
      "form-172.2.part2.25_total_charitable_contributions_2nd_preceding": 5000,
      // Line 25 — Total charitable contributions for Sch. A (Form 1040 or Form 1040-NR), or as pre
      "form-172.2.part2.25_total_charitable_contributions_1st_preceding": 3000,
      // Line 26 — Refigured charitable contributions (2nd preceding tax year)
      "form-172.2.part2.26_refigured_charitable_contributions_2nd_preceding": 5000,
      // Line 26 — Refigured charitable contributions (1st preceding tax year)
      "form-172.2.part2.26_refigured_charitable_contributions_1st_preceding": 3000,
      // Line 28 — Casualty and theft losses deduction from Form 4684 (2nd preceding tax year)
      "form-172.2.part2.28_casualty_theft_deduction_2nd_preceding": 4000,
      // Line 29 — Casualty and theft losses before AGI limitation from Form 4684 (2nd preceding ta
      "form-172.2.part2.29_casualty_theft_before_agi_limit_2nd_preceding": 9000,
      // Line 30 — Multiply line 22 by 10% (0.10) (2nd preceding tax year)
      "form-172.2.part2.30_ten_percent_of_line_22_2nd_preceding": 5700,
      // Line 30 — Multiply line 22 by 10% (0.10) (1st preceding tax year)
      "form-172.2.part2.30_ten_percent_of_line_22_1st_preceding": 4350,
      // Line 31 — Subtract line 30 from line 29. If zero or less, enter -0- (2nd preceding tax yea
      "form-172.2.part2.31_subtract_line_30_from_29_2nd_preceding": 3300,
      // Line 32 — Subtract line 31 from line 28 (2nd preceding tax year)
      "form-172.2.part2.32_casualty_theft_adjustment_2nd_preceding": 700,
      // Line 33 — Combine lines 18, 21, 27, and 32 (2nd preceding tax year)
      "form-172.2.part2.33_itemized_deductions_adjustment_2nd_preceding": 1225,
      // Line 33 — Combine lines 18, 21, 27, and 32 (1st preceding tax year)
      "form-172.2.part2.33_itemized_deductions_adjustment_1st_preceding": 263,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 6 — Farm income or (loss). Attach Schedule F
      "schedule-1.0.line.6": -80000,
      // Line 8a — Net operating loss
      "schedule-1.0.line.8a": 5000,
      // Line 9 — Total other income. Add lines 8a through 8z
      "schedule-1.0.line.9": -5000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": -85000,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 20000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 20000,
      // Line 2b — Taxable interest
      "form-1040.line.2b": 1200,
      // Line 3a — Qualified dividends
      "form-1040.line.3a": 300,
      // Line 3b — Ordinary dividends
      "form-1040.line.3b": 800,
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": -3000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": -85000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": -66000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": -66000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": -66000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 1000,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 1000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 1000,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 1000,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 1000,
    },
  },
  "schedule-f": {
    engineFields: {
      // Line 2 — Sales of livestock, produce, grains, and other products you raised
      "schedule-f.0.line.2_sales_products_raised": 60000,
      // Line 9 — Gross income. Add amounts in the right column (lines 1c, 2, 3b, 4b, 5a, 5c, 6b, 6
      "schedule-f.0.line.9_gross_income": 60000,
      // Line 11 — Chemicals
      "schedule-f.0.line.11_chemicals": 30000,
      // Line 25 — Repairs and maintenance
      "schedule-f.0.line.25_repairs_maintenance": 15000,
      // Line 26 — Seeds and plants
      "schedule-f.0.line.26_seeds_plants": 40000,
      // Line 17 — Fertilizers and lime
      "schedule-f.0.line.17_fertilizers_lime": 30000,
      // Line 22 — Labor hired (less employment credits)
      "schedule-f.0.line.22_labor_hired": 25000,
      // Line 33 — Total expenses. Add lines 10 through 32f
      "schedule-f.0.line.33_total_expenses": 140000,
      // Line 34 — Net farm profit or (loss). Subtract line 33 from line 9
      "schedule-f.0.line.34_net_farm_profit_loss": -80000,
    },
  },
  "schedule-d": {
    engineFields: {
      // Line 1b — Proceeds (sales price) — Totals for all transactions reported on Form(s) 8949 wi
      "schedule-d.0.line.1b_proceeds": 11000,
      // Line 1b — Cost (or other basis) — Totals for all transactions reported on Form(s) 8949 wit
      "schedule-d.0.line.1b_cost": 20000,
      // Line 1b — Gain or (loss) — Totals for all transactions reported on Form(s) 8949 with Box A
      "schedule-d.0.line.1b_gain_loss": -9000,
      // Line 7 — Net short-term capital gain or (loss). Combine lines 1a through 6 in column (h)
      "schedule-d.0.line.7_net_short_term_gain_loss": -9000,
      // Line 8b — Proceeds (sales price) — Totals for all transactions reported on Form(s) 8949 wi
      "schedule-d.0.line.8b_proceeds": 8000,
      // Line 8b — Cost (or other basis) — Totals for all transactions reported on Form(s) 8949 wit
      "schedule-d.0.line.8b_cost": 6000,
      // Line 8b — Gain or (loss) — Totals for all transactions reported on Form(s) 8949 with Box D
      "schedule-d.0.line.8b_gain_loss": 2000,
      // Line 10 — Proceeds (sales price) — Totals for all transactions reported on Form(s) 8949 wi
      "schedule-d.0.line.10_proceeds": 500,
      // Line 10 — Cost (or other basis) — Totals for all transactions reported on Form(s) 8949 wit
      "schedule-d.0.line.10_cost": 2000,
      // Line 10 — Gain or (loss) — Totals for all transactions reported on Form(s) 8949 with Box F
      "schedule-d.0.line.10_gain_loss": -1500,
      // Line 13 — Capital gain distributions
      "schedule-d.0.line.13_capital_gain_distributions": 500,
      // Line 15 — Net long-term capital gain or (loss). Combine lines 8a through 14 in column (h)
      "schedule-d.0.line.15_net_long_term_gain_loss": 1000,
      // Line 16 — Combine lines 7 and 15 and enter the result
      "schedule-d.1.line.16_combined_gain_loss": -8000,
      // Line 21 — If line 16 is a loss, enter here and on Form 1040, 1040-SR, or 1040-NR, line 7a,
      "schedule-d.1.line.21_allowable_loss": 3000,
    },
  },
  "form-8949": {
    engineFields: {
      // Row 1 — (d) Proceeds (sales price)
      "form-8949.0.part1.row1_proceeds": 11000,
      // Row 1 — (e) Cost or other basis
      "form-8949.0.part1.row1_cost_basis": 20000,
      // Row 1 — (h) Gain or (loss)
      "form-8949.0.part1.row1_gain_loss": -9000,
      // Line 2 Totals — (d) Proceeds (sales price)
      "form-8949.0.part1.totals_proceeds": 11000,
      // Line 2 Totals — (e) Cost or other basis
      "form-8949.0.part1.totals_cost_basis": 20000,
      // Line 2 Totals — (h) Gain or (loss)
      "form-8949.0.part1.totals_gain_loss": -9000,
      // Row 1 — (d) Proceeds (sales price)
      "form-8949.1.part2.row1_proceeds": 8000,
      // Row 1 — (e) Cost or other basis
      "form-8949.1.part2.row1_cost_basis": 6000,
      // Row 1 — (h) Gain or (loss)
      "form-8949.1.part2.row1_gain_loss": 2000,
      // Line 2 Totals — (d) Proceeds (sales price)
      "form-8949.1.part2.totals_proceeds": 8000,
      // Line 2 Totals — (e) Cost or other basis
      "form-8949.1.part2.totals_cost_basis": 6000,
      // Line 2 Totals — (h) Gain or (loss)
      "form-8949.1.part2.totals_gain_loss": 2000,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": -80000,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": -80000,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": -81750,
      // Line 12 — Enter your net capital gain, if any, increased by any qualified dividends
      "form-8995.0.line.12": 300,
      // Line 16 — Total qualified business (loss) carryforward. Combine lines 2 and 3. If greater
      "form-8995.0.line.16": 80000,
    },
  },
};

export function galinaExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
