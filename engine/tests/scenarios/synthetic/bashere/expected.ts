/*
 * bashere — LOCKED expected values, drafted from the engine's
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
  "form-2210": {
    engineFields: {
      // Line 1 — Enter your 2025 tax after credits from Form 1040, 1040-SR, or 1040-NR, line 22
      "form-2210.0.line.1_tax_after_credits": 4233,
      // Line 2 — Other taxes, including self-employment tax and, if applicable, Additional Medicar
      "form-2210.0.line.2_other_taxes": 7158,
      // Line 3 — Other payments and refundable credits
      "form-2210.0.line.3_other_payments_refundable_credits": 1000,
      // Line 4 — Current year tax. Combine lines 1, 2, and 3
      "form-2210.0.line.4_current_year_tax": 10391,
      // Line 5 — Multiply line 4 by 90% (0.90)
      "form-2210.0.line.5_ninety_percent_current_tax": 9352,
      // Line 6 — Withholding taxes. Don't include estimated tax payments
      "form-2210.0.line.6_withholding_taxes": 2600,
      // Line 7 — Subtract line 6 from line 4
      "form-2210.0.line.7_tax_less_withholding": 7791,
      // Line 8 — Maximum required annual payment based on prior year's tax
      "form-2210.0.line.8_prior_year_tax_payment": 9000,
      // Line 9 — Required annual payment. Enter the smaller of line 5 or line 8
      "form-2210.0.line.9_required_annual_payment": 9000,
      // Line 10 — Required installments, column (a) 4/15/25
      "form-2210.1.line.10_required_installments_col_a": 1771,
      // Line 10 — Required installments, column (b) 6/15/25
      "form-2210.1.line.10_required_installments_col_b": 1754,
      // Line 10 — Required installments, column (d) 1/15/26
      "form-2210.1.line.10_required_installments_col_d": 5475,
      // Line 11 — Estimated tax paid and tax withheld, column (a) 4/15/25
      "form-2210.1.line.11_estimated_tax_paid_withheld_col_a": 950,
      // Line 11 — Estimated tax paid and tax withheld, column (b) 6/15/25
      "form-2210.1.line.11_estimated_tax_paid_withheld_col_b": 750,
      // Line 11 — Estimated tax paid and tax withheld, column (c) 9/15/25
      "form-2210.1.line.11_estimated_tax_paid_withheld_col_c": 2150,
      // Line 11 — Estimated tax paid and tax withheld, column (d) 1/15/26
      "form-2210.1.line.11_estimated_tax_paid_withheld_col_d": 4650,
      // Line 12 — Enter the amount, if any, from line 18 in the previous column, column (d) 1/15/2
      "form-2210.1.line.12_overpayment_from_previous_column_col_d": 325,
      // Line 13 — Add lines 11 and 12, column (b) 6/15/25
      "form-2210.1.line.13_add_lines_11_12_col_b": 750,
      // Line 13 — Add lines 11 and 12, column (c) 9/15/25
      "form-2210.1.line.13_add_lines_11_12_col_c": 2150,
      // Line 13 — Add lines 11 and 12, column (d) 1/15/26
      "form-2210.1.line.13_add_lines_11_12_col_d": 4975,
      // Line 14 — Add the amounts on lines 16 and 17 in the previous column, column (b) 6/15/25
      "form-2210.1.line.14_previous_column_lines_16_17_col_b": 821,
      // Line 14 — Add the amounts on lines 16 and 17 in the previous column, column (c) 9/15/25
      "form-2210.1.line.14_previous_column_lines_16_17_col_c": 1825,
      // Line 15 — Subtract line 14 from line 13. If zero or less, enter -0-. For column (a) only,
      "form-2210.1.line.15_subtract_line_14_from_13_col_a": 950,
      // Line 15 — Subtract line 14 from line 13. If zero or less, enter -0-, column (c) 9/15/25
      "form-2210.1.line.15_subtract_line_14_from_13_col_c": 325,
      // Line 15 — Subtract line 14 from line 13. If zero or less, enter -0-, column (d) 1/15/26
      "form-2210.1.line.15_subtract_line_14_from_13_col_d": 4975,
      // Line 16 — If line 15 is zero, subtract line 13 from line 14. Otherwise, enter -0-, column
      "form-2210.1.line.16_subtract_line_13_from_14_col_b": 71,
      // Line 17 — Underpayment. If line 10 is equal to or more than line 15, subtract line 15 from
      "form-2210.1.line.17_underpayment_col_a": 821,
      // Line 17 — Underpayment. If line 10 is equal to or more than line 15, subtract line 15 from
      "form-2210.1.line.17_underpayment_col_b": 1754,
      // Line 17 — Underpayment. If line 10 is equal to or more than line 15, subtract line 15 from
      "form-2210.1.line.17_underpayment_col_d": 500,
      // Line 18 — Overpayment. If line 15 is more than line 10, subtract line 10 from line 15, col
      "form-2210.1.line.18_overpayment_col_c": 325,
      // Line 19 — Penalty. Enter the total penalty from line 14 of the Worksheet for Form 2210, Pa
      "form-2210.1.line.19_penalty": 50,
      // Line 1 — Enter your adjusted gross income for each period — (a) 1/1/25–3/31/25
      "form-2210.2.line.1_adjusted_gross_income_col_a": 21859,
      // Line 1 — Enter your adjusted gross income for each period — (b) 1/1/25–5/31/25
      "form-2210.2.line.1_adjusted_gross_income_col_b": 31717,
      // Line 1 — Enter your adjusted gross income for each period — (c) 1/1/25–8/31/25
      "form-2210.2.line.1_adjusted_gross_income_col_c": 40364,
      // Line 1 — Enter your adjusted gross income for each period — (d) 1/1/25–12/31/25
      "form-2210.2.line.1_adjusted_gross_income_col_d": 73821,
      // Line 3 — Annualized income. Multiply line 1 by line 2 — (a) 1/1/25–3/31/25
      "form-2210.2.line.3_annualized_income_col_a": 87436,
      // Line 3 — Annualized income. Multiply line 1 by line 2 — (b) 1/1/25–5/31/25
      "form-2210.2.line.3_annualized_income_col_b": 76121,
      // Line 3 — Annualized income. Multiply line 1 by line 2 — (c) 1/1/25–8/31/25
      "form-2210.2.line.3_annualized_income_col_c": 60546,
      // Line 3 — Annualized income. Multiply line 1 by line 2 — (d) 1/1/25–12/31/25
      "form-2210.2.line.3_annualized_income_col_d": 73821,
      // Line 4 — If you itemize, enter itemized deductions for the period shown in each column. Al
      "form-2210.2.line.4_itemized_deductions_for_period_col_a": 8950,
      // Line 4 — If you itemize, enter itemized deductions for the period shown in each column. Al
      "form-2210.2.line.4_itemized_deductions_for_period_col_b": 10583,
      // Line 4 — If you itemize, enter itemized deductions for the period shown in each column. Al
      "form-2210.2.line.4_itemized_deductions_for_period_col_c": 13033,
      // Line 4 — If you itemize, enter itemized deductions for the period shown in each column. Al
      "form-2210.2.line.4_itemized_deductions_for_period_col_d": 16300,
      // Line 6 — Multiply line 4 by line 5 — (a) 1/1/25–3/31/25
      "form-2210.2.line.6_annualized_itemized_deductions_col_a": 35800,
      // Line 6 — Multiply line 4 by line 5 — (b) 1/1/25–5/31/25
      "form-2210.2.line.6_annualized_itemized_deductions_col_b": 25399,
      // Line 6 — Multiply line 4 by line 5 — (c) 1/1/25–8/31/25
      "form-2210.2.line.6_annualized_itemized_deductions_col_c": 19550,
      // Line 6 — Multiply line 4 by line 5 — (d) 1/1/25–12/31/25
      "form-2210.2.line.6_annualized_itemized_deductions_col_d": 16300,
      // Line 7 — In each column, enter the amount of your standard deduction from Form 1040 or 104
      "form-2210.2.line.7_standard_deduction_col_a": 15750,
      // Line 7 — In each column, enter the amount of your standard deduction from Form 1040 or 104
      "form-2210.2.line.7_standard_deduction_col_b": 15750,
      // Line 7 — In each column, enter the amount of your standard deduction from Form 1040 or 104
      "form-2210.2.line.7_standard_deduction_col_c": 15750,
      // Line 7 — In each column, enter the amount of your standard deduction from Form 1040 or 104
      "form-2210.2.line.7_standard_deduction_col_d": 15750,
      // Line 8 — Enter the larger of line 6 or line 7 — (a) 1/1/25–3/31/25
      "form-2210.2.line.8_larger_of_line_6_or_7_col_a": 35800,
      // Line 8 — Enter the larger of line 6 or line 7 — (b) 1/1/25–5/31/25
      "form-2210.2.line.8_larger_of_line_6_or_7_col_b": 25399,
      // Line 8 — Enter the larger of line 6 or line 7 — (c) 1/1/25–8/31/25
      "form-2210.2.line.8_larger_of_line_6_or_7_col_c": 19550,
      // Line 8 — Enter the larger of line 6 or line 7 — (d) 1/1/25–12/31/25
      "form-2210.2.line.8_larger_of_line_6_or_7_col_d": 16300,
      // Line 9 — Deduction for qualified business income — (a) 1/1/25–3/31/25
      "form-2210.2.line.9_qualified_business_income_deduction_col_a": 1487,
      // Line 9 — Deduction for qualified business income — (b) 1/1/25–5/31/25
      "form-2210.2.line.9_qualified_business_income_deduction_col_b": 1784,
      // Line 9 — Deduction for qualified business income — (c) 1/1/25–8/31/25
      "form-2210.2.line.9_qualified_business_income_deduction_col_c": 2509,
      // Line 9 — Deduction for qualified business income — (d) 1/1/25–12/31/25
      "form-2210.2.line.9_qualified_business_income_deduction_col_d": 8364,
      // Line 10 — Add lines 8 and 9 — (a) 1/1/25–3/31/25
      "form-2210.2.line.10_total_deductions_col_a": 37287,
      // Line 10 — Add lines 8 and 9 — (b) 1/1/25–5/31/25
      "form-2210.2.line.10_total_deductions_col_b": 27183,
      // Line 10 — Add lines 8 and 9 — (c) 1/1/25–8/31/25
      "form-2210.2.line.10_total_deductions_col_c": 22059,
      // Line 10 — Add lines 8 and 9 — (d) 1/1/25–12/31/25
      "form-2210.2.line.10_total_deductions_col_d": 24664,
      // Line 11 — Subtract line 10 from line 3 — (a) 1/1/25–3/31/25
      "form-2210.2.line.11_income_less_deductions_col_a": 50149,
      // Line 11 — Subtract line 10 from line 3 — (b) 1/1/25–5/31/25
      "form-2210.2.line.11_income_less_deductions_col_b": 48938,
      // Line 11 — Subtract line 10 from line 3 — (c) 1/1/25–8/31/25
      "form-2210.2.line.11_income_less_deductions_col_c": 38487,
      // Line 11 — Subtract line 10 from line 3 — (d) 1/1/25–12/31/25
      "form-2210.2.line.11_income_less_deductions_col_d": 49157,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0- — (a) 1/1/25–3/31/25
      "form-2210.2.line.13_annualized_taxable_income_col_a": 50149,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0- — (b) 1/1/25–5/31/25
      "form-2210.2.line.13_annualized_taxable_income_col_b": 48938,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0- — (c) 1/1/25–8/31/25
      "form-2210.2.line.13_annualized_taxable_income_col_c": 38487,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0- — (d) 1/1/25–12/31/25
      "form-2210.2.line.13_annualized_taxable_income_col_d": 49157,
      // Line 14 — Figure your tax on the amount on line 13 — (a) 1/1/25–3/31/25
      "form-2210.2.line.14_tax_on_line_13_col_a": 5942,
      // Line 14 — Figure your tax on the amount on line 13 — (b) 1/1/25–5/31/25
      "form-2210.2.line.14_tax_on_line_13_col_b": 5678,
      // Line 14 — Figure your tax on the amount on line 13 — (c) 1/1/25–8/31/25
      "form-2210.2.line.14_tax_on_line_13_col_c": 4379,
      // Line 14 — Figure your tax on the amount on line 13 — (d) 1/1/25–12/31/25
      "form-2210.2.line.14_tax_on_line_13_col_d": 5733,
      // Line 15 — Self-employment tax from line 36 (complete Part II below) — (a) 1/1/25–3/31/25
      "form-2210.2.line.15_self_employment_tax_col_a": 1130,
      // Line 15 — Self-employment tax from line 36 (complete Part II below) — (b) 1/1/25–5/31/25
      "form-2210.2.line.15_self_employment_tax_col_b": 1356,
      // Line 15 — Self-employment tax from line 36 (complete Part II below) — (c) 1/1/25–8/31/25
      "form-2210.2.line.15_self_employment_tax_col_c": 1908,
      // Line 15 — Self-employment tax from line 36 (complete Part II below) — (d) 1/1/25–12/31/25
      "form-2210.2.line.15_self_employment_tax_col_d": 6358,
      // Line 16 — Enter other taxes for each payment period including, if applicable, Additional M
      "form-2210.2.line.16_other_taxes_col_a": 800,
      // Line 16 — Enter other taxes for each payment period including, if applicable, Additional M
      "form-2210.2.line.16_other_taxes_col_b": 800,
      // Line 16 — Enter other taxes for each payment period including, if applicable, Additional M
      "form-2210.2.line.16_other_taxes_col_c": 800,
      // Line 16 — Enter other taxes for each payment period including, if applicable, Additional M
      "form-2210.2.line.16_other_taxes_col_d": 800,
      // Line 17 — Total tax. Add lines 14, 15, and 16 — (a) 1/1/25–3/31/25
      "form-2210.2.line.17_total_tax_col_a": 7872,
      // Line 17 — Total tax. Add lines 14, 15, and 16 — (b) 1/1/25–5/31/25
      "form-2210.2.line.17_total_tax_col_b": 7834,
      // Line 17 — Total tax. Add lines 14, 15, and 16 — (c) 1/1/25–8/31/25
      "form-2210.2.line.17_total_tax_col_c": 7087,
      // Line 17 — Total tax. Add lines 14, 15, and 16 — (d) 1/1/25–12/31/25
      "form-2210.2.line.17_total_tax_col_d": 12891,
      // Line 18 — For each period, enter the same type of credits as allowed on Form 2210, Part I,
      "form-2210.2.line.18_credits_col_c": 2500,
      // Line 18 — For each period, enter the same type of credits as allowed on Form 2210, Part I,
      "form-2210.2.line.18_credits_col_d": 2500,
      // Line 19 — Subtract line 18 from line 17. If zero or less, enter -0- — (a) 1/1/25–3/31/25
      "form-2210.2.line.19_tax_after_credits_col_a": 7872,
      // Line 19 — Subtract line 18 from line 17. If zero or less, enter -0- — (b) 1/1/25–5/31/25
      "form-2210.2.line.19_tax_after_credits_col_b": 7834,
      // Line 19 — Subtract line 18 from line 17. If zero or less, enter -0- — (c) 1/1/25–8/31/25
      "form-2210.2.line.19_tax_after_credits_col_c": 4587,
      // Line 19 — Subtract line 18 from line 17. If zero or less, enter -0- — (d) 1/1/25–12/31/25
      "form-2210.2.line.19_tax_after_credits_col_d": 10391,
      // Line 21 — Multiply line 19 by line 20 — (a) 1/1/25–3/31/25
      "form-2210.2.line.21_tax_times_applicable_percentage_col_a": 1771,
      // Line 21 — Multiply line 19 by line 20 — (b) 1/1/25–5/31/25
      "form-2210.2.line.21_tax_times_applicable_percentage_col_b": 3525,
      // Line 21 — Multiply line 19 by line 20 — (c) 1/1/25–8/31/25
      "form-2210.2.line.21_tax_times_applicable_percentage_col_c": 3096,
      // Line 21 — Multiply line 19 by line 20 — (d) 1/1/25–12/31/25
      "form-2210.2.line.21_tax_times_applicable_percentage_col_d": 9352,
      // Line 22 — Enter the total of the amounts in all previous columns of line 27 — (b) 1/1/25–5
      "form-2210.2.line.22_previous_columns_line_27_total_col_b": 1771,
      // Line 22 — Enter the total of the amounts in all previous columns of line 27 — (c) 1/1/25–8
      "form-2210.2.line.22_previous_columns_line_27_total_col_c": 3525,
      // Line 22 — Enter the total of the amounts in all previous columns of line 27 — (d) 1/1/25–1
      "form-2210.2.line.22_previous_columns_line_27_total_col_d": 3525,
      // Line 23 — Subtract line 22 from line 21. If zero or less, enter -0- — (a) 1/1/25–3/31/25
      "form-2210.2.line.23_annualized_installment_before_limit_col_a": 1771,
      // Line 23 — Subtract line 22 from line 21. If zero or less, enter -0- — (b) 1/1/25–5/31/25
      "form-2210.2.line.23_annualized_installment_before_limit_col_b": 1754,
      // Line 23 — Subtract line 22 from line 21. If zero or less, enter -0- — (d) 1/1/25–12/31/25
      "form-2210.2.line.23_annualized_installment_before_limit_col_d": 5827,
      // Line 24 — Enter 25% (0.25) of line 9 on page 1 of Form 2210 in each column — (a) 1/1/25–3/
      "form-2210.2.line.24_regular_installment_25_percent_col_a": 2250,
      // Line 24 — Enter 25% (0.25) of line 9 on page 1 of Form 2210 in each column — (b) 1/1/25–5/
      "form-2210.2.line.24_regular_installment_25_percent_col_b": 2250,
      // Line 24 — Enter 25% (0.25) of line 9 on page 1 of Form 2210 in each column — (c) 1/1/25–8/
      "form-2210.2.line.24_regular_installment_25_percent_col_c": 2250,
      // Line 24 — Enter 25% (0.25) of line 9 on page 1 of Form 2210 in each column — (d) 1/1/25–12
      "form-2210.2.line.24_regular_installment_25_percent_col_d": 2250,
      // Line 25 — Subtract line 27 of the previous column from line 26 of that column — (b) 1/1/25
      "form-2210.2.line.25_previous_column_installment_carryover_col_b": 479,
      // Line 25 — Subtract line 27 of the previous column from line 26 of that column — (c) 1/1/25
      "form-2210.2.line.25_previous_column_installment_carryover_col_c": 975,
      // Line 25 — Subtract line 27 of the previous column from line 26 of that column — (d) 1/1/25
      "form-2210.2.line.25_previous_column_installment_carryover_col_d": 3225,
      // Line 26 — Add lines 24 and 25 — (a) 1/1/25–3/31/25
      "form-2210.2.line.26_regular_installment_plus_carryover_col_a": 2250,
      // Line 26 — Add lines 24 and 25 — (b) 1/1/25–5/31/25
      "form-2210.2.line.26_regular_installment_plus_carryover_col_b": 2729,
      // Line 26 — Add lines 24 and 25 — (c) 1/1/25–8/31/25
      "form-2210.2.line.26_regular_installment_plus_carryover_col_c": 3225,
      // Line 26 — Add lines 24 and 25 — (d) 1/1/25–12/31/25
      "form-2210.2.line.26_regular_installment_plus_carryover_col_d": 5475,
      // Line 27 — Enter the smaller of line 23 or line 26 here and on Form 2210, Part III, line 10
      "form-2210.2.line.27_annualized_income_installment_col_a": 1771,
      // Line 27 — Enter the smaller of line 23 or line 26 here and on Form 2210, Part III, line 10
      "form-2210.2.line.27_annualized_income_installment_col_b": 1754,
      // Line 27 — Enter the smaller of line 23 or line 26 here and on Form 2210, Part III, line 10
      "form-2210.2.line.27_annualized_income_installment_col_d": 5475,
      // Line 28 — Net earnings from self-employment for the period — (a) 1/1/25–3/31/25
      "form-2210.2.line.28_net_self_employment_earnings_col_a": 1847,
      // Line 28 — Net earnings from self-employment for the period — (b) 1/1/25–5/31/25
      "form-2210.2.line.28_net_self_employment_earnings_col_b": 3694,
      // Line 28 — Net earnings from self-employment for the period — (c) 1/1/25–8/31/25
      "form-2210.2.line.28_net_self_employment_earnings_col_c": 8312,
      // Line 28 — Net earnings from self-employment for the period — (d) 1/1/25–12/31/25
      "form-2210.2.line.28_net_self_employment_earnings_col_d": 41558,
      // Line 30 — Enter actual wages for the period subject to social security tax or the 6.2% por
      "form-2210.2.line.30_social_security_wages_for_period_col_a": 12000,
      // Line 30 — Enter actual wages for the period subject to social security tax or the 6.2% por
      "form-2210.2.line.30_social_security_wages_for_period_col_b": 20000,
      // Line 30 — Enter actual wages for the period subject to social security tax or the 6.2% por
      "form-2210.2.line.30_social_security_wages_for_period_col_c": 24000,
      // Line 30 — Enter actual wages for the period subject to social security tax or the 6.2% por
      "form-2210.2.line.30_social_security_wages_for_period_col_d": 24000,
      // Line 31 — Subtract line 30 from line 29. If zero or less, enter -0- — (a) 1/1/25–3/31/25
      "form-2210.2.line.31_remaining_social_security_limit_col_a": 32025,
      // Line 31 — Subtract line 30 from line 29. If zero or less, enter -0- — (b) 1/1/25–5/31/25
      "form-2210.2.line.31_remaining_social_security_limit_col_b": 53375,
      // Line 31 — Subtract line 30 from line 29. If zero or less, enter -0- — (c) 1/1/25–8/31/25
      "form-2210.2.line.31_remaining_social_security_limit_col_c": 93400,
      // Line 31 — Subtract line 30 from line 29. If zero or less, enter -0- — (d) 1/1/25–12/31/25
      "form-2210.2.line.31_remaining_social_security_limit_col_d": 152100,
      // Line 33 — Multiply line 32 by the smaller of line 28 or line 31 — (a) 1/1/25–3/31/25
      "form-2210.2.line.33_annualized_social_security_part_col_a": 916,
      // Line 33 — Multiply line 32 by the smaller of line 28 or line 31 — (b) 1/1/25–5/31/25
      "form-2210.2.line.33_annualized_social_security_part_col_b": 1099,
      // Line 33 — Multiply line 32 by the smaller of line 28 or line 31 — (c) 1/1/25–8/31/25
      "form-2210.2.line.33_annualized_social_security_part_col_c": 1546,
      // Line 33 — Multiply line 32 by the smaller of line 28 or line 31 — (d) 1/1/25–12/31/25
      "form-2210.2.line.33_annualized_social_security_part_col_d": 5153,
      // Line 35 — Multiply line 28 by line 34 — (a) 1/1/25–3/31/25
      "form-2210.2.line.35_annualized_medicare_part_col_a": 214,
      // Line 35 — Multiply line 28 by line 34 — (b) 1/1/25–5/31/25
      "form-2210.2.line.35_annualized_medicare_part_col_b": 257,
      // Line 35 — Multiply line 28 by line 34 — (c) 1/1/25–8/31/25
      "form-2210.2.line.35_annualized_medicare_part_col_c": 362,
      // Line 35 — Multiply line 28 by line 34 — (d) 1/1/25–12/31/25
      "form-2210.2.line.35_annualized_medicare_part_col_d": 1205,
      // Line 36 — Add lines 33 and 35. Enter here and on line 15 above — (a) 1/1/25–3/31/25
      "form-2210.2.line.36_annualized_self_employment_tax_col_a": 1130,
      // Line 36 — Add lines 33 and 35. Enter here and on line 15 above — (b) 1/1/25–5/31/25
      "form-2210.2.line.36_annualized_self_employment_tax_col_b": 1356,
      // Line 36 — Add lines 33 and 35. Enter here and on line 15 above — (c) 1/1/25–8/31/25
      "form-2210.2.line.36_annualized_self_employment_tax_col_c": 1908,
      // Line 36 — Add lines 33 and 35. Enter here and on line 15 above — (d) 1/1/25–12/31/25
      "form-2210.2.line.36_annualized_self_employment_tax_col_d": 6358,
      // Verified zero (hand check, README.md)
      "form-2210.1.line.10_required_installments_col_c": 0,
      // Verified zero (hand check, README.md)
      "form-2210.1.line.12_overpayment_from_previous_column_col_b": 0,
      // Verified zero (hand check, README.md)
      "form-2210.1.line.16_subtract_line_13_from_14_col_c": 0,
      // Verified zero (hand check, README.md)
      "form-2210.2.line.12_exemption_amount_col_a": 0,
      // Verified zero (hand check, README.md)
      "form-2210.2.line.18_credits_col_a": 0,
      // Verified zero (hand check, README.md)
      "form-2210.2.line.23_annualized_installment_before_limit_col_c": 0,
      // Verified zero (hand check, README.md)
      "form-2210.2.line.27_annualized_income_installment_col_c": 0,
    },
    renderedChecked: [
      "form-2210.0.line.9_more_than_line_6_yes",
      "form-2210.0.line.box_c_annualized_income_method",
    ],
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 24000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 24000,
      // Line 4a — IRA distributions
      "form-1040.line.4a": 8000,
      // Line 4b — Taxable amount
      "form-1040.line.4b": 8000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 45000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 77000,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 3179,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 73821,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 73821,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 16300,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 8364,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 24664,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 49157,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 5733,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 5733,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 1500,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 1500,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 4233,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 7158,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 11391,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 1800,
      // Line 25b — Federal income tax withheld from Form(s) 1099
      "form-1040.line.25b": 800,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 2600,
      // Line 26 — 2025 estimated tax payments and amount applied from 2024 return
      "form-1040.line.26": 5900,
      // Line 29 — American opportunity credit from Form 8863, line 8
      "form-1040.line.29": 1000,
      // Line 32 — Add lines 27a, 28, 29, 30, and 31. Total other payments and refundable credits
      "form-1040.line.32": 1000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 9500,
      // Line 37 — Amount you owe
      "form-1040.line.37": 1941,
      // Line 38 — Estimated tax penalty (see instructions)
      "form-1040.line.38": 50,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 45000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 45000,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 3179,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 3179,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 6358,
      // Line 8 — Additional tax on IRAs or other tax-favored accounts. Attach Form 5329 if require
      "schedule-2.0.line.8_additional_tax_iras_tax_favored_accounts": 800,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 7158,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 3 — Education credits from Form 8863, line 19
      "schedule-3.0.line.3": 1500,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 1500,
    },
  },
  "schedule-a": {
    engineFields: {
      // Line 2 — Enter amount from Form 1040 or 1040-SR, line 11b
      "schedule-a.0.line.2_agi_from_1040": 73821,
      // Line 3 — Multiply line 2 by 7.5% (0.075)
      "schedule-a.0.line.3_agi_multiplied": 5537,
      // Line 5b — State and local real estate taxes (see instructions)
      "schedule-a.0.line.5b_real_estate_taxes": 6500,
      // Line 5d — Add lines 5a through 5c
      "schedule-a.0.line.5d_total_state_local_taxes": 6500,
      // Line 5e — Enter the smaller of line 5d or $40,000 ($20,000 if married filing separately)
      "schedule-a.0.line.5e_salt_cap": 6500,
      // Line 7 — Add lines 5e and 6
      "schedule-a.0.line.7_total_taxes": 6500,
      // Line 8a — Home mortgage interest and points reported to you on Form 1098
      "schedule-a.0.line.8a_mortgage_interest_form1098": 9800,
      // Line 8e — Add lines 8a through 8c
      "schedule-a.0.line.8e_total_mortgage_interest_points": 9800,
      // Line 10 — Add lines 8e and 9
      "schedule-a.0.line.10_total_interest": 9800,
      // Line 17 — Total Itemized Deductions. Add the amounts in the far right column for lines 4 t
      "schedule-a.0.line.17_total_itemized_deductions": 16300,
    },
  },
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 55000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 55000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 55000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 55000,
      // Line 8 — Advertising
      "schedule-c.0.line.8": 2000,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 8000,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 10000,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 45000,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 45000,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 45000,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 45000,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 41558,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 41558,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 41558,
      // Line 8a — Total social security wages and tips (total of boxes 3 and 7 on Form(s) W-2) and
      "schedule-se.0.line.8a": 24000,
      // Line 8d — Add lines 8a, 8b, and 8c
      "schedule-se.0.line.8d": 24000,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 152100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 5153,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 1205,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 6358,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 3179,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": 41821,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": 41821,
      // Line 4 — Total qualified business income. Combine lines 2 and 3. If zero or less, enter -0
      "form-8995.0.line.4": 41821,
      // Line 5 — Qualified business income component. Multiply line 4 by 20% (0.20)
      "form-8995.0.line.5": 8364,
      // Line 10 — Qualified business income deduction before the income limitation. Add lines 5 an
      "form-8995.0.line.10": 8364,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 57521,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 57521,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 11504,
      // Line 15 — Qualified business income deduction. Enter the smaller of line 10 or line 14
      "form-8995.0.line.15": 8364,
    },
  },
  "form-8863": {
    engineFields: {
      // Line 1 — After completing Part III for each student, enter the total of all amounts from a
      "form-8863.0.line.1_total_part3_line_30": 2500,
      // Line 2 — Enter $180,000 if married filing jointly; or $90,000 if single, head of household
      "form-8863.0.line.2_filing_status_limit": 90000,
      // Line 3 — Enter the amount from Form 1040 or 1040-SR, line 11b
      "form-8863.0.line.3_modified_agi": 73821,
      // Line 4 — Subtract line 3 from line 2. If zero or less, stop; you can't take any education
      "form-8863.0.line.4_limit_minus_agi": 16179,
      // Line 5 — Enter $20,000 if married filing jointly; or $10,000 if single, head of household,
      "form-8863.0.line.5_phaseout_range": 10000,
      // Line 7 — Multiply line 1 by line 6
      "form-8863.0.line.7_tentative_american_opportunity_credit": 2500,
      // Line 8 — Refundable American opportunity credit. Multiply line 7 by 40% (0.40)
      "form-8863.0.line.8_refundable_american_opportunity_credit": 1000,
      // Line 9 — Subtract line 8 from line 7
      "form-8863.0.line.9_nonrefundable_american_opportunity_credit": 1500,
      // Line 19 — Nonrefundable education credits. Enter the amount from line 7 of the Credit Limi
      "form-8863.0.line.19_nonrefundable_education_credits": 1500,
      // Line 27 — American Opportunity Credit: Adjusted qualified education expenses. Don't enter
      "form-8863.1.line.27_aoc_adjusted_qualified_expenses": 4000,
      // Line 28 — Subtract $2,000 from line 27. If zero or less, enter -0-
      "form-8863.1.line.28_subtract_2000_from_line27": 2000,
      // Line 29 — Multiply line 28 by 25% (0.25)
      "form-8863.1.line.29_multiply_line28_by_25_percent": 500,
      // Line 30 — If line 28 is zero, enter the amount from line 27. Otherwise, add $2,000 to the
      "form-8863.1.line.30_aoc_tentative_credit_student": 2500,
    },
  },
};

export function bashereExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
