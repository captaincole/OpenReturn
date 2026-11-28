/*
 * wit — LOCKED expected values, drafted from the engine's
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
  "form-8835": {
    engineFields: {
      // Line 1a — Wind: (a) Kilowatt-hours produced and sold
      "form-8835.1.part2.1a_wind_kwh_col_a": 500000,
      // Line 1a — Wind: (c) Column (a) × Column (b) (rate $0.006)
      "form-8835.1.part2.1a_wind_credit_col_c": 3000,
      // Line 2 — Add column (c) of lines 1a through 1j
      "form-8835.1.part2.2_total_column_c": 3000,
      // Line 4 — Credit before reduction. Subtract line 3 from line 2
      "form-8835.1.part2.4_credit_before_reduction": 3000,
      // Line 5b — Multiply line 4 by line 5a
      "form-8835.1.part2.5b_line4_times_line5a": 240,
      // Line 5c — Multiply line 4 by 15% (0.15)
      "form-8835.1.part2.5c_line4_times_15_percent": 450,
      // Line 5d — Enter the smaller of line 5b or line 5c
      "form-8835.1.part2.5d_smaller_of_5b_5c": 240,
      // Line 6 — Subtract line 5d from line 4
      "form-8835.1.part2.6_line4_less_line5d": 2760,
      // Line 8 — Subtract line 7g from line 6
      "form-8835.1.part2.8_line6_less_line7g": 2760,
      // Line 9 — Increased credit amount for qualified facilities. Did you check a "Yes" box in Pa
      "form-8835.1.part2.9_increased_credit_amount": 13800,
      // Line 10 — Domestic content bonus credit. If you qualify, multiply the amount on line 9 by
      "form-8835.1.part2.10_domestic_content_bonus": 1380,
      // Line 11 — Energy community bonus credit. If you qualify, multiply the amount on line 9 by
      "form-8835.1.part2.11_energy_community_bonus": 1380,
      // Line 12 — Add lines 9, 10, and 11
      "form-8835.1.part2.12_add_lines_9_10_11": 16560,
      // Line 13 — If you are making an elective payment election under section 6417 for a facility
      "form-8835.1.part2.13_elective_payment_adjusted_credit": 16560,
      // Line 15 — Add lines 13 and 14
      "form-8835.2.part2.15_add_lines_13_14": 16560,
      // Line 3 — Phaseout adjustment: calendar year filers enter -0- (verified zero, added by hand)
      "form-8835.1.part2.3_phaseout_adjustment": 0,
    },
    renderedText: {
      // Part I lines 2a, 4, 5 and 12b; Part II line 5a, 40,000 ÷ 500,000 (added by hand)
      "form-8835.0.part1.2a_facility_type": "Wind, two 450 kW turbines",
      "form-8835.0.part1.4_date_construction_began": "09/12/2022",
      "form-8835.0.part1.5_date_placed_in_service": "05/01/2023",
      "form-8835.0.part1.12b_wind_ac_capacity_kw": "900",
      "form-8835.1.part2.5a_tax_exempt_bond_ratio": "0.08",
    },
    renderedChecked: [
      // Lines 6 No, 8b, 9a, 10a, 11b and 12b (added by hand)
      "form-8835.0.part1.6_biomass_expansion_no",
      "form-8835.0.part1.8b_construction_before_2023_01_29",
      "form-8835.0.part1.9a_domestic_content_bonus_yes",
      "form-8835.0.part1.10a_energy_community_bonus_yes",
      "form-8835.0.part1.11b_dc_capacity_not_applicable",
      "form-8835.0.part1.12b_wind_ac_capacity_checkbox",
    ],
    renderedBlank: [
      // Line 7 (a wind facility begun in 2022), lines 14, 16 and 17 (no K-1; an individual) (added by hand)
      "form-8835.1.part2.7g_add_7b_7d_7f",
      "form-8835.2.part2.14_credit_from_pass_through_entities",
      "form-8835.2.part2.16_allocated_to_patrons_beneficiaries",
      "form-8835.2.part2.17_cooperative_estate_trust_credit",
    ],
  },
  "form-3800": {
    engineFields: {
      // Line 1 — Credits not subject to the passive activity limit from Part III, line 2: combine
      "form-3800.0.line.1_credits_not_passive_limited": 3600,
      // Line 6 — Add lines 1, 3, 4, and 5
      "form-3800.0.line.6_total_credits_not_allowed_tmt": 3600,
      // Line 7 — Regular tax before credits
      "form-3800.0.line.7_regular_tax_before_credits": 40451,
      // Line 9 — Add lines 7 and 8
      "form-3800.0.line.9_regular_tax_plus_amt": 40451,
      // Line 11 — Net income tax. Subtract line 10c from line 9
      "form-3800.0.line.11_net_income_tax": 40451,
      // Line 12 — Net regular tax. Subtract line 10c from line 7. If zero or less, enter -0-
      "form-3800.0.line.12_net_regular_tax": 40451,
      // Line 13 — Enter 25% (0.25) of the excess, if any, of line 12 (line 11 for corporations) ov
      "form-3800.0.line.13_25_percent_of_excess": 3863,
      // Line 14 — Tentative minimum tax
      "form-3800.0.line.14_tentative_minimum_tax": 32692,
      // Line 15 — Enter the greater of line 13 or line 14
      "form-3800.0.line.15_greater_of_line_13_or_14": 32692,
      // Line 16 — Subtract line 15 from line 11. If zero or less, enter -0-
      "form-3800.0.line.16_net_income_tax_less_line_15": 7759,
      // Line 17 — Enter the smaller of line 6 or line 16. This is the amount of your credit allowe
      "form-3800.0.line.17_credit_allowed_after_38c1_limit": 3600,
      // Line 27 — Subtract line 13 from line 11. If zero or less, enter -0-
      "form-3800.1.line.27_subtract_line_13_from_11": 36588,
      // Line 28 — Add lines 17 and 26
      "form-3800.1.line.28_add_lines_17_and_26": 3600,
      // Line 29 — Subtract line 28 from line 27. If zero or less, enter -0-
      "form-3800.1.line.29_subtract_line_28_from_27": 32988,
      // Line 30 — Enter the general business credit from line 5 of Part III: combine column (e) wi
      "form-3800.1.line.30_specified_general_business_credit": 16560,
      // Line 36 — Add lines 30, 33, 34, and 35
      "form-3800.1.line.36_add_lines_30_33_34_35": 16560,
      // Line 37 — Enter the smaller of line 29 or line 36. This is the amount allowed for specifie
      "form-3800.1.line.37_specified_credits_allowed": 16560,
      // Line 38 — Credit allowed for the current year. Add lines 28 and 37
      "form-3800.1.line.38_credit_allowed_current_year": 20160,
      // Line 1f — Form 8835, Part II — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.1f_form_8835_part_ii_col_e": 3600,
      // Line 1f — Form 8835, Part II — (g) Combine columns (e) and (f) with the credit from column
      "form-3800.2.part3.1f_form_8835_part_ii_col_g": 3600,
      // Line 2 — Add lines 1a–1zz — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.2_add_lines_1a_1zz_col_e": 3600,
      // Line 2 — Add lines 1a–1zz — (g) Combine columns (e) and (f) with the credit from column (d
      "form-3800.2.part3.2_add_lines_1a_1zz_col_g": 3600,
      // Line 4e — Form 8835, Part II: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.4e_form_8835_part_ii_col_e": 16560,
      // Line 4e — Form 8835, Part II: (g) Combine columns (e) and (f) with the credit from column
      "form-3800.3.part3.4e_form_8835_part_ii_col_g": 16560,
      // Line 5 — Add lines 4a–4z: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.5_add_lines_4a_4z_col_e": 16560,
      // Line 5 — Add lines 4a–4z: (g) Combine columns (e) and (f) with the credit from column (d)
      "form-3800.3.part3.5_add_lines_4a_4z_col_g": 16560,
      // Line 6 — Add lines 2, 3, and 5: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.6_add_lines_2_3_5_col_e": 20160,
      // Line 6 — Add lines 2, 3, and 5: (g) Combine columns (e) and (f) with the credit from colum
      "form-3800.3.part3.6_add_lines_2_3_5_col_g": 20160,
    },
  },
  "form-6251": {
    engineFields: {
      // Line 1a — Subtract Schedule 1-A (Form 1040), line 37, from Form 1040, 1040-SR, or 1040-NR,
      "form-6251.0.line.1a_deductions_less_schedule_1a": 65272,
      // Line 1b — Subtract line 1a from Form 1040, 1040-SR, or 1040-NR, line 11b (if less than zer
      "form-6251.0.line.1b_taxable_income_start": 198087,
      // Line 2a — If filing Schedule A (Form 1040), enter the taxes from Schedule A, line 7; other
      "form-6251.0.line.2a_taxes_or_standard_deduction": 15750,
      // Line 4 — Alternative minimum taxable income. Combine lines 1b through 3
      "form-6251.0.line.4_alternative_minimum_taxable_income": 213837,
      // Line 5 — Exemption
      "form-6251.0.line.5_exemption": 88100,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-6251.0.line.6_amti_less_exemption": 125737,
      // Line 7 — Tax on line 6: complete Part III and enter line 40 if you have capital gain distr
      "form-6251.0.line.7_tax_on_line_6": 32692,
      // Line 9 — Tentative minimum tax. Subtract line 8 from line 7
      "form-6251.0.line.9_tentative_minimum_tax": 32692,
      // Line 10 — Add Form 1040 or 1040-SR, line 16 (minus any tax from Form 4972), and Schedule 2
      "form-6251.0.line.10_regular_tax_less_credits": 40451,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 6a — General business credit. Attach Form 3800
      "schedule-3.0.line.6a": 20160,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 20160,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 20160,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 278000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 278000,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 14641,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 263359,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 263359,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 49522,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 65272,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 198087,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 40451,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 40451,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 20160,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 20160,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 20291,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 29792,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 50083,
      // Line 37 — Amount you owe
      "form-1040.line.37": 50083,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 278000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 278000,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 14641,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 14641,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 29281,
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 511,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 29792,
    },
  },
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 468000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 468000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 468000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 468000,
      // Line 21 — Repairs and maintenance
      "schedule-c.0.line.21": 18400,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 22000,
      // Line 23 — Taxes and licenses
      "schedule-c.0.line.23": 9800,
      // Line 13 — Depreciation and section 179 expense deduction (not included in Part III)
      "schedule-c.0.line.13": 58000,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 14200,
      // Line 25 — Utilities
      "schedule-c.0.line.25": 3600,
      // Line 26 — Wages (less employment credits)
      "schedule-c.0.line.26": 64000,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 190000,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 278000,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 278000,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 278000,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 278000,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 256733,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 256733,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 256733,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 21836,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 7445,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 29281,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 14641,
    },
  },
  "form-8959": {
    engineFields: {
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 200000,
      // Line 8 — Self-employment income from Schedule SE (Form 1040), Part I, line 6
      "form-8959.0.line.8_self_employment_income": 256733,
      // Line 9 — Enter the following amount for your filing status
      "form-8959.0.line.9_filing_status_threshold_se": 200000,
      // Line 11 — Subtract line 10 from line 9. If zero or less, enter -0-
      "form-8959.0.line.11_threshold_reduced_by_wages": 200000,
      // Line 12 — Subtract line 11 from line 8. If zero or less, enter -0-
      "form-8959.0.line.12_excess_se_income": 56733,
      // Line 13 — Additional Medicare Tax on self-employment income. Multiply line 12 by 0.9% (0.0
      "form-8959.0.line.13_additional_medicare_tax_se": 511,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 511,
    },
  },
  "form-8995-a": {
    engineFields: {
      // Line 2 — Qualified business income from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.2_a": 263359,
      // Line 3 — Multiply line 2 by 20% (0.20) (Column A)
      "form-8995-a.0.line.3_a": 52672,
      // Line 4 — Allocable share of W-2 wages from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.4_a": 64000,
      // Line 5 — Multiply line 4 by 50% (0.50) (Column A)
      "form-8995-a.0.line.5_a": 32000,
      // Line 6 — Multiply line 4 by 25% (0.25) (Column A)
      "form-8995-a.0.line.6_a": 16000,
      // Line 7 — Allocable share of the unadjusted basis immediately after acquisition (UBIA) of a
      "form-8995-a.0.line.7_a": 1450000,
      // Line 8 — Multiply line 7 by 2.5% (0.025) (Column A)
      "form-8995-a.0.line.8_a": 36250,
      // Line 9 — Add lines 6 and 8 (Column A)
      "form-8995-a.0.line.9_a": 52250,
      // Line 10 — Enter the greater of line 5 or line 9 (Column A)
      "form-8995-a.0.line.10_a": 52250,
      // Line 11 — W-2 wage and UBIA of qualified property limitation. Enter the smaller of line 3
      "form-8995-a.0.line.11_a": 52250,
      // Line 13 — Qualified business income deduction before patron reduction. Enter the greater o
      "form-8995-a.0.line.13_a": 52250,
      // Line 15 — Qualified business income component. Subtract line 14 from line 13 (Column A)
      "form-8995-a.0.line.15_a": 52250,
      // Line 16 — Total qualified business income component. Add all amounts reported on line 15
      "form-8995-a.0.line.16": 52250,
      // Line 27 — Total qualified business income component from all qualified trades, businesses,
      "form-8995-a.1.line.27": 52250,
      // Line 32 — Qualified business income deduction before the income limitation. Add lines 27 a
      "form-8995-a.1.line.32": 52250,
      // Line 33 — Taxable income before qualified business income deduction
      "form-8995-a.1.line.33": 247609,
      // Line 35 — Subtract line 34 from line 33. If zero or less, enter -0-
      "form-8995-a.1.line.35": 247609,
      // Line 36 — Income limitation. Multiply line 35 by 20% (0.20)
      "form-8995-a.1.line.36": 49522,
      // Line 37 — Qualified business income deduction before the domestic production activities de
      "form-8995-a.1.line.37": 49522,
      // Line 39 — Total qualified business income deduction. Add lines 37 and 38
      "form-8995-a.1.line.39": 49522,
    },
  },
};

export function witExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
