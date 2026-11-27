/*
 * dain — LOCKED expected values, drafted from the engine's
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
  "form-7213": {
    engineFields: {
      // Section 2, line 1 — Portion of the National Megawatt Capacity Limitation (NMCL) allocated
      "form-7213.0.part1_sec2.1_nmcl_allocated_mw": 0.4,
      // Section 2, line 2 — Facility nameplate capacity (MW)
      "form-7213.0.part1_sec2.2_facility_nameplate_capacity_mw": 0.5,
      // Section 2, line 4 — Kilowatt hours of electricity produced and sold to unrelated persons d
      "form-7213.0.part1_sec2.4_kwh_produced_and_sold": 4000000,
      // Section 2, line 5a — Tentative credit: Qualifying electricity production. Multiply line 3
      "form-7213.0.part1_sec2.5a_qualifying_electricity_production_kwh": 3200000,
      // Section 2, line 5b — Tentative credit: Multiply kWh on line 5a by $0.018
      "form-7213.0.part1_sec2.5b_tentative_credit": 57600,
      // Section 2, line 6a — Annual limitation for credit: Divide line 1 by 1,000 (MW)
      "form-7213.0.part1_sec2.6a_annual_limitation_mw": 0.0004,
      // Section 2, line 6b — Annual limitation for credit: Multiply line 6a by $125,000,000
      "form-7213.0.part1_sec2.6b_annual_limitation_amount": 50000,
      // Section 2, line 7 — Smaller of line 5b or 6b
      "form-7213.0.part1_sec2.7_smaller_of_5b_or_6b": 50000,
      // Section 2, line 9 — Total of lines 7 and 8
      "form-7213.0.part1_sec2.9_total_lines_7_and_8": 50000,
    },
  },
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 390000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 390000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 390000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 390000,
      // Line 21 — Repairs and maintenance
      "schedule-c.0.line.21": 150000,
      // Line 23 — Taxes and licenses
      "schedule-c.0.line.23": 25000,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 45000,
      // Line 25 — Utilities
      "schedule-c.0.line.25": 12000,
      // Line 17 — Legal and professional services
      "schedule-c.0.line.17": 8000,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 240000,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 150000,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 150000,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 150000,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 150000,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 138525,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 138525,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 138525,
      // Line 8a — Total social security wages and tips (total of boxes 3 and 7 on Form(s) W-2) and
      "schedule-se.0.line.8a": 176100,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 4017,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 4017,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 2009,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 150000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 150000,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 2009,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 2009,
    },
  },
  "form-8995-a": {
    engineFields: {
      // Line 2 — Qualified business income from the trade, business, or aggregation (Column A)
      "form-8995-a.0.line.2_a": 147991,
      // Line 3 — Multiply line 2 by 20% (0.20) (Column A)
      "form-8995-a.0.line.3_a": 29598,
      // Line 33 — Taxable income before qualified business income deduction
      "form-8995-a.1.line.33": 532241,
      // Line 35 — Subtract line 34 from line 33. If zero or less, enter -0-
      "form-8995-a.1.line.35": 532241,
      // Line 36 — Income limitation. Multiply line 35 by 20% (0.20)
      "form-8995-a.1.line.36": 106448,
    },
  },
  "form-8959": {
    engineFields: {
      // Line 1 — Medicare wages and tips from Form W-2, box 5
      "form-8959.0.line.1_medicare_wages_tips": 400000,
      // Line 4 — Add lines 1 through 3
      "form-8959.0.line.4_total_medicare_wages": 400000,
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 200000,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-8959.0.line.6_excess_medicare_wages": 200000,
      // Line 7 — Additional Medicare Tax on Medicare wages. Multiply line 6 by 0.9% (0.009)
      "form-8959.0.line.7_additional_medicare_tax_wages": 1800,
      // Line 8 — Self-employment income from Schedule SE (Form 1040), Part I, line 6
      "form-8959.0.line.8_self_employment_income": 138525,
      // Line 9 — Enter the following amount for your filing status
      "form-8959.0.line.9_filing_status_threshold_se": 200000,
      // Line 10 — Enter the amount from line 4
      "form-8959.0.line.10_medicare_wages_from_line4": 400000,
      // Line 12 — Subtract line 11 from line 8. If zero or less, enter -0-
      "form-8959.0.line.12_excess_se_income": 138525,
      // Line 13 — Additional Medicare Tax on self-employment income. Multiply line 12 by 0.9% (0.0
      "form-8959.0.line.13_additional_medicare_tax_se": 1247,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 3047,
      // Line 19 — Medicare tax withheld from Form W-2, box 6
      "form-8959.0.line.19_medicare_tax_withheld": 7550,
      // Line 20 — Enter the amount from line 1
      "form-8959.0.line.20_medicare_wages_from_line1": 400000,
      // Line 21 — Multiply line 20 by 1.45% (0.0145). Regular Medicare tax withholding on Medicare
      "form-8959.0.line.21_regular_medicare_tax_on_wages": 5800,
      // Line 22 — Subtract line 21 from line 19. If zero or less, enter -0-. Additional Medicare T
      "form-8959.0.line.22_additional_medicare_tax_withholding_wages": 1750,
      // Line 24 — Total Additional Medicare Tax withholding. Add lines 22 and 23
      "form-8959.0.line.24_total_additional_medicare_tax_withholding": 1750,
    },
  },
  "form-6251": {
    engineFields: {
      // Line 1a — Subtract Schedule 1-A (Form 1040), line 37, from Form 1040, 1040-SR, or 1040-NR,
      "form-6251.0.line.1a_deductions_less_schedule_1a": 15750,
      // Line 1b — Subtract line 1a from Form 1040, 1040-SR, or 1040-NR, line 11b (if less than zer
      "form-6251.0.line.1b_taxable_income_start": 532241,
      // Line 2a — If filing Schedule A (Form 1040), enter the taxes from Schedule A, line 7; other
      "form-6251.0.line.2a_taxes_or_standard_deduction": 15750,
      // Line 4 — Alternative minimum taxable income. Combine lines 1b through 3
      "form-6251.0.line.4_alternative_minimum_taxable_income": 547991,
      // Line 5 — Exemption
      "form-6251.0.line.5_exemption": 88100,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-6251.0.line.6_amti_less_exemption": 459891,
      // Line 7 — Tax on line 6: complete Part III and enter line 40 if you have capital gain distr
      "form-6251.0.line.7_tax_on_line_6": 123987,
      // Line 9 — Tentative minimum tax. Subtract line 8 from line 7
      "form-6251.0.line.9_tentative_minimum_tax": 123987,
      // Line 10 — Add Form 1040 or 1040-SR, line 16 (minus any tax from Form 4972), and Schedule 2
      "form-6251.0.line.10_regular_tax_less_credits": 155832,
    },
  },
  "form-3800": {
    engineFields: {
      // B(ii) — If "Yes," enter the number of transfer election statements attached to your return
      "form-3800.0.header.b_ii_transfer_election_statements_count": 1,
      // Line 1 — Credits not subject to the passive activity limit from Part III, line 2: combine
      "form-3800.0.line.1_credits_not_passive_limited": 91800,
      // Line 6 — Add lines 1, 3, 4, and 5
      "form-3800.0.line.6_total_credits_not_allowed_tmt": 91800,
      // Line 7 — Regular tax before credits
      "form-3800.0.line.7_regular_tax_before_credits": 155832,
      // Line 9 — Add lines 7 and 8
      "form-3800.0.line.9_regular_tax_plus_amt": 155832,
      // Line 11 — Net income tax. Subtract line 10c from line 9
      "form-3800.0.line.11_net_income_tax": 155832,
      // Line 12 — Net regular tax. Subtract line 10c from line 7. If zero or less, enter -0-
      "form-3800.0.line.12_net_regular_tax": 155832,
      // Line 13 — Enter 25% (0.25) of the excess, if any, of line 12 (line 11 for corporations) ov
      "form-3800.0.line.13_25_percent_of_excess": 32708,
      // Line 14 — Tentative minimum tax
      "form-3800.0.line.14_tentative_minimum_tax": 123987,
      // Line 15 — Enter the greater of line 13 or line 14
      "form-3800.0.line.15_greater_of_line_13_or_14": 123987,
      // Line 16 — Subtract line 15 from line 11. If zero or less, enter -0-
      "form-3800.0.line.16_net_income_tax_less_line_15": 31845,
      // Line 17 — Enter the smaller of line 6 or line 16. This is the amount of your credit allowe
      "form-3800.0.line.17_credit_allowed_after_38c1_limit": 31845,
      // Line 27 — Subtract line 13 from line 11. If zero or less, enter -0-
      "form-3800.1.line.27_subtract_line_13_from_11": 123124,
      // Line 28 — Add lines 17 and 26
      "form-3800.1.line.28_add_lines_17_and_26": 31845,
      // Line 29 — Subtract line 28 from line 27. If zero or less, enter -0-
      "form-3800.1.line.29_subtract_line_28_from_27": 91279,
      // Line 38 — Credit allowed for the current year. Add lines 28 and 37
      "form-3800.1.line.38_credit_allowed_current_year": 31845,
      // Line 1u — Form 7213, Part II — (a) No. of items
      "form-3800.2.part3.1u_form_7213_part_ii_col_a": 2,
      // Line 1u — Form 7213, Part II — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.1u_form_7213_part_ii_col_e": 48800,
      // Line 1u — Form 7213, Part II — (f) Credit transfer election amount (enter amounts transfer
      "form-3800.2.part3.1u_form_7213_part_ii_col_f": -10000,
      // Line 1u — Form 7213, Part II — (g) Combine columns (e) and (f) with the credit from column
      "form-3800.2.part3.1u_form_7213_part_ii_col_g": 38800,
      // Line 1cc — Form 7213, Part I — (a) No. of items
      "form-3800.2.part3.1cc_form_7213_part_i_col_a": 2,
      // Line 1cc — Form 7213, Part I — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.1cc_form_7213_part_i_col_e": 53000,
      // Line 1cc — Form 7213, Part I — (g) Combine columns (e) and (f) with the credit from column
      "form-3800.2.part3.1cc_form_7213_part_i_col_g": 53000,
      // Line 1cc — Form 7213, Part I — (i) Amount of column (g) applied against tax in Part II
      "form-3800.2.part3.1cc_form_7213_part_i_col_i": 31845,
      // Line 2 — Add lines 1a–1zz — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.2_add_lines_1a_1zz_col_e": 101800,
      // Line 2 — Add lines 1a–1zz — (f) Credit transfer election amount (enter amounts transferred
      "form-3800.2.part3.2_add_lines_1a_1zz_col_f": -10000,
      // Line 2 — Add lines 1a–1zz — (g) Combine columns (e) and (f) with the credit from column (d
      "form-3800.2.part3.2_add_lines_1a_1zz_col_g": 91800,
      // Line 2 — Add lines 1a–1zz — (i) Amount of column (g) applied against tax in Part II
      "form-3800.2.part3.2_add_lines_1a_1zz_col_i": 31845,
      // Line 6 — Add lines 2, 3, and 5: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.6_add_lines_2_3_5_col_e": 101800,
      // Line 6 — Add lines 2, 3, and 5: (f) Credit transfer election amount (enter amounts transfe
      "form-3800.3.part3.6_add_lines_2_3_5_col_f": -10000,
      // Line 6 — Add lines 2, 3, and 5: (g) Combine columns (e) and (f) with the credit from colum
      "form-3800.3.part3.6_add_lines_2_3_5_col_g": 91800,
      // Line 6 — Add lines 2, 3, and 5: (i) Amount of column (g) applied against tax in Part II
      "form-3800.3.part3.6_add_lines_2_3_5_col_i": 31845,
      // Part V, line 1, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.1_breakdown_col_e": 46800,
      // Part V, line 1, column (f)(1) — Not subject to the limit: transfer election credits sold
      "form-3800.7.part5.1_breakdown_col_f1": 10000,
      // Part V, line 2, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.2_breakdown_col_e": 2000,
      // Part V, line 3, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.3_breakdown_col_e": 50000,
      // Part V, line 4, column (e) — Not subject to the limit: credits other than transfer electio
      "form-3800.7.part5.4_breakdown_col_e": 3000,
      // Line 1 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.1_breakdown_col_g": 36800,
      // Line 1 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.1_breakdown_col_h2": 36800,
      // Line 1 — (k) Carryforward to 2026. Subtract column (i)(1) from column (h)(2)
      "form-3800.7.part5.1_breakdown_col_k": 36800,
      // Line 2 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.2_breakdown_col_g": 2000,
      // Line 2 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.2_breakdown_col_h2": 2000,
      // Line 2 — (k) Carryforward to 2026. Subtract column (i)(1) from column (h)(2)
      "form-3800.7.part5.2_breakdown_col_k": 2000,
      // Line 3 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.3_breakdown_col_g": 50000,
      // Line 3 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.3_breakdown_col_h2": 50000,
      // Line 3 — (i)(1) Amount of column (h)(2) applied against tax in Part II
      "form-3800.7.part5.3_breakdown_col_i1": 31845,
      // Line 3 — (k) Carryforward to 2026. Subtract column (i)(1) from column (h)(2)
      "form-3800.7.part5.3_breakdown_col_k": 18155,
      // Line 4 — (g) Combine columns (d)(4), (e), (f)(1), and (f)(2)
      "form-3800.7.part5.4_breakdown_col_g": 3000,
      // Line 4 — (h)(2) Subtract column (h)(1) from column (g) (credit excluding EPE)
      "form-3800.7.part5.4_breakdown_col_h2": 3000,
      // Line 4 — (k) Carryforward to 2026. Subtract column (i)(1) from column (h)(2)
      "form-3800.7.part5.4_breakdown_col_k": 3000,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 4017,
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 3047,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 7064,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 6a — General business credit. Attach Form 3800
      "schedule-3.0.line.6a": 31845,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 31845,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 31845,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 400000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 400000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 150000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 550000,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 2009,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 547991,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 547991,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 532241,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 155832,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 155832,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 31845,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 31845,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 123987,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 7064,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 131051,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 120000,
      // Line 25c — Federal income tax withheld from other forms (see instructions)
      "form-1040.line.25c": 1750,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 121750,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 121750,
      // Line 37 — Amount you owe
      "form-1040.line.37": 9301,
    },
  },
};

export function dainExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
