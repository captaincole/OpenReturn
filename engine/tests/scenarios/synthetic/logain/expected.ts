/*
 * logain — LOCKED expected values, drafted from the engine's
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
  "form-8801": {
    engineFields: {
      // Line 1 — Combine lines 1 and 2e of your 2024 Form 6251
      "form-8801.0.line.1_prior_year_form_6251_lines_1_2e": 580000,
      // Line 2 — Enter adjustments and preferences treated as exclusion items
      "form-8801.0.line.2_exclusion_item_adjustments_preferences": 120000,
      // Line 3 — Minimum tax credit net operating loss deduction
      "form-8801.0.line.3_minimum_tax_credit_nol_deduction": 15000,
      // Line 4 — Combine lines 1, 2, and 3. If zero or less, enter -0- here and on line 15 and go
      "form-8801.0.line.4_combine_lines_1_2_3": 685000,
      // Line 5 — Enter: $133,300 if married filing jointly or qualifying surviving spouse for 2024
      "form-8801.0.line.5_exemption_amount": 85700,
      // Line 6 — Enter: $1,218,700 if married filing jointly or qualifying surviving spouse for 20
      "form-8801.0.line.6_exemption_phaseout_threshold": 609350,
      // Line 7 — Subtract line 6 from line 4. If zero or less, enter -0- here and on line 8 and go
      "form-8801.0.line.7_amount_over_phaseout_threshold": 75650,
      // Line 8 — Multiply line 7 by 25% (0.25)
      "form-8801.0.line.8_exemption_reduction": 18913,
      // Line 9 — Subtract line 8 from line 5. If zero or less, enter -0-
      "form-8801.0.line.9_reduced_exemption": 66787,
      // Line 10 — Subtract line 9 from line 4. If zero or less, enter -0- here and on line 15 and
      "form-8801.0.line.10_amount_after_exemption": 618213,
      // Line 11 — If for 2024 you filed Form 2555, see instructions for the amount to enter. If fo
      "form-8801.0.line.11_tax_on_line_10": 159303,
      // Line 12 — Minimum tax foreign tax credit on exclusion items
      "form-8801.0.line.12_minimum_tax_foreign_tax_credit": 280,
      // Line 13 — Tentative minimum tax on exclusion items. Subtract line 12 from line 11
      "form-8801.0.line.13_tentative_minimum_tax_exclusion_items": 159023,
      // Line 14 — Enter the amount from your 2024 Form 6251, line 10, or 2024 Schedule I (Form 104
      "form-8801.0.line.14_prior_year_form_6251_line_10": 151350,
      // Line 15 — Net minimum tax on exclusion items. Subtract line 14 from line 13. If zero or le
      "form-8801.0.line.15_net_minimum_tax_exclusion_items": 7673,
      // Line 16 — Enter the amount from your 2024 Form 6251, line 11, or 2024 Schedule I (Form 104
      "form-8801.1.line.16_prior_year_tentative_minimum_tax_base": 160493,
      // Line 17 — Enter the amount from line 15
      "form-8801.1.line.17_amount_from_line_15": 7673,
      // Line 18 — Subtract line 17 from line 16. If less than zero, enter as a negative amount
      "form-8801.1.line.18_line_16_minus_line_17": 152820,
      // Line 19 — 2024 credit carryforward. Enter the amount from your 2024 Form 8801, line 26
      "form-8801.1.line.19_prior_year_credit_carryforward": 12000,
      // Line 21 — Combine lines 18 through 20. If zero or less, stop here and see the instructions
      "form-8801.1.line.21_combine_lines_18_through_20": 164820,
      // Line 22 — Enter your 2025 regular income tax liability minus allowable credits
      "form-8801.1.line.22_regular_tax_minus_credits": 201143,
      // Line 23 — Form 6251 line 7 (165,806) less the $250 credit by the election (rule-decisions.md row 12)
      "form-8801.1.line.23_current_year_tentative_minimum_tax": 165556,
      // Line 24 — Subtract line 23 from line 22. If zero or less, enter -0-
      "form-8801.1.line.24_line_22_minus_line_23": 35587,
      // Line 25 — Minimum tax credit. Enter the smaller of line 21 or line 24
      "form-8801.1.line.25_minimum_tax_credit": 35587,
      // Line 26 — Credit carryforward to 2026. Subtract line 25 from line 21
      "form-8801.1.line.26_credit_carryforward_next_year": 129233,
      // Line 27 — Enter the amount from Form 8801, line 10
      "form-8801.2.line.27_amount_from_line_10": 618213,
      // Line 28 — Enter the amount from line 4 of your 2024 Qualified Dividends and Capital Gain T
      "form-8801.2.line.28_qualified_dividends_worksheet_amount": 82000,
      // Line 29 — Enter the amount from line 19 of your 2024 Schedule D (Form 1040), or line 18b,
      "form-8801.2.line.29_unrecaptured_section_1250_gain": 8000,
      // Line 30 — Add lines 28 and 29, and enter the smaller of that result or the amount from lin
      "form-8801.2.line.30_smaller_of_sum_or_worksheet": 90000,
      // Line 31 — Enter the smaller of line 27 or line 30
      "form-8801.2.line.31_smaller_of_line_27_or_30": 90000,
      // Line 32 — Subtract line 31 from line 27
      "form-8801.2.line.32_subtract_line_31_from_27": 528213,
      // Line 33 — If line 32 is $232,600 or less ($116,300 or less if married filing separately fo
      "form-8801.2.line.33_tax_at_26_or_28_percent": 143248,
      // Line 34 — Enter: $94,050 if married filing jointly or qualifying surviving spouse for 2024
      "form-8801.2.line.34_zero_percent_rate_threshold": 47025,
      // Line 35 — Enter the amount from line 5 of your 2024 Qualified Dividends and Capital Gain T
      "form-8801.2.line.35_ordinary_taxable_income": 480000,
      // Line 36 — Subtract line 35 from line 34. If zero or less, enter -0-
      "form-8801.2.line.36_subtract_line_35_from_34": 0,
      // Line 37 — Enter the smaller of line 27 or line 28
      "form-8801.2.line.37_smaller_of_line_27_or_28": 82000,
      // Line 38 — Enter the smaller of line 36 or line 37
      "form-8801.2.line.38_smaller_of_line_36_or_37": 0,
      // Line 39 — Subtract line 38 from line 37
      "form-8801.2.line.39_subtract_line_38_from_37": 82000,
      // Line 40 — Enter: $518,900 if single for 2024, $291,850 if married filing separately for 20
      "form-8801.2.line.40_fifteen_percent_rate_threshold": 518900,
      // Line 41 — Enter the amount from line 36
      "form-8801.2.line.41_amount_from_line_36": 0,
      // Line 42 — Form 1040, 1040-SR, or 1040-NR filers, enter the amount from line 5 of your 2024
      "form-8801.2.line.42_worksheet_ordinary_income_amount": 472000,
      // Line 43 — Add lines 41 and 42
      "form-8801.3.line.43_add_lines_41_42": 472000,
      // Line 44 — Subtract line 43 from line 40. If zero or less, enter -0-
      "form-8801.3.line.44_line_40_minus_43": 46900,
      // Line 45 — Enter the smaller of line 39 or line 44
      "form-8801.3.line.45_smaller_of_39_or_44": 46900,
      // Line 46 — Multiply line 45 by 15% (0.15)
      "form-8801.3.line.46_tax_at_15_percent": 7035,
      // Line 47 — Add lines 38 and 45
      "form-8801.3.line.47_add_lines_38_45": 46900,
      // Line 48 — Subtract line 47 from line 37
      "form-8801.3.line.48_line_37_minus_47": 35100,
      // Line 49 — Multiply line 48 by 20% (0.20)
      "form-8801.3.line.49_tax_at_20_percent": 7020,
      // Line 50 — Add lines 32, 47, and 48
      "form-8801.3.line.50_add_lines_32_47_48": 610213,
      // Line 51 — Subtract line 50 from line 27
      "form-8801.3.line.51_line_27_minus_50": 8000,
      // Line 52 — Multiply line 51 by 25% (0.25)
      "form-8801.3.line.52_tax_at_25_percent": 2000,
      // Line 53 — Add lines 33, 46, 49, and 52
      "form-8801.3.line.53_add_lines_33_46_49_52": 159303,
      // Line 54 — If line 27 is $232,600 or less ($116,300 or less if married filing separately fo
      "form-8801.3.line.54_tax_at_amt_rates": 168448,
      // Line 55 — Enter the smaller of line 53 or line 54 here and on line 11
      "form-8801.3.line.55_smaller_of_53_or_54": 159303,
    },
    renderedText: {
      "form-8801.0.header.taxpayer_name": "Logain Vedrecht",
      "form-8801.0.header.identifying_number": "400-00-8801",
    },
    // No 2024 unallowed qualified electric vehicle credit.
    renderedBlank: ["form-8801.1.line.20_unallowed_electric_vehicle_credit"],
  },
  "form-6251": {
    engineFields: {
      // Line 1a — Subtract Schedule 1-A (Form 1040), line 37, from Form 1040, 1040-SR, or 1040-NR,
      "form-6251.0.line.1a_deductions_less_schedule_1a": 15750,
      // Line 1b — Subtract line 1a from Form 1040, 1040-SR, or 1040-NR, line 11b (if less than zer
      "form-6251.0.line.1b_taxable_income_start": 674250,
      // Line 2a — If filing Schedule A (Form 1040), enter the taxes from Schedule A, line 7; other
      "form-6251.0.line.2a_taxes_or_standard_deduction": 15750,
      // Line 4 — Alternative minimum taxable income. Combine lines 1b through 3
      "form-6251.0.line.4_alternative_minimum_taxable_income": 690000,
      // Line 5 — Exemption
      "form-6251.0.line.5_exemption": 72187,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-6251.0.line.6_amti_less_exemption": 617813,
      // Line 7 — Tax on line 6: complete Part III and enter line 40 if you have capital gain distr
      "form-6251.0.line.7_tax_on_line_6": 165806,
      // Line 9 — Tentative minimum tax. Subtract line 8 from line 7
      "form-6251.0.line.9_tentative_minimum_tax": 165806,
      // Line 10 — Add Form 1040 or 1040-SR, line 16 (minus any tax from Form 4972), and Schedule 2
      "form-6251.0.line.10_regular_tax_less_credits": 201143,
      // Line 12 — Enter the amount from Form 6251, line 6
      "form-6251.1.line.12_amount_from_line_6": 617813,
      // Line 13 — Enter the amount from line 4 of the Qualified Dividends and Capital Gain Tax Wor
      "form-6251.1.line.13_qualified_dividends_gain_amount": 30000,
      // Line 15 — If you did not complete a Schedule D Tax Worksheet for the regular tax or the AM
      "form-6251.1.line.15_adjusted_net_capital_gain": 30000,
      // Line 16 — Enter the smaller of line 12 or line 15
      "form-6251.1.line.16_smaller_line_12_or_15": 30000,
      // Line 17 — Subtract line 16 from line 12
      "form-6251.1.line.17_line_12_minus_16": 587813,
      // Line 18 — If line 17 is $239,100 or less ($119,550 or less if married filing separately),
      "form-6251.1.line.18_tax_on_line_17": 159806,
      // Line 19 — Enter: $96,700 if married filing jointly or qualifying surviving spouse; $48,350
      "form-6251.1.line.19_zero_rate_threshold": 48350,
      // Line 20 — Enter the amount from line 5 of the Qualified Dividends and Capital Gain Tax Wor
      "form-6251.1.line.20_regular_tax_taxable_income": 644250,
      // Line 22 — Enter the smaller of line 12 or line 13
      "form-6251.1.line.22_smaller_line_12_or_13": 30000,
      // Line 24 — Subtract line 23 from line 22
      "form-6251.1.line.24_line_22_minus_23": 30000,
      // Line 25 — Enter: $533,400 if single; $300,000 if married filing separately; $600,050 if ma
      "form-6251.1.line.25_fifteen_rate_threshold": 533400,
      // Line 27 — Enter the amount from line 5 of the Qualified Dividends and Capital Gain Tax Wor
      "form-6251.1.line.27_regular_tax_taxable_income": 644250,
      // Line 28 — Add line 26 and line 27
      "form-6251.1.line.28_add_lines_26_27": 644250,
      // Line 33 — Subtract line 32 from line 22
      "form-6251.1.line.33_line_22_minus_32": 30000,
      // Line 34 — Multiply line 33 by 20% (0.20)
      "form-6251.1.line.34_tax_at_twenty_percent": 6000,
      // Line 38 — Add lines 18, 31, 34, and 37
      "form-6251.1.line.38_add_lines_18_31_34_37": 165806,
      // Line 39 — If line 12 is $239,100 or less ($119,550 or less if married filing separately),
      "form-6251.1.line.39_tax_on_line_12": 168206,
      // Line 40 — Enter the smaller of line 38 or line 39 here and on line 7
      "form-6251.1.line.40_smaller_line_38_or_39": 165806,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 1 — Foreign tax credit. Attach Form 1116 if required
      "schedule-3.0.line.1": 250,
      // Line 6b — Credit for prior year minimum tax. Attach Form 8801
      "schedule-3.0.line.6b": 35587,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 35587,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 35837,
    },
  },
  // Interest $6,000 and ordinary dividends $34,000, each over $1,500: Schedule B files.
  "schedule-b": {
    engineFields: {
      // Line 1 — Amount (row 1): Lugard Savings Bank, 1099-INT box 1
      "schedule-b.0.line.1_amount_1": 6000,
      // Line 2 — Add the amounts on line 1
      "schedule-b.0.line.2_total_interest": 6000,
      // Line 4 — Subtract line 3 from line 2 (no Form 8815, line 3 blank)
      "schedule-b.0.line.4_taxable_interest": 6000,
      // Line 5 — Amount (row 1): Tanchico World Index Fund, 1099-DIV box 1a
      "schedule-b.0.line.5_amount_1": 34000,
      // Line 6 — Add the amounts on line 5
      "schedule-b.0.line.6_total_ordinary_dividends": 34000,
    },
    renderedText: {
      "schedule-b.0.line.1_payer_name_1": "Lugard Savings Bank",
      "schedule-b.0.line.5_payer_name_1": "Tanchico World Index Fund",
    },
    // No foreign account (decisions.scope.has_foreign_financial_account) and no foreign trust.
    renderedChecked: [
      "schedule-b.0.line.7a_foreign_account_no",
      "schedule-b.0.line.8_foreign_trust_no",
    ],
  },
  "form-8959": {
    engineFields: {
      // Line 1 — Medicare wages and tips from Form W-2, box 5
      "form-8959.0.line.1_medicare_wages_tips": 650000,
      // Line 4 — Add lines 1 through 3
      "form-8959.0.line.4_total_medicare_wages": 650000,
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 200000,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-8959.0.line.6_excess_medicare_wages": 450000,
      // Line 7 — Additional Medicare Tax on Medicare wages. Multiply line 6 by 0.9% (0.009)
      "form-8959.0.line.7_additional_medicare_tax_wages": 4050,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 4050,
      // Line 19 — Medicare tax withheld from Form W-2, box 6
      "form-8959.0.line.19_medicare_tax_withheld": 13475,
      // Line 20 — Enter the amount from line 1
      "form-8959.0.line.20_medicare_wages_from_line1": 650000,
      // Line 21 — Multiply line 20 by 1.45% (0.0145). Regular Medicare tax withholding on Medicare
      "form-8959.0.line.21_regular_medicare_tax_on_wages": 9425,
      // Line 22 — Subtract line 21 from line 19. If zero or less, enter -0-. Additional Medicare T
      "form-8959.0.line.22_additional_medicare_tax_withholding_wages": 4050,
      // Line 24 — Total Additional Medicare Tax withholding. Add lines 22 and 23
      "form-8959.0.line.24_total_additional_medicare_tax_withholding": 4050,
    },
  },
  "form-8960": {
    engineFields: {
      // Line 1 — Taxable interest (see instructions)
      "form-8960.0.line.1": 6000,
      // Line 2 — Ordinary dividends (see instructions)
      "form-8960.0.line.2": 34000,
      // Line 8 — Total investment income. Combine lines 1, 2, 3, 4c, 5d, 6, and 7
      "form-8960.0.line.8": 40000,
      // Line 12 — Net investment income. Subtract Part II, line 11, from Part I, line 8. If zero o
      "form-8960.0.line.12": 40000,
      // Line 13 — Modified adjusted gross income (see instructions)
      "form-8960.0.line.13": 690000,
      // Line 14 — Threshold based on filing status (see instructions)
      "form-8960.0.line.14": 200000,
      // Line 15 — Subtract line 14 from line 13. If zero or less, enter -0-
      "form-8960.0.line.15": 490000,
      // Line 16 — Enter the smaller of line 12 or line 15
      "form-8960.0.line.16": 40000,
      // Line 17 — Net investment income tax for individuals. Multiply line 16 by 3.8% (0.038)
      "form-8960.0.line.17": 1520,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 4050,
      // Line 12 — Net investment income tax. Attach Form 8960
      "schedule-2.0.line.12_net_investment_income_tax": 1520,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 5570,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 650000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 650000,
      // Line 2b — Taxable interest
      "form-1040.line.2b": 6000,
      // Line 3a — Qualified dividends
      "form-1040.line.3a": 30000,
      // Line 3b — Ordinary dividends
      "form-1040.line.3b": 34000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 690000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 690000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 690000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 674250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 201393,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 201393,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 35837,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 35837,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 165556,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 5570,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 171126,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 175000,
      // Line 25c — Federal income tax withheld from other forms (see instructions)
      "form-1040.line.25c": 4050,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 179050,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 179050,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 7924,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 7924,
    },
  },
};

export function logainExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
