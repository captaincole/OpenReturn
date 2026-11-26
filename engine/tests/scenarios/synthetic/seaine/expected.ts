/*
 * seaine — LOCKED expected values, drafted from the engine's
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
  "form-4970": {
    engineFields: {
      // G — Enter the number of trusts from which you received accumulation distributions in this
      "form-4970.0.header.g_number_of_trusts": 1,
      // Line 1 — Amount of current distribution that is considered distributed in earlier tax year
      "form-4970.0.line.1_current_distribution_earlier_years": 69000,
      // Line 2 — Distributions of income accumulated before you were born or reached age 21
      "form-4970.0.line.2_income_accumulated_before_21": 6000,
      // Line 3 — Subtract line 2 from line 1
      "form-4970.0.line.3_subtract_line_2_from_1": 63000,
      // Line 4 — Taxes imposed on the trust on amounts from line 3 (from Schedule J (Form 1041), l
      "form-4970.0.line.4_taxes_imposed_on_trust": 14700,
      // Line 5 — Total (add lines 3 and 4)
      "form-4970.0.line.5_total_lines_3_and_4": 77700,
      // Line 6 — Tax-exempt interest included on line 5 (from Schedule J (Form 1041), line 37, col
      "form-4970.0.line.6_tax_exempt_interest": 2200,
      // Line 7 — Taxable part of line 5 (subtract line 6 from line 5)
      "form-4970.0.line.7_taxable_part_of_line_5": 75500,
      // Line 8 — Number of trust's earlier tax years in which amounts on line 7 are considered dis
      "form-4970.0.line.8_number_of_trust_earlier_years": 4,
      // Line 9 — Average annual amount considered distributed (divide line 3 by line 8)
      "form-4970.0.line.9_average_annual_amount": 15750,
      // Line 10 — Multiply line 9 by 25% (0.25)
      "form-4970.0.line.10_line_9_times_25_percent": 3938,
      // Line 11 — Number of earlier tax years to be taken into account
      "form-4970.0.line.11_number_of_years_taken_into_account": 3,
      // Line 12 — Average amount for recomputing tax (divide line 7 by line 11)
      "form-4970.0.line.12_average_amount_for_recomputing": 25167,
      // Line 13 (a) 2024 — Enter your taxable income before this distribution for the 5 immediatel
      "form-4970.0.line.13_taxable_income_before_distribution_col_a": 88000,
      // Line 13 (b) 2023 — Enter your taxable income before this distribution for the 5 immediatel
      "form-4970.0.line.13_taxable_income_before_distribution_col_b": 82000,
      // Line 13 (c) 2022 — Enter your taxable income before this distribution for the 5 immediatel
      "form-4970.0.line.13_taxable_income_before_distribution_col_c": 61000,
      // Line 13 (d) 2021 — Enter your taxable income before this distribution for the 5 immediatel
      "form-4970.0.line.13_taxable_income_before_distribution_col_d": 54000,
      // Line 13 (e) 2020 — Enter your taxable income before this distribution for the 5 immediatel
      "form-4970.0.line.13_taxable_income_before_distribution_col_e": 47000,
      // Line 14 (a) — Enter the amounts from line 13, eliminating the highest and lowest taxable i
      "form-4970.0.line.14_line_13_amounts_col_a": 82000,
      // Line 14 (b) — Enter the amounts from line 13, eliminating the highest and lowest taxable i
      "form-4970.0.line.14_line_13_amounts_col_b": 61000,
      // Line 14 (c) — Enter the amounts from line 13, eliminating the highest and lowest taxable i
      "form-4970.0.line.14_line_13_amounts_col_c": 54000,
      // Line 15 (a) — Enter amount from line 12 in each column
      "form-4970.0.line.15_amount_from_line_12_col_a": 25167,
      // Line 15 (b) — Enter amount from line 12 in each column
      "form-4970.0.line.15_amount_from_line_12_col_b": 25167,
      // Line 15 (c) — Enter amount from line 12 in each column
      "form-4970.0.line.15_amount_from_line_12_col_c": 25167,
      // Line 16 (a) — Recomputed taxable income (add lines 14 and 15)
      "form-4970.0.line.16_recomputed_taxable_income_col_a": 107167,
      // Line 16 (b) — Recomputed taxable income (add lines 14 and 15)
      "form-4970.0.line.16_recomputed_taxable_income_col_b": 86167,
      // Line 16 (c) — Recomputed taxable income (add lines 14 and 15)
      "form-4970.0.line.16_recomputed_taxable_income_col_c": 79167,
      // Line 17 (a) — Income tax on amounts on line 16
      "form-4970.0.line.17_income_tax_on_line_16_col_a": 18760,
      // Line 17 (b) — Income tax on amounts on line 16
      "form-4970.0.line.17_income_tax_on_line_16_col_b": 14574,
      // Line 17 (c) — Income tax on amounts on line 16
      "form-4970.0.line.17_income_tax_on_line_16_col_c": 13165,
      // Line 18 (a) — Income tax before credits on line 14 income
      "form-4970.0.line.18_income_tax_before_credits_col_a": 13070,
      // Line 18 (b) — Income tax before credits on line 14 income
      "form-4970.0.line.18_income_tax_before_credits_col_b": 9038,
      // Line 18 (c) — Income tax before credits on line 14 income
      "form-4970.0.line.18_income_tax_before_credits_col_c": 7629,
      // Line 19 (a) — Additional tax before credits (subtract line 18 from line 17)
      "form-4970.0.line.19_additional_tax_before_credits_col_a": 5690,
      // Line 19 (b) — Additional tax before credits (subtract line 18 from line 17)
      "form-4970.0.line.19_additional_tax_before_credits_col_b": 5536,
      // Line 19 (c) — Additional tax before credits (subtract line 18 from line 17)
      "form-4970.0.line.19_additional_tax_before_credits_col_c": 5536,
      // Line 20 (a) — Tax credit adjustment
      "form-4970.0.line.20_tax_credit_adjustment_col_a": 250,
      // Line 21 (a) — Subtract line 20 from line 19
      "form-4970.0.line.21_subtract_line_20_from_19_col_a": 5440,
      // Line 21 (b) — Subtract line 20 from line 19
      "form-4970.0.line.21_subtract_line_20_from_19_col_b": 5536,
      // Line 21 (c) — Subtract line 20 from line 19
      "form-4970.0.line.21_subtract_line_20_from_19_col_c": 5536,
      // Line 22 (b) — Alternative minimum tax adjustments
      "form-4970.0.line.22_amt_adjustments_col_b": -300,
      // Line 23 (a) — Combine lines 21 and 22
      "form-4970.0.line.23_combine_lines_21_and_22_col_a": 5440,
      // Line 23 (b) — Combine lines 21 and 22
      "form-4970.0.line.23_combine_lines_21_and_22_col_b": 5236,
      // Line 23 (c) — Combine lines 21 and 22
      "form-4970.0.line.23_combine_lines_21_and_22_col_c": 5536,
      // Line 24 — Add columns (a), (b), and (c) of line 23
      "form-4970.0.line.24_add_line_23_columns": 16212,
      // Line 25 — Divide the line 24 amount by 3.0
      "form-4970.0.line.25_line_24_divided_by_3": 5404,
      // Line 26 — Multiply the amount on line 25 by the number of years on line 11
      "form-4970.0.line.26_line_25_times_years": 16212,
      // Line 27 — Enter the amount from line 4
      "form-4970.0.line.27_amount_from_line_4": 14700,
      // Line 28 — Partial tax attributable to the accumulation distribution (subtract line 27 from
      "form-4970.0.line.28_partial_tax_on_accumulation_distribution": 1512,
    },
    // The header, and the three computation years Part II keeps (2024 and 2020 drop out).
    renderedText: {
      "form-4970.0.header.a_taxpayer_name": "Seaine Corvell",
      "form-4970.0.header.b_ssn": "400-00-4970",
      "form-4970.0.header.d_trust_ein": "00-0001979",
      "form-4970.0.header.f_beneficiary_date_of_birth": "03/10/1995",
      "form-4970.0.line.computation_year_col_a": "2023",
      "form-4970.0.line.computation_year_col_b": "2022",
      "form-4970.0.line.computation_year_col_c": "2021",
    },
    renderedChecked: ["form-4970.0.header.e_trust_type_domestic"],
    // Lines 20 and 22 are blank where the year's credits and minimum tax do not change.
    renderedBlank: [
      "form-4970.0.header.e_trust_type_foreign",
      "form-4970.0.line.20_tax_credit_adjustment_col_b",
      "form-4970.0.line.20_tax_credit_adjustment_col_c",
      "form-4970.0.line.22_amt_adjustments_col_a",
      "form-4970.0.line.22_amt_adjustments_col_c",
    ],
  },
  "schedule-2": {
    engineFields: {
      // Line 17l — Tax on accumulation distribution of trusts
      "schedule-2.1.line.17l_tax_accumulation_distribution_trusts": 1512,
      // Line 18 — Total additional taxes. Add lines 17a through 17z
      "schedule-2.1.line.18_total_additional_taxes": 1512,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 1512,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 96000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 96000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 96000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 96000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 96000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 80250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 12575,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 12575,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 12575,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 1512,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 14087,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 13800,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 13800,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 13800,
      // Line 37 — Amount you owe
      "form-1040.line.37": 287,
    },
  },
};

export function seaineExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
