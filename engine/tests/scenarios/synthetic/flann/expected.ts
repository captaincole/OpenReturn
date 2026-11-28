/*
 * flann — LOCKED expected values, drafted from the engine's
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
  "form-8826": {
    engineFields: {
      // Line 1 — Total eligible access expenditures (dollars)
      "form-8826.0.line.1_total_eligible_access_expenditures_dollars": 3101,
      // Line 3 — Subtract line 2 from line 1. If zero or less, enter -0- (dollars)
      "form-8826.0.line.3_subtract_2_from_1_dollars": 2851,
      // Line 5 — Enter the smaller of line 3 or line 4 (dollars)
      "form-8826.0.line.5_smaller_of_3_or_4_dollars": 2851,
      // Line 6 — Multiply line 5 by 50% (0.50) (dollars)
      "form-8826.0.line.6_multiply_5_by_50_percent_dollars": 1426,
      // Line 8 — Add lines 6 and 7, but do not enter more than $5,000 (dollars)
      "form-8826.0.line.8_total_disabled_access_credit_dollars": 1426,
    },
  },
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 1240000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 1240000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 1240000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 1240000,
      // Line 8 — Advertising
      "schedule-c.0.line.8": 4300,
      // Line 20a — Rent or lease: Vehicles, machinery, and equipment
      "schedule-c.0.line.20a": 42000,
      // Line 20b — Rent or lease: Other business property
      "schedule-c.0.line.20b": 36000,
      // Line 21 — Repairs and maintenance
      "schedule-c.0.line.21": 8374,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 96000,
      // Line 23 — Taxes and licenses
      "schedule-c.0.line.23": 61000,
      // Line 15 — Insurance (other than health)
      "schedule-c.0.line.15": 38000,
      // Line 25 — Utilities
      "schedule-c.0.line.25": 12400,
      // Line 26 — Wages (less employment credits)
      "schedule-c.0.line.26": 760000,
      // Line 17 — Legal and professional services
      "schedule-c.0.line.17": 8500,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 1066574,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 173426,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 173426,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 173426,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 173426,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 160159,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 160159,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 160159,
      // Line 9 — Subtract line 8d from line 7. If zero or less, enter -0-
      "schedule-se.0.line.9": 176100,
      // Line 10 — Multiply the smaller of line 6 or line 9 by 12.4% (0.124)
      "schedule-se.0.line.10": 19860,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 4645,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 24505,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 12253,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 173426,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 173426,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 12253,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 12253,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": 161173,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": 161173,
      // Line 4 — Total qualified business income. Combine lines 2 and 3. If zero or less, enter -0
      "form-8995.0.line.4": 161173,
      // Line 5 — Qualified business income component. Multiply line 4 by 20% (0.20)
      "form-8995.0.line.5": 32235,
      // Line 10 — Qualified business income deduction before the income limitation. Add lines 5 an
      "form-8995.0.line.10": 32235,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 145423,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 145423,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 29085,
      // Line 15 — Qualified business income deduction. Enter the smaller of line 10 or line 14
      "form-8995.0.line.15": 29085,
    },
  },
  "form-6251": {
    engineFields: {
      // Line 1a — Subtract Schedule 1-A (Form 1040), line 37, from Form 1040, 1040-SR, or 1040-NR,
      "form-6251.0.line.1a_deductions_less_schedule_1a": 44835,
      // Line 1b — Subtract line 1a from Form 1040, 1040-SR, or 1040-NR, line 11b (if less than zer
      "form-6251.0.line.1b_taxable_income_start": 116338,
      // Line 2a — If filing Schedule A (Form 1040), enter the taxes from Schedule A, line 7; other
      "form-6251.0.line.2a_taxes_or_standard_deduction": 15750,
      // Line 4 — Alternative minimum taxable income. Combine lines 1b through 3
      "form-6251.0.line.4_alternative_minimum_taxable_income": 132088,
      // Line 5 — Exemption
      "form-6251.0.line.5_exemption": 88100,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-6251.0.line.6_amti_less_exemption": 43988,
      // Line 7 — Tax on line 6: complete Part III and enter line 40 if you have capital gain distr
      "form-6251.0.line.7_tax_on_line_6": 11437,
      // Line 9 — Tentative minimum tax. Subtract line 8 from line 7
      "form-6251.0.line.9_tentative_minimum_tax": 11437,
      // Line 10 — Add Form 1040 or 1040-SR, line 16 (minus any tax from Form 4972), and Schedule 2
      "form-6251.0.line.10_regular_tax_less_credits": 20768,
    },
  },
  "form-3800": {
    engineFields: {
      // Line 1 — Credits not subject to the passive activity limit from Part III, line 2: combine
      "form-3800.0.line.1_credits_not_passive_limited": 1426,
      // Line 6 — Add lines 1, 3, 4, and 5
      "form-3800.0.line.6_total_credits_not_allowed_tmt": 1426,
      // Line 7 — Regular tax before credits
      "form-3800.0.line.7_regular_tax_before_credits": 20768,
      // Line 9 — Add lines 7 and 8
      "form-3800.0.line.9_regular_tax_plus_amt": 20768,
      // Line 11 — Net income tax. Subtract line 10c from line 9
      "form-3800.0.line.11_net_income_tax": 20768,
      // Line 12 — Net regular tax. Subtract line 10c from line 7. If zero or less, enter -0-
      "form-3800.0.line.12_net_regular_tax": 20768,
      // Line 14 — Tentative minimum tax
      "form-3800.0.line.14_tentative_minimum_tax": 11437,
      // Line 15 — Enter the greater of line 13 or line 14
      "form-3800.0.line.15_greater_of_line_13_or_14": 11437,
      // Line 16 — Subtract line 15 from line 11. If zero or less, enter -0-
      "form-3800.0.line.16_net_income_tax_less_line_15": 9331,
      // Line 17 — Enter the smaller of line 6 or line 16. This is the amount of your credit allowe
      "form-3800.0.line.17_credit_allowed_after_38c1_limit": 1426,
      // Line 27 — Subtract line 13 from line 11. If zero or less, enter -0-
      "form-3800.1.line.27_subtract_line_13_from_11": 20768,
      // Line 28 — Add lines 17 and 26
      "form-3800.1.line.28_add_lines_17_and_26": 1426,
      // Line 29 — Subtract line 28 from line 27. If zero or less, enter -0-
      "form-3800.1.line.29_subtract_line_28_from_27": 19342,
      // Line 38 — Credit allowed for the current year. Add lines 28 and 37
      "form-3800.1.line.38_credit_allowed_current_year": 1426,
      // Line 1e — Form 8826 — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.1e_form_8826_col_e": 1426,
      // Line 1e — Form 8826 — (g) Combine columns (e) and (f) with the credit from column (d) allo
      "form-3800.2.part3.1e_form_8826_col_g": 1426,
      // Line 2 — Add lines 1a–1zz — (e) Credits not subject to the passive activity limits
      "form-3800.2.part3.2_add_lines_1a_1zz_col_e": 1426,
      // Line 2 — Add lines 1a–1zz — (g) Combine columns (e) and (f) with the credit from column (d
      "form-3800.2.part3.2_add_lines_1a_1zz_col_g": 1426,
      // Line 6 — Add lines 2, 3, and 5: (e) Credits not subject to the passive activity limits
      "form-3800.3.part3.6_add_lines_2_3_5_col_e": 1426,
      // Line 6 — Add lines 2, 3, and 5: (g) Combine columns (e) and (f) with the credit from colum
      "form-3800.3.part3.6_add_lines_2_3_5_col_g": 1426,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 24505,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 24505,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 6a — General business credit. Attach Form 3800
      "schedule-3.0.line.6a": 1426,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 1426,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 1426,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 173426,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 173426,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 12253,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 161173,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 161173,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 29085,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 44835,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 116338,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 20768,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 20768,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 1426,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 1426,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 19342,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 24505,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 43847,
      // Line 26 — 2025 estimated tax payments and amount applied from 2024 return
      "form-1040.line.26": 36000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 36000,
      // Line 37 — Amount you owe
      "form-1040.line.37": 7847,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Line 3 . Business income or (loss). See instructions. Column A. Federal Amounts.
      "schedule-ca.0.line.b3_federal": 173426,
      // Line 3 . Column B. Subtractions.
      "schedule-ca.0.line.b3_subtractions": 1426,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 173426,
      // Line 10. Column B. Subtractions.
      "schedule-ca.2.line.b10_subtractions": 1426,
      // Line 15. Deductible part of self-employment tax. See instructions. Column A. Federal Amoun
      "schedule-ca.2.line.c15_federal": 12253,
      // Line 26. Add line 11 through line 23 and line 25 in columns A, B, and C. See instructions.
      "schedule-ca.3.line.c26_federal": 12253,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 161173,
      // Line 27. Column B. Subtractions.
      "schedule-ca.3.line.c27_subtractions": 1426,
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
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040 or 1040-SR, li
      "form-540.line.13_federal_agi": 161173,
      // Line 14. California adjustments – subtractions. Enter the amount from Schedule CA (540), P
      "form-540.line.14_ca_adjustments_subtractions": 1426,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 159747,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 159747,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 154041,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 10764,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 153,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 10611,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 10611,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 10611,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 10611,
      // Line 100. Tax due. If line 95 is less than line 64, subtract line 95 from line 64.
      "form-540.line.100_tax_due": 10611,
      // Amount You Owe. Line 111. Amount You Owe. If you do not have an amount on line 99, add lin
      "form-540.line.111_amount_you_owe": 10611,
      // Line 114. Total amount due. See instructions. Enclose, but do not staple, any payment.
      "form-540.line.114_total_amount_due": 10611,
    },
  },
};

export function flannExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
