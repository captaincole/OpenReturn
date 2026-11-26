/*
 * meilyn — LOCKED expected values, drafted from the engine's
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
  "form-4136": {
    engineFields: {
      // (B) If "Yes," how many different business activities do you have that qualify for this cre
      "form-4136.0.header.b_number_of_business_activities": 1,
      // Line 1a — Nontaxable use of gasoline, off-highway business use: (c) Qualified gallons
      "form-4136.0.line.1a_gasoline_off_highway_business_col_c": 1200,
      // Line 1b — Nontaxable use of gasoline, use on a farm for farming purposes: (c) Qualified ga
      "form-4136.0.line.1b_gasoline_farm_use_col_c": 800,
      // Line 1c — Nontaxable use of gasoline, other nontaxable use: (c) Qualified gallons
      "form-4136.0.line.1c_gasoline_other_nontaxable_use_col_c": 300,
      // Lines 1a through 1c — Nontaxable use of gasoline: (d) Actual fuel cost from your records
      "form-4136.0.line.1c_gasoline_other_nontaxable_use_col_d": 7935,
      // Lines 1a through 1c — Nontaxable use of gasoline: (d) Actual fuel cost from your records (
      "form-4136.0.line.1c_gasoline_other_nontaxable_use_col_d_cents": 50,
      // Lines 1a through 1c — Nontaxable use of gasoline: (e) Amount of credit
      "form-4136.0.line.1c_gasoline_other_nontaxable_use_col_e": 420,
      // Lines 1a through 1c — Nontaxable use of gasoline: (e) Amount of credit (cents)
      "form-4136.0.line.1c_gasoline_other_nontaxable_use_col_e_cents": 90,
      // Line 1d — Nontaxable use of gasoline, exported: (c) Qualified gallons
      "form-4136.0.line.1d_gasoline_exported_col_c": 500,
      // Line 1d — Nontaxable use of gasoline, exported: (d) Actual fuel cost from your records
      "form-4136.0.line.1d_gasoline_exported_col_d": 1690,
      // Line 1d — Nontaxable use of gasoline, exported: (e) Amount of credit
      "form-4136.0.line.1d_gasoline_exported_col_e": 92,
      // Line 2a — Nontaxable use of aviation gasoline, use in commercial aviation (other than fore
      "form-4136.0.line.2a_aviation_gasoline_commercial_aviation_col_c": 2000,
      // Line 2a — Nontaxable use of aviation gasoline, use in commercial aviation (other than fore
      "form-4136.0.line.2a_aviation_gasoline_commercial_aviation_col_d": 9800,
      // Line 2a — Nontaxable use of aviation gasoline, use in commercial aviation (other than fore
      "form-4136.0.line.2a_aviation_gasoline_commercial_aviation_col_e": 300,
      // Line 2b — Nontaxable use of aviation gasoline, other nontaxable use: (c) Qualified gallons
      "form-4136.0.line.2b_aviation_gasoline_other_nontaxable_use_col_c": 400,
      // Line 2b — Nontaxable use of aviation gasoline, other nontaxable use: (d) Actual fuel cost
      "form-4136.0.line.2b_aviation_gasoline_other_nontaxable_use_col_d": 2240,
      // Line 2b — Nontaxable use of aviation gasoline, other nontaxable use: (e) Amount of credit
      "form-4136.0.line.2b_aviation_gasoline_other_nontaxable_use_col_e": 77,
      // Line 2b — Nontaxable use of aviation gasoline, other nontaxable use: (e) Amount of credit
      "form-4136.0.line.2b_aviation_gasoline_other_nontaxable_use_col_e_cents": 20,
      // Line 2c — Nontaxable use of aviation gasoline, exported: (c) Qualified gallons
      "form-4136.0.line.2c_aviation_gasoline_exported_col_c": 250,
      // Line 2c — Nontaxable use of aviation gasoline, exported: (d) Actual fuel cost from your re
      "form-4136.0.line.2c_aviation_gasoline_exported_col_d": 1350,
      // Line 2c — Nontaxable use of aviation gasoline, exported: (e) Amount of credit
      "form-4136.0.line.2c_aviation_gasoline_exported_col_e": 48,
      // Line 2c — Nontaxable use of aviation gasoline, exported: (e) Amount of credit (cents)
      "form-4136.0.line.2c_aviation_gasoline_exported_col_e_cents": 50,
      // Line 2d — LUST tax on aviation fuels used in foreign trade: (c) Qualified gallons
      "form-4136.0.line.2d_aviation_gasoline_lust_foreign_trade_col_c": 1000,
      // Line 2d — LUST tax on aviation fuels used in foreign trade: (d) Actual fuel cost from your
      "form-4136.0.line.2d_aviation_gasoline_lust_foreign_trade_col_d": 5300,
      // Line 2d — LUST tax on aviation fuels used in foreign trade: (e) Amount of credit
      "form-4136.0.line.2d_aviation_gasoline_lust_foreign_trade_col_e": 1,
      // Line 3a — Nontaxable use of undyed diesel fuel, nontaxable use: (c) Qualified gallons
      "form-4136.0.line.3a_undyed_diesel_nontaxable_use_col_c": 1500,
      // Line 3b — Nontaxable use of undyed diesel fuel, use on a farm for farming purposes: (c) Qu
      "form-4136.0.line.3b_undyed_diesel_farm_use_col_c": 2500,
      // Lines 3a and 3b — Nontaxable use of undyed diesel fuel: (d) Actual fuel cost from your rec
      "form-4136.0.line.3b_undyed_diesel_farm_use_col_d": 14400,
      // Lines 3a and 3b — Nontaxable use of undyed diesel fuel: (e) Amount of credit
      "form-4136.0.line.3b_undyed_diesel_farm_use_col_e": 972,
      // Line 3c — Nontaxable use of undyed diesel fuel, use in trains: (c) Qualified gallons
      "form-4136.0.line.3c_undyed_diesel_trains_col_c": 600,
      // Line 3c — Nontaxable use of undyed diesel fuel, use in trains: (d) Actual fuel cost from y
      "form-4136.0.line.3c_undyed_diesel_trains_col_d": 2100,
      // Line 3c — Nontaxable use of undyed diesel fuel, use in trains: (e) Amount of credit
      "form-4136.0.line.3c_undyed_diesel_trains_col_e": 145,
      // Line 3c — Nontaxable use of undyed diesel fuel, use in trains: (e) Amount of credit (cents
      "form-4136.0.line.3c_undyed_diesel_trains_col_e_cents": 80,
      // Line 3d — Nontaxable use of undyed diesel fuel, use in certain intercity and local buses:
      "form-4136.0.line.3d_undyed_diesel_intercity_local_buses_col_c": 900,
      // Line 3d — Nontaxable use of undyed diesel fuel, use in certain intercity and local buses:
      "form-4136.0.line.3d_undyed_diesel_intercity_local_buses_col_d": 3240,
      // Line 3d — Nontaxable use of undyed diesel fuel, use in certain intercity and local buses:
      "form-4136.0.line.3d_undyed_diesel_intercity_local_buses_col_e": 153,
      // Line 3e — Nontaxable use of undyed diesel fuel, exported: (c) Qualified gallons
      "form-4136.0.line.3e_undyed_diesel_exported_col_c": 700,
      // Line 3e — Nontaxable use of undyed diesel fuel, exported: (d) Actual fuel cost from your r
      "form-4136.0.line.3e_undyed_diesel_exported_col_d": 2450,
      // Line 3e — Nontaxable use of undyed diesel fuel, exported: (e) Amount of credit
      "form-4136.0.line.3e_undyed_diesel_exported_col_e": 170,
      // Line 3e — Nontaxable use of undyed diesel fuel, exported: (e) Amount of credit (cents)
      "form-4136.0.line.3e_undyed_diesel_exported_col_e_cents": 80,
      // Line 4a — Nontaxable use taxed at $.244: (c) Qualified gallons
      "form-4136.1.line.4a_nontaxable_use_244_col_c": 150,
      // Line 4b — Use on a farm for farming purposes: (c) Qualified gallons
      "form-4136.1.line.4b_farm_use_col_c": 300,
      // Lines 4a and 4b — Nontaxable use taxed at $.244 and use on a farm for farming purposes: (d
      "form-4136.1.line.4b_farm_use_col_d": 1950,
      // Lines 4a and 4b — Nontaxable use taxed at $.244 and use on a farm for farming purposes: (e
      "form-4136.1.line.4b_farm_use_col_e": 109,
      // Line 4c — Use in certain intercity and local buses: (c) Qualified gallons
      "form-4136.1.line.4c_intercity_local_buses_col_c": 200,
      // Line 4c — Use in certain intercity and local buses: (d) Actual fuel cost from your records
      "form-4136.1.line.4c_intercity_local_buses_col_d": 840,
      // Line 4c — Use in certain intercity and local buses: (e) Amount of credit (dollars)
      "form-4136.1.line.4c_intercity_local_buses_col_e": 34,
      // Line 4d — Exported: (c) Qualified gallons
      "form-4136.1.line.4d_exported_col_c": 100,
      // Line 4d — Exported: (d) Actual fuel cost from your records (dollars)
      "form-4136.1.line.4d_exported_col_d": 420,
      // Line 4d — Exported: (e) Amount of credit (dollars)
      "form-4136.1.line.4d_exported_col_e": 24,
      // Line 4e — Nontaxable use taxed at $.044: (c) Qualified gallons
      "form-4136.1.line.4e_nontaxable_use_044_col_c": 400,
      // Line 4e — Nontaxable use taxed at $.044: (d) Actual fuel cost from your records (dollars)
      "form-4136.1.line.4e_nontaxable_use_044_col_d": 1600,
      // Line 4e — Nontaxable use taxed at $.044: (e) Amount of credit (dollars)
      "form-4136.1.line.4e_nontaxable_use_044_col_e": 17,
      // Line 4f — Nontaxable use taxed at $.219: (c) Qualified gallons
      "form-4136.1.line.4f_nontaxable_use_219_col_c": 350,
      // Line 4f — Nontaxable use taxed at $.219: (d) Actual fuel cost from your records (dollars)
      "form-4136.1.line.4f_nontaxable_use_219_col_d": 1470,
      // Line 4f — Nontaxable use taxed at $.219: (e) Amount of credit (dollars)
      "form-4136.1.line.4f_nontaxable_use_219_col_e": 76,
      // Line 5a — Kerosene used in commercial aviation (other than foreign trade) taxed at $.244:
      "form-4136.1.line.5a_commercial_aviation_244_col_c": 3000,
      // Line 5a — Kerosene used in commercial aviation (other than foreign trade) taxed at $.244:
      "form-4136.1.line.5a_commercial_aviation_244_col_d": 13500,
      // Line 5a — Kerosene used in commercial aviation (other than foreign trade) taxed at $.244:
      "form-4136.1.line.5a_commercial_aviation_244_col_e": 600,
      // Line 5b — Kerosene used in commercial aviation (other than foreign trade) taxed at $.219:
      "form-4136.1.line.5b_commercial_aviation_219_col_c": 1000,
      // Line 5b — Kerosene used in commercial aviation (other than foreign trade) taxed at $.219:
      "form-4136.1.line.5b_commercial_aviation_219_col_d": 4500,
      // Line 5b — Kerosene used in commercial aviation (other than foreign trade) taxed at $.219:
      "form-4136.1.line.5b_commercial_aviation_219_col_e": 175,
      // Line 5c — Nontaxable use (other than use by state or local government) taxed at $.244: (c)
      "form-4136.1.line.5c_nontaxable_use_244_col_c": 800,
      // Line 5c — Nontaxable use (other than use by state or local government) taxed at $.244: (d)
      "form-4136.1.line.5c_nontaxable_use_244_col_d": 3600,
      // Line 5c — Nontaxable use (other than use by state or local government) taxed at $.244: (e)
      "form-4136.1.line.5c_nontaxable_use_244_col_e": 194,
      // Line 5d — Nontaxable use (other than use by state or local government) taxed at $.219: (c)
      "form-4136.1.line.5d_nontaxable_use_219_col_c": 600,
      // Line 5d — Nontaxable use (other than use by state or local government) taxed at $.219: (d)
      "form-4136.1.line.5d_nontaxable_use_219_col_d": 2700,
      // Line 5d — Nontaxable use (other than use by state or local government) taxed at $.219: (e)
      "form-4136.1.line.5d_nontaxable_use_219_col_e": 130,
      // Line 5e — LUST tax on aviation fuels used in foreign trade: (c) Qualified gallons
      "form-4136.1.line.5e_lust_tax_foreign_trade_col_c": 500,
      // Line 5e — LUST tax on aviation fuels used in foreign trade: (d) Actual fuel cost from your
      "form-4136.1.line.5e_lust_tax_foreign_trade_col_d": 2250,
      // Line 6a — Use by a state or local government: (c) Qualified gallons
      "form-4136.1.line.6a_state_local_government_col_c": 2000,
      // Line 6a — Use by a state or local government: (d) Actual fuel cost from your records (doll
      "form-4136.1.line.6a_state_local_government_col_d": 7000,
      // Line 6a — Use by a state or local government: (e) Amount of credit (dollars)
      "form-4136.1.line.6a_state_local_government_col_e": 486,
      // Line 6b — Use in certain intercity and local buses: (c) Qualified gallons
      "form-4136.1.line.6b_intercity_local_buses_col_c": 1500,
      // Line 6b — Use in certain intercity and local buses: (d) Actual fuel cost from your records
      "form-4136.1.line.6b_intercity_local_buses_col_d": 5250,
      // Line 6b — Use in certain intercity and local buses: (e) Amount of credit (dollars)
      "form-4136.1.line.6b_intercity_local_buses_col_e": 255,
      // Line 7a — Use by a state or local government: (c) Qualified gallons
      "form-4136.1.line.7a_state_local_government_col_c": 400,
      // Line 7b — Sales from a blocked pump: (c) Qualified gallons
      "form-4136.1.line.7b_blocked_pump_col_c": 600,
      // Lines 7a and 7b — Use by a state or local government and sales from a blocked pump: (d) Ac
      "form-4136.1.line.7b_blocked_pump_col_d": 4000,
      // Lines 7a and 7b — Use by a state or local government and sales from a blocked pump: (e) Am
      "form-4136.1.line.7b_blocked_pump_col_e": 243,
      // Line 7c — Use in certain intercity and local buses: (c) Qualified gallons
      "form-4136.1.line.7c_intercity_local_buses_col_c": 300,
      // Line 7c — Use in certain intercity and local buses: (d) Actual fuel cost from your records
      "form-4136.1.line.7c_intercity_local_buses_col_d": 1200,
      // Line 7c — Use in certain intercity and local buses: (e) Amount of credit (dollars)
      "form-4136.1.line.7c_intercity_local_buses_col_e": 51,
      // Line 8a — Use in commercial aviation (other than foreign trade) taxed at $.219: (c) Qualif
      "form-4136.2.line.8a_commercial_aviation_219_col_c": 1200,
      // Line 8a — Use in commercial aviation (other than foreign trade) taxed at $.219: (d) Actual
      "form-4136.2.line.8a_commercial_aviation_219_col_d": 5400,
      // Line 8a — Use in commercial aviation (other than foreign trade) taxed at $.219: (e) Amount
      "form-4136.2.line.8a_commercial_aviation_219_col_e": 210,
      // Line 8b — Use in commercial aviation (other than foreign trade) taxed at $.244: (c) Qualif
      "form-4136.2.line.8b_commercial_aviation_244_col_c": 1000,
      // Line 8b — Use in commercial aviation (other than foreign trade) taxed at $.244: (d) Actual
      "form-4136.2.line.8b_commercial_aviation_244_col_d": 4500,
      // Line 8b — Use in commercial aviation (other than foreign trade) taxed at $.244: (e) Amount
      "form-4136.2.line.8b_commercial_aviation_244_col_e": 200,
      // Line 8c — Nonexempt use in noncommercial aviation: (c) Qualified gallons
      "form-4136.2.line.8c_nonexempt_noncommercial_aviation_col_c": 2000,
      // Line 8c — Nonexempt use in noncommercial aviation: (d) Actual fuel cost from your records
      "form-4136.2.line.8c_nonexempt_noncommercial_aviation_col_d": 9000,
      // Line 8c — Nonexempt use in noncommercial aviation: (e) Amount of credit
      "form-4136.2.line.8c_nonexempt_noncommercial_aviation_col_e": 50,
      // Line 8d — Other nontaxable uses taxed at $.244: (c) Qualified gallons
      "form-4136.2.line.8d_other_nontaxable_244_col_c": 700,
      // Line 8d — Other nontaxable uses taxed at $.244: (d) Actual fuel cost from your records
      "form-4136.2.line.8d_other_nontaxable_244_col_d": 3150,
      // Line 8d — Other nontaxable uses taxed at $.244: (e) Amount of credit
      "form-4136.2.line.8d_other_nontaxable_244_col_e": 170,
      // Line 8e — Other nontaxable uses taxed at $.219: (c) Qualified gallons
      "form-4136.2.line.8e_other_nontaxable_219_col_c": 500,
      // Line 8e — Other nontaxable uses taxed at $.219: (d) Actual fuel cost from your records
      "form-4136.2.line.8e_other_nontaxable_219_col_d": 2250,
      // Line 8e — Other nontaxable uses taxed at $.219: (e) Amount of credit
      "form-4136.2.line.8e_other_nontaxable_219_col_e": 109,
      // Line 8f — LUST tax on aviation fuels used in foreign trade: (c) Qualified gallons
      "form-4136.2.line.8f_lust_tax_foreign_trade_col_c": 300,
      // Line 8f — LUST tax on aviation fuels used in foreign trade: (d) Actual fuel cost from your
      "form-4136.2.line.8f_lust_tax_foreign_trade_col_d": 1350,
      // Line 11a — Liquefied petroleum gas (LPG): (c) Gallons, or gasoline or diesel gallon equiva
      "form-4136.2.line.11a_lpg_col_c": 7391,
      // Line 11a — Liquefied petroleum gas (LPG): (d) Actual fuel cost from your records
      "form-4136.2.line.11a_lpg_col_d": 25000,
      // Line 11a — Liquefied petroleum gas (LPG): (e) Amount of credit
      "form-4136.2.line.11a_lpg_col_e": 805,
      // Line 11b — "P Series" fuels: (c) Gallons, or gasoline or diesel gallon equivalents
      "form-4136.2.line.11b_p_series_fuels_col_c": 500,
      // Line 11b — "P Series" fuels: (d) Actual fuel cost from your records
      "form-4136.2.line.11b_p_series_fuels_col_d": 1500,
      // Line 11b — "P Series" fuels: (e) Amount of credit
      "form-4136.2.line.11b_p_series_fuels_col_e": 91,
      // Line 11c — Compressed natural gas (CNG): (c) Gallons, or gasoline or diesel gallon equival
      "form-4136.2.line.11c_cng_col_c": 1000,
      // Line 11c — Compressed natural gas (CNG): (d) Actual fuel cost from your records
      "form-4136.2.line.11c_cng_col_d": 2500,
      // Line 11c — Compressed natural gas (CNG): (e) Amount of credit
      "form-4136.2.line.11c_cng_col_e": 183,
      // Line 11d — Liquefied hydrogen: (c) Gallons, or gasoline or diesel gallon equivalents
      "form-4136.2.line.11d_liquefied_hydrogen_col_c": 200,
      // Line 11d — Liquefied hydrogen: (d) Actual fuel cost from your records
      "form-4136.2.line.11d_liquefied_hydrogen_col_d": 1000,
      // Line 11d — Liquefied hydrogen: (e) Amount of credit
      "form-4136.2.line.11d_liquefied_hydrogen_col_e": 36,
      // Line 11e — Fischer-Tropsch process liquid fuel from coal (including peat): (c) Gallons, or
      "form-4136.2.line.11e_fischer_tropsch_coal_col_c": 300,
      // Line 11e — Fischer-Tropsch process liquid fuel from coal (including peat): (d) Actual fuel
      "form-4136.2.line.11e_fischer_tropsch_coal_col_d": 1200,
      // Line 11e — Fischer-Tropsch process liquid fuel from coal (including peat): (e) Amount of c
      "form-4136.2.line.11e_fischer_tropsch_coal_col_e": 72,
      // Line 11f — Liquid fuel derived from biomass: (c) Gallons, or gasoline or diesel gallon equ
      "form-4136.2.line.11f_biomass_liquid_fuel_col_c": 400,
      // Line 11f — Liquid fuel derived from biomass: (d) Actual fuel cost from your records
      "form-4136.2.line.11f_biomass_liquid_fuel_col_d": 1600,
      // Line 11f — Liquid fuel derived from biomass: (e) Amount of credit
      "form-4136.2.line.11f_biomass_liquid_fuel_col_e": 97,
      // Line 11g — Liquefied natural gas (LNG): (c) Gallons, or gasoline or diesel gallon equivale
      "form-4136.2.line.11g_lng_col_c": 1000,
      // Line 11g — Liquefied natural gas (LNG): (d) Actual fuel cost from your records
      "form-4136.2.line.11g_lng_col_d": 3000,
      // Line 11g — Liquefied natural gas (LNG): (e) Amount of credit
      "form-4136.2.line.11g_lng_col_e": 243,
      // Line 11h — Liquefied gas derived from biomass: (c) Gallons, or gasoline or diesel gallon e
      "form-4136.2.line.11h_biomass_liquefied_gas_col_c": 250,
      // Line 11h — Liquefied gas derived from biomass: (d) Actual fuel cost from your records
      "form-4136.2.line.11h_biomass_liquefied_gas_col_d": 900,
      // Line 11h — Liquefied gas derived from biomass: (e) Amount of credit
      "form-4136.2.line.11h_biomass_liquefied_gas_col_e": 45,
      // Line 13a — Diesel fuel sold for the exclusive use of a state or local government: (d) Actu
      "form-4136.3.line.13a_diesel_state_local_government_col_d": 3500,
      // Line 13a — Diesel fuel sold for the exclusive use of a state or local government: (e) Amou
      "form-4136.3.line.13a_diesel_state_local_government_col_e": 243,
      // Line 13b — Kerosene sold for the exclusive use of a state or local government: (d) Actual
      "form-4136.3.line.13b_kerosene_state_local_government_col_d": 2800,
      // Line 13b — Kerosene sold for the exclusive use of a state or local government: (e) Amount
      "form-4136.3.line.13b_kerosene_state_local_government_col_e": 194,
      // Line 13c — Kerosene for use in aviation sold for the exclusive use of a state or local gov
      "form-4136.3.line.13c_aviation_kerosene_state_local_government_col_d": 2700,
      // Line 13c — Kerosene for use in aviation sold for the exclusive use of a state or local gov
      "form-4136.3.line.13c_aviation_kerosene_state_local_government_col_e": 145,
      // Line 14a — Nontaxable use of a diesel-water fuel emulsion: (d) Actual fuel cost from your
      "form-4136.3.line.14a_nontaxable_use_col_d": 3400,
      // Line 14a — Nontaxable use of a diesel-water fuel emulsion: (e) Amount of credit (dollars)
      "form-4136.3.line.14a_nontaxable_use_col_e": 124,
      // Line 14b — Exported diesel-water fuel emulsion: (d) Actual fuel cost from your records (do
      "form-4136.3.line.14b_exported_col_d": 1700,
      // Line 14b — Exported diesel-water fuel emulsion: (e) Amount of credit (dollars)
      "form-4136.3.line.14b_exported_col_e": 99,
      // Line 15a — Blender credit: (d) Actual fuel cost from your records (dollars)
      "form-4136.3.line.15a_blender_credit_col_d": 34000,
      // Line 15a — Blender credit: (e) Amount of credit (dollars)
      "form-4136.3.line.15a_blender_credit_col_e": 460,
      // Line 16a — Exported dyed diesel fuel and exported gasoline blendstocks taxed at $.001: (d)
      "form-4136.3.line.16a_exported_dyed_diesel_blendstocks_col_d": 17000,
      // Line 16a — Exported dyed diesel fuel and exported gasoline blendstocks taxed at $.001: (e)
      "form-4136.3.line.16a_exported_dyed_diesel_blendstocks_col_e": 5,
      // Line 16b — Exported dyed kerosene: (d) Actual fuel cost from your records (dollars)
      "form-4136.3.line.16b_exported_dyed_kerosene_col_d": 7000,
      // Line 16b — Exported dyed kerosene: (e) Amount of credit (dollars)
      "form-4136.3.line.16b_exported_dyed_kerosene_col_e": 2,
      // Line 17 — Total income tax credit claimed. Add lines 1 through 16, column (e) (dollars)
      "form-4136.3.line.17_total_income_tax_credit": 8366,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 12 — Credit for federal tax on fuels. Attach Form 4136
      "schedule-3.0.line.12": 8366,
      // Line 15 — Add lines 9 through 12 and 14. Enter here and on Form 1040, line 31
      "schedule-3.0.line.15": 8366,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 93850,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 93850,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 6630,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 87220,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 87220,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 14294,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 30044,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 57176,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 7493,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 7493,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 7493,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 13260,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 20753,
      // Line 26 — 2025 estimated tax payments and amount applied from 2024 return
      "form-1040.line.26": 16000,
      // Line 31 — Amount from Schedule 3, line 15
      "form-1040.line.31": 8366,
      // Line 32 — Add lines 27a, 28, 29, 30, and 31. Total other payments and refundable credits
      "form-1040.line.32": 8366,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 24366,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 3613,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 3613,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 93850,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 93850,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 6630,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 6630,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 13260,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 13260,
    },
  },
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 412000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 412000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 412000,
      // Line 6 — Other income, including federal and state gasoline or fuel tax credit or refund
      "schedule-c.0.line.6": 2150,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 414150,
      // Line 21 — Repairs and maintenance
      "schedule-c.0.line.21": 31800,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 265900,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 22600,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 320300,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 93850,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 93850,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 93850,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 93850,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 86670,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 86670,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 86670,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 10747,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 2513,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 13260,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 6630,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": 87220,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": 87220,
      // Line 4 — Total qualified business income. Combine lines 2 and 3. If zero or less, enter -0
      "form-8995.0.line.4": 87220,
      // Line 5 — Qualified business income component. Multiply line 4 by 20% (0.20)
      "form-8995.0.line.5": 17444,
      // Line 10 — Qualified business income deduction before the income limitation. Add lines 5 an
      "form-8995.0.line.10": 17444,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 71470,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 71470,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 14294,
      // Line 15 — Qualified business income deduction. Enter the smaller of line 10 or line 14
      "form-8995.0.line.15": 14294,
    },
  },
};

export function meilynExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
