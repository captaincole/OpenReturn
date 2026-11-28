/*
 * bran — LOCKED expected values, drafted from the engine's
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
  "form-7207": {
    engineFields: {
      // Line 1a — Thin film photovoltaic cell or crystalline photovoltaic cell, column (d): aggreg
      "form-7207.0.part2.1a_thin_film_pv_cell_col_d": 240000,
      // Line 1a — Thin film photovoltaic cell or crystalline photovoltaic cell, column (e): amount
      "form-7207.0.part2.1a_thin_film_pv_cell_col_e": 9600,
      // Line 1b — Photovoltaic wafer, column (d): number of units (square meters)
      "form-7207.0.part2.1b_photovoltaic_wafer_col_d": 500,
      // Line 1b — Photovoltaic wafer, column (e): amount of credit (column (c) multiplied by colum
      "form-7207.0.part2.1b_photovoltaic_wafer_col_e": 6000,
      // Line 1c — Solar grade polysilicon, column (d): number of units (kilograms)
      "form-7207.0.part2.1c_solar_grade_polysilicon_col_d": 1200,
      // Line 1c — Solar grade polysilicon, column (e): amount of credit (column (c) multiplied by
      "form-7207.0.part2.1c_solar_grade_polysilicon_col_e": 3600,
      // Line 1d — Polymeric backsheet, column (d): number of units (square meters)
      "form-7207.0.part2.1d_polymeric_backsheet_col_d": 2500,
      // Line 1d — Polymeric backsheet, column (e): amount of credit (column (c) multiplied by colu
      "form-7207.0.part2.1d_polymeric_backsheet_col_e": 1000,
      // Line 1e — Solar module, column (d): aggregate capacity in direct current watts
      "form-7207.0.part2.1e_solar_module_col_d": 165000,
      // Line 1e — Solar module, column (e): amount of credit (column (c) multiplied by column (d))
      "form-7207.0.part2.1e_solar_module_col_e": 11550,
      // Line 1f — Torque tube (for solar tracking device), column (d): number of units (kilograms)
      "form-7207.0.part2.1f_torque_tube_col_d": 8000,
      // Line 1f — Torque tube (for solar tracking device), column (e): amount of credit (column (c
      "form-7207.0.part2.1f_torque_tube_col_e": 6960,
      // Line 1g — Structural fastener (for solar tracking device), column (d): number of units (ki
      "form-7207.0.part2.1g_structural_fastener_col_d": 1500,
      // Line 1g — Structural fastener (for solar tracking device), column (e): amount of credit (c
      "form-7207.0.part2.1g_structural_fastener_col_e": 3420,
      // Line 2a — Related offshore wind vessel(s) from Part III, column (d): sales price from Part
      "form-7207.0.part2.2a_offshore_wind_vessel_col_d": 420000,
      // Line 2a — Related offshore wind vessel(s) from Part III, column (e): amount of credit (col
      "form-7207.0.part2.2a_offshore_wind_vessel_col_e": 42000,
      // Line 2b — Blade, column (d): aggregate capacity (total rated capacity, per watt, of the co
      "form-7207.0.part2.2b_blade_col_d": 240000,
      // Line 2b — Blade, column (e): amount of credit (column (c) multiplied by column (d))
      "form-7207.0.part2.2b_blade_col_e": 4800,
      // Line 2c — Nacelle, column (d): aggregate capacity (total rated capacity, per watt, of the
      "form-7207.0.part2.2c_nacelle_col_d": 80000,
      // Line 2c — Nacelle, column (e): amount of credit (column (c) multiplied by column (d))
      "form-7207.0.part2.2c_nacelle_col_e": 4000,
      // Line 2d — Tower, column (d): aggregate capacity (total rated capacity, per watt, of the co
      "form-7207.0.part2.2d_tower_col_d": 80000,
      // Line 2d — Tower, column (e): amount of credit (column (c) multiplied by column (d))
      "form-7207.0.part2.2d_tower_col_e": 2400,
      // Line 2e — Offshore wind foundation which uses a fixed platform, column (d): aggregate capa
      "form-7207.0.part2.2e_fixed_platform_foundation_col_d": 150000,
      // Line 2e — Offshore wind foundation which uses a fixed platform, column (e): amount of cred
      "form-7207.0.part2.2e_fixed_platform_foundation_col_e": 3000,
      // Line 2f — Offshore wind foundation which uses a floating platform, column (d): aggregate c
      "form-7207.0.part2.2f_floating_platform_foundation_col_d": 100000,
      // Line 2f — Offshore wind foundation which uses a floating platform, column (e): amount of c
      "form-7207.0.part2.2f_floating_platform_foundation_col_e": 4000,
      // Line 3a — Central inverter: (d) aggregate capacity (capacity expressed on a per alternatin
      "form-7207.1.line.3a_central_inverter_col_d": 2400000,
      // Line 3a — Central inverter: (e) amount of credit (column (c) multiplied by column (d))
      "form-7207.1.line.3a_central_inverter_col_e": 6000,
      // Line 3b — Utility inverter: (d) aggregate capacity (capacity expressed on a per alternatin
      "form-7207.1.line.3b_utility_inverter_col_d": 600000,
      // Line 3b — Utility inverter: (e) amount of credit (column (c) multiplied by column (d))
      "form-7207.1.line.3b_utility_inverter_col_e": 9000,
      // Line 3c — Commercial inverter: (d) aggregate capacity (capacity expressed on a per alterna
      "form-7207.1.line.3c_commercial_inverter_col_d": 500000,
      // Line 3c — Commercial inverter: (e) amount of credit (column (c) multiplied by column (d))
      "form-7207.1.line.3c_commercial_inverter_col_e": 10000,
      // Line 3d — Residential inverter: (d) aggregate capacity (capacity expressed on a per altern
      "form-7207.1.line.3d_residential_inverter_col_d": 304000,
      // Line 3d — Residential inverter: (e) amount of credit (column (c) multiplied by column (d))
      "form-7207.1.line.3d_residential_inverter_col_e": 19760,
      // Line 3e — Microinverter: (d) aggregate capacity (capacity expressed on a per alternating c
      "form-7207.1.line.3e_microinverter_col_d": 105000,
      // Line 3e — Microinverter: (e) amount of credit (column (c) multiplied by column (d))
      "form-7207.1.line.3e_microinverter_col_e": 11550,
      // Line 3f — Distributed wind inverter: (d) aggregate capacity (capacity expressed on a per a
      "form-7207.1.line.3f_distributed_wind_inverter_col_d": 80000,
      // Line 3f — Distributed wind inverter: (e) amount of credit (column (c) multiplied by column
      "form-7207.1.line.3f_distributed_wind_inverter_col_e": 8800,
      // Line 4a — Electrode active materials: (d) costs incurred by taxpayer with respect to the p
      "form-7207.1.line.4a_electrode_active_materials_col_d": 64500,
      // Line 4a — Electrode active materials: (e) amount of credit (column (c) multiplied by colum
      "form-7207.1.line.4a_electrode_active_materials_col_e": 6450,
      // Line 5a — Battery cell: (d) aggregate capacity (capacity expressed on a kilowatt-hour basi
      "form-7207.1.line.5a_battery_cell_col_d": 360,
      // Line 5a — Battery cell: (e) amount of credit (column (c) multiplied by column (d))
      "form-7207.1.line.5a_battery_cell_col_e": 12600,
      // Line 5b — Battery module which uses battery cells: (d) aggregate capacity (capacity expres
      "form-7207.1.line.5b_battery_module_with_cells_col_d": 405,
      // Line 5b — Battery module which uses battery cells: (e) amount of credit (column (c) multip
      "form-7207.1.line.5b_battery_module_with_cells_col_e": 4050,
      // Line 5c — Battery module which does not use battery cells: (d) aggregate capacity (capacit
      "form-7207.1.line.5c_battery_module_without_cells_col_d": 100,
      // Line 5c — Battery module which does not use battery cells: (e) amount of credit (column (c
      "form-7207.1.line.5c_battery_module_without_cells_col_e": 4500,
      // Line 6a — Applicable critical minerals from Part IV: (d) amount from Part IV, line 74
      "form-7207.1.line.6a_applicable_critical_minerals_col_d": 83250,
      // Line 6a — Applicable critical minerals from Part IV: (e) amount of credit (column (c) mult
      "form-7207.1.line.6a_applicable_critical_minerals_col_e": 8325,
      // Line 8a — Add amounts in column (e), lines 1 through 7
      "form-7207.1.line.8a_total_credit": 203365,
      // Line 1 — Sales price
      "form-7207.2.part3.row1_sales_price": 180000,
      // Line 2 — Sales price
      "form-7207.2.part3.row2_sales_price": 240000,
      // Total of sales prices on lines 1 through 49 (total of all Parts III)
      "form-7207.2.part3.total_sales_prices": 420000,
      // Line 30 — Graphite purified to a minimum purity of 99.9% graphitic carbon by mass: costs i
      "form-7207.3.part4.30_graphite_purified_cost": 18250,
      // Line 38 — Lithium converted to lithium carbonate or lithium hydroxide: costs incurred
      "form-7207.3.part4.38_lithium_carbonate_hydroxide_cost": 40000,
      // Line 47 — Nickel converted to nickel sulphate: costs incurred
      "form-7207.3.part4.47_nickel_sulphate_cost": 25000,
      // Line 74 — Total costs
      "form-7207.4.part4.74_total_costs": 83250,
    },
  },
  "form-3800": {
    engineFields: {
      // B(ii) — If "Yes," enter the number of transfer election statements attached to your return
      "form-3800.0.header.b_ii_transfer_election_statements_count": 1,
      // Line 1 — Credits not subject to the passive activity limit from Part III, line 2: combine
      "form-3800.0.line.1_credits_not_passive_limited": 153365,
      // Line 6 — Add lines 1, 3, 4, and 5
      "form-3800.0.line.6_total_credits_not_allowed_tmt": 153365,
      // Line 7 — Regular tax before credits
      "form-3800.0.line.7_regular_tax_before_credits": 299570,
      // Line 9 — Add lines 7 and 8
      "form-3800.0.line.9_regular_tax_plus_amt": 299570,
      // Line 11 — Net income tax. Subtract line 10c from line 9
      "form-3800.0.line.11_net_income_tax": 299570,
      // Line 12 — Net regular tax. Subtract line 10c from line 7. If zero or less, enter -0-
      "form-3800.0.line.12_net_regular_tax": 299570,
      // Line 13 — Enter 25% (0.25) of the excess, if any, of line 12 (line 11 for corporations) ov
      "form-3800.0.line.13_25_percent_of_excess": 68643,
      // Line 14 — Tentative minimum tax
      "form-3800.0.line.14_tentative_minimum_tax": 256252,
      // Line 15 — Enter the greater of line 13 or line 14
      "form-3800.0.line.15_greater_of_line_13_or_14": 256252,
      // Line 16 — Subtract line 15 from line 11. If zero or less, enter -0-
      "form-3800.0.line.16_net_income_tax_less_line_15": 43318,
      // Line 17 — Enter the smaller of line 6 or line 16. This is the amount of your credit allowe
      "form-3800.0.line.17_credit_allowed_after_38c1_limit": 43318,
      // Line 27 — Subtract line 13 from line 11. If zero or less, enter -0-
      "form-3800.1.line.27_subtract_line_13_from_11": 230927,
      // Line 28 — Add lines 17 and 26
      "form-3800.1.line.28_add_lines_17_and_26": 43318,
      // Line 29 — Subtract line 28 from line 27. If zero or less, enter -0-
      "form-3800.1.line.29_subtract_line_28_from_27": 187609,
      // Line 38 — Credit allowed for the current year. Add lines 28 and 37
      "form-3800.1.line.38_credit_allowed_current_year": 43318,
      // Line 1b — Form 7207 — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.1b_form_7207_col_e": 203365,
      // Line 1b — Form 7207 — (f) Credit transfer election amount (enter amounts transferred out a
      "form-3800.2.part3.1b_form_7207_col_f": -50000,
      // Line 1b — Form 7207 — (g) Combine columns (e) and (f) with the credit from column (d) allo
      "form-3800.2.part3.1b_form_7207_col_g": 153365,
      // Line 1b — Form 7207 — (i) Amount of column (g) applied against tax in Part II
      "form-3800.2.part3.1b_form_7207_col_i": 43318,
      // Line 2 — Add lines 1a–1zz — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.2_add_lines_1a_1zz_col_e": 203365,
      // Line 2 — Add lines 1a–1zz — (f) Credit transfer election amount (enter amounts transferred
      "form-3800.2.part3.2_add_lines_1a_1zz_col_f": -50000,
      // Line 2 — Add lines 1a–1zz — (g) Combine columns (e) and (f) with the credit from column (d
      "form-3800.2.part3.2_add_lines_1a_1zz_col_g": 153365,
      // Line 2 — Add lines 1a–1zz — (i) Amount of column (g) applied against tax in Part II
      "form-3800.2.part3.2_add_lines_1a_1zz_col_i": 43318,
      // Line 6 — Add lines 2, 3, and 5: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.6_add_lines_2_3_5_col_e": 203365,
      // Line 6 — Add lines 2, 3, and 5: (f) Credit transfer election amount (enter amounts transfe
      "form-3800.3.part3.6_add_lines_2_3_5_col_f": -50000,
      // Line 6 — Add lines 2, 3, and 5: (g) Combine columns (e) and (f) with the credit from colum
      "form-3800.3.part3.6_add_lines_2_3_5_col_g": 153365,
      // Line 6 — Add lines 2, 3, and 5: (i) Amount of column (g) applied against tax in Part II
      "form-3800.3.part3.6_add_lines_2_3_5_col_i": 43318,
    },
  },
  "form-6251": {
    engineFields: {
      // Line 1a — Subtract Schedule 1-A (Form 1040), line 37, from Form 1040, 1040-SR, or 1040-NR,
      "form-6251.0.line.1a_deductions_less_schedule_1a": 247203,
      // Line 1b — Subtract line 1a from Form 1040, 1040-SR, or 1040-NR, line 11b (if less than zer
      "form-6251.0.line.1b_taxable_income_start": 925810,
      // Line 2a — If filing Schedule A (Form 1040), enter the taxes from Schedule A, line 7; other
      "form-6251.0.line.2a_taxes_or_standard_deduction": 15750,
      // Line 4 — Alternative minimum taxable income. Combine lines 1b through 3
      "form-6251.0.line.4_alternative_minimum_taxable_income": 941560,
      // Line 5 — Exemption
      "form-6251.0.line.5_exemption": 9297,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-6251.0.line.6_amti_less_exemption": 932263,
      // Line 7 — Tax on line 6: complete Part III and enter line 40 if you have capital gain distr
      "form-6251.0.line.7_tax_on_line_6": 256252,
      // Line 9 — Tentative minimum tax. Subtract line 8 from line 7
      "form-6251.0.line.9_tentative_minimum_tax": 256252,
      // Line 10 — Add Form 1040 or 1040-SR, line 16 (minus any tax from Form 4972), and Schedule 2
      "form-6251.0.line.10_regular_tax_less_credits": 299570,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 6a — General business credit. Attach Form 3800
      "schedule-3.0.line.6a": 43318,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 43318,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 43318,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 1200000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 1200000,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 26987,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 1173013,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 1173013,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 231453,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 247203,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 925810,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 299570,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 299570,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 43318,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 43318,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 256252,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 62148,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 318400,
      // Line 37 — Amount you owe
      "form-1040.line.37": 318400,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 1200000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 1200000,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 26987,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 26987,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 53974,
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 8174,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 62148,
    },
  },
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 6400000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 6400000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 6400000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 6400000,
      // Line 21 — Repairs and maintenance
      "schedule-c.0.line.21": 38000,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 3150000,
      // Line 23 — Taxes and licenses
      "schedule-c.0.line.23": 116000,
      // Line 13 — Depreciation and section 179 expense deduction (not included in Part III)
      "schedule-c.0.line.13": 310000,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 64000,
      // Line 25 — Utilities
      "schedule-c.0.line.25": 142000,
      // Line 26 — Wages (less employment credits)
      "schedule-c.0.line.26": 1380000,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 5200000,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 1200000,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 1200000,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 1200000,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 1200000,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 1108200,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 1108200,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 1108200,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 21836,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 32138,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 53974,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 26987,
    },
  },
  "form-8959": {
    engineFields: {
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 200000,
      // Line 8 — Self-employment income from Schedule SE (Form 1040), Part I, line 6
      "form-8959.0.line.8_self_employment_income": 1108200,
      // Line 9 — Enter the following amount for your filing status
      "form-8959.0.line.9_filing_status_threshold_se": 200000,
      // Line 11 — Subtract line 10 from line 9. If zero or less, enter -0-
      "form-8959.0.line.11_threshold_reduced_by_wages": 200000,
      // Line 12 — Subtract line 11 from line 8. If zero or less, enter -0-
      "form-8959.0.line.12_excess_se_income": 908200,
      // Line 13 — Additional Medicare Tax on self-employment income. Multiply line 12 by 0.9% (0.0
      "form-8959.0.line.13_additional_medicare_tax_se": 8174,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 8174,
    },
  },
  "form-8995-a": {
    engineFields: {
      // Line 2 — Qualified business income from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.2_a": 1173013,
      // Line 3 — Multiply line 2 by 20% (0.20) (Column A)
      "form-8995-a.0.line.3_a": 234603,
      // Line 4 — Allocable share of W-2 wages from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.4_a": 1380000,
      // Line 5 — Multiply line 4 by 50% (0.50) (Column A)
      "form-8995-a.0.line.5_a": 690000,
      // Line 6 — Multiply line 4 by 25% (0.25) (Column A)
      "form-8995-a.0.line.6_a": 345000,
      // Line 7 — Allocable share of the unadjusted basis immediately after acquisition (UBIA) of a
      "form-8995-a.0.line.7_a": 4200000,
      // Line 8 — Multiply line 7 by 2.5% (0.025) (Column A)
      "form-8995-a.0.line.8_a": 105000,
      // Line 9 — Add lines 6 and 8 (Column A)
      "form-8995-a.0.line.9_a": 450000,
      // Line 10 — Enter the greater of line 5 or line 9 (Column A)
      "form-8995-a.0.line.10_a": 690000,
      // Line 11 — W-2 wage and UBIA of qualified property limitation. Enter the smaller of line 3
      "form-8995-a.0.line.11_a": 234603,
      // Line 13 — Qualified business income deduction before patron reduction. Enter the greater o
      "form-8995-a.0.line.13_a": 234603,
      // Line 15 — Qualified business income component. Subtract line 14 from line 13 (Column A)
      "form-8995-a.0.line.15_a": 234603,
      // Line 16 — Total qualified business income component. Add all amounts reported on line 15
      "form-8995-a.0.line.16": 234603,
      // Line 27 — Total qualified business income component from all qualified trades, businesses,
      "form-8995-a.1.line.27": 234603,
      // Line 32 — Qualified business income deduction before the income limitation. Add lines 27 a
      "form-8995-a.1.line.32": 234603,
      // Line 33 — Taxable income before qualified business income deduction
      "form-8995-a.1.line.33": 1157263,
      // Line 35 — Subtract line 34 from line 33. If zero or less, enter -0-
      "form-8995-a.1.line.35": 1157263,
      // Line 36 — Income limitation. Multiply line 35 by 20% (0.20)
      "form-8995-a.1.line.36": 231453,
      // Line 37 — Qualified business income deduction before the domestic production activities de
      "form-8995-a.1.line.37": 231453,
      // Line 39 — Total qualified business income deduction. Add lines 37 and 38
      "form-8995-a.1.line.39": 231453,
    },
  },
};

export function branExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
