/*
 * siuan — LOCKED expected values, drafted from the engine's
 * output on 2026-11-22 (scripts/draftExpected.ts).
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
  "form-4972": {
    engineFields: {
      // Line 6 — Capital gain part from Form 1099-R, box 3
      "form-4972.0.line.6_capital_gain_part": 5280,
      // Line 7 — Multiply line 6 by 20% (0.20)
      "form-4972.0.line.7_capital_gain_tax": 1056,
      // Line 8 — If you completed Part II, enter the amount from Form 1099-R, box 2a, minus box 3.
      "form-4972.0.line.8_ordinary_income_part": 45760,
      // Line 9 — Death benefit exclusion for a beneficiary of a plan participant who died before A
      "form-4972.0.line.9_death_benefit_exclusion": 4400,
      // Line 10 — Total taxable amount. Subtract line 9 from line 8
      "form-4972.0.line.10_total_taxable_amount": 41360,
      // Line 11 — Current actuarial value of annuity from Form 1099-R, box 8. If none, enter -0-
      "form-4972.0.line.11_annuity_actuarial_value": 9000,
      // Line 12 — Adjusted total taxable amount. Add lines 10 and 11
      "form-4972.0.line.12_adjusted_total_taxable_amount": 50360,
      // Line 13 — Multiply line 12 by 50% (0.50), but don't enter more than $10,000
      "form-4972.0.line.13_half_of_line_12": 10000,
      // Line 14 — Subtract $20,000 from line 12. If line 12 is $20,000 or less, enter -0-
      "form-4972.0.line.14_line_12_over_20000": 30360,
      // Line 15 — Multiply line 14 by 20% (0.20)
      "form-4972.0.line.15_line_14_times_20_percent": 6072,
      // Line 16 — Minimum distribution allowance. Subtract line 15 from line 13
      "form-4972.0.line.16_minimum_distribution_allowance": 3928,
      // Line 17 — Subtract line 16 from line 12
      "form-4972.0.line.17_line_12_less_allowance": 46432,
      // Line 18 — Federal estate tax attributable to lump-sum distribution
      "form-4972.0.line.18_federal_estate_tax": 2640,
      // Line 19 — Subtract line 18 from line 17
      "form-4972.0.line.19_line_17_less_estate_tax": 43792,
      // Line 21 — Multiply line 16 by the decimal on line 20
      "form-4972.0.line.21_allowance_times_decimal": 702,
      // Line 22 — Subtract line 21 from line 11
      "form-4972.0.line.22_annuity_less_line_21": 8298,
      // Line 23 — Multiply line 19 by 10% (0.10)
      "form-4972.0.line.23_line_19_times_10_percent": 4379,
      // Line 24 — Tax on amount on line 23. Use the Tax Rate Schedule in the instructions
      "form-4972.0.line.24_tax_on_line_23": 556,
      // Line 25 — Multiply line 24 by 10.0
      "form-4972.0.line.25_line_24_times_10": 5560,
      // Line 26 — Multiply line 22 by 10% (0.10)
      "form-4972.0.line.26_line_22_times_10_percent": 830,
      // Line 27 — Tax on amount on line 26. Use the Tax Rate Schedule in the instructions
      "form-4972.0.line.27_tax_on_line_26": 91,
      // Line 28 — Multiply line 27 by 10.0
      "form-4972.0.line.28_line_27_times_10": 910,
      // Line 29 — Subtract line 28 from line 25
      "form-4972.0.line.29_line_25_less_line_28": 4650,
      // Line 30 — Tax on lump-sum distribution. Add lines 7 and 29
      "form-4972.0.line.30_tax_on_lump_sum_distribution": 5706,
      // NUA Worksheet, line A — Enter the amount from Form 1099-R, box 3
      "form-4972.2.nua_worksheet.a_capital_gain_box_3": 5520,
      // NUA Worksheet, line B — Enter the amount from Form 1099-R, box 2a
      "form-4972.2.nua_worksheet.b_taxable_amount_box_2a": 46000,
      // NUA Worksheet, line D — Enter the amount from Form 1099-R, box 6
      "form-4972.2.nua_worksheet.d_nua_box_6": 6000,
      // NUA Worksheet, line E — Capital gain portion of NUA. Multiply line C by line D
      "form-4972.2.nua_worksheet.e_capital_gain_portion_nua": 720,
      // NUA Worksheet, line F — Ordinary income portion of NUA. Subtract line E from line D
      "form-4972.2.nua_worksheet.f_ordinary_income_portion_nua": 5280,
      // NUA Worksheet, line G — Total capital gain portion of distribution. Add lines A and E. Ent
      "form-4972.2.nua_worksheet.g_total_capital_gain_portion": 6240,
      // Death Benefit Worksheet, line A — Enter the amount from Form 1099-R, box 3, or, if you are
      "form-4972.2.death_benefit_worksheet.a_capital_gain_amount": 6240,
      // Death Benefit Worksheet, line B — Enter the amount from Form 1099-R, box 2a, plus, if you
      "form-4972.2.death_benefit_worksheet.b_taxable_amount_plus_nua": 52000,
      // Death Benefit Worksheet, line D — Enter your share of the death benefit exclusion
      "form-4972.2.death_benefit_worksheet.d_share_of_exclusion": 5000,
      // Death Benefit Worksheet, line E — Death benefit exclusion allocated to capital gain. Multi
      "form-4972.2.death_benefit_worksheet.e_exclusion_allocated_capital_gain": 600,
      // Death Benefit Worksheet, line F — Subtract line E from line A. Enter here and on Form 4972
      "form-4972.2.death_benefit_worksheet.f_capital_gain_after_exclusion": 5640,
    },
    renderedText: {
      "form-4972.0.header.recipient_name": "Siuan Ferrandel",
      "form-4972.0.header.identifying_number": "400-00-4972",
      // Line 20: 9,000 / 50,360 = 0.17871..., four places.
      "form-4972.0.line.20_annuity_decimal_whole": "0",
      "form-4972.0.line.20_annuity_decimal_fraction": "1787",
      // NUA Worksheet line C: 5,520 / 46,000 = 0.12.
      "form-4972.2.nua_worksheet.c_capital_gain_ratio_whole": "0",
      "form-4972.2.nua_worksheet.c_capital_gain_ratio_decimal": "1200",
      // Death Benefit Worksheet line C: 6,240 / 52,000 = 0.12.
      "form-4972.2.death_benefit_worksheet.c_capital_gain_ratio_whole": "0",
      "form-4972.2.death_benefit_worksheet.c_capital_gain_ratio_decimal": "1200",
    },
    // Part I: a beneficiary of a participant born before 1936, entire balance, no rollover, no earlier election.
    renderedChecked: [
      "form-4972.0.line.1_entire_balance_distribution_yes",
      "form-4972.0.line.2_rolled_over_distribution_no",
      "form-4972.0.line.3_beneficiary_born_before_1936_yes",
      "form-4972.0.line.4_participant_five_years_no",
      "form-4972.0.line.5a_prior_use_own_plan_no",
      "form-4972.0.line.5b_prior_use_as_beneficiary_no",
    ],
    // She is the only recipient (no box 9a): the Step 5 worksheet stays blank.
    renderedBlank: [
      "form-4972.0.line.1_entire_balance_distribution_no",
      "form-4972.0.line.2_rolled_over_distribution_yes",
      "form-4972.0.line.3_beneficiary_born_before_1936_no",
      "form-4972.0.line.4_participant_five_years_yes",
      "form-4972.0.line.5a_prior_use_own_plan_yes",
      "form-4972.0.line.5b_prior_use_as_beneficiary_yes",
      "form-4972.2.multiple_recipients_worksheet.a_line_25_minus_line_28",
      "form-4972.2.multiple_recipients_worksheet.b_percentage_of_distribution",
      "form-4972.2.multiple_recipients_worksheet.c_share_of_tax",
    ],
  },
  // She is 67: the senior deduction. The Form 4972 distribution is not in AGI, so it does not phase the deduction out.
  "schedule-1-a": {
    engineFields: {
      "schedule-1-a.0.line.1_agi_form_1040": 24000,
      "schedule-1-a.0.line.3_modified_agi": 24000,
      "schedule-1-a.1.line.31_magi_from_line_3": 24000,
      "schedule-1-a.1.line.32_senior_threshold": 75000,
      // Printed below zero, as the tcb-us-003 answer key prints it; line 35 then takes $6,000.
      "schedule-1-a.1.line.33_magi_over_threshold": -51000,
      "schedule-1-a.1.line.35_senior_amount_per_person": 6000,
      "schedule-1-a.1.line.36a_senior_deduction_you": 6000,
      "schedule-1-a.1.line.37_enhanced_senior_deduction": 6000,
      "schedule-1-a.1.line.38_total_additional_deductions": 6000,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 5a — Pensions and annuities
      "form-1040.line.5a": 24000,
      // Line 5b — Taxable amount
      "form-1040.line.5b": 24000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 24000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 24000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 24000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 17750,
      // Line 13b — Additional deductions from Schedule 1-A, line 38
      "form-1040.line.13b": 6000,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 23750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 5732,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 5732,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 5732,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 5732,
      // Line 25b — Federal income tax withheld from Form(s) 1099
      "form-1040.line.25b": 11600,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 11600,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 11600,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 5868,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 5868,
    },
    // Line 16 holds the Form 4972 tax (5,706): box 2.
    renderedChecked: ["form-1040.line.16_from_form_4972"],
  },
};

export function siuanExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
