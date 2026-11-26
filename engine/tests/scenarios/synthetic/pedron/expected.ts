/*
 * pedron — LOCKED expected values, drafted from the engine's
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
  "form-8611": {
    engineFields: {
      // Line 1 — Enter total credits reported on Form 8586 in prior years for this building
      "form-8611.0.line.1_total_credits_prior_years": 82400,
      // Line 2 — Credits included on line 1 attributable to additions to qualified basis
      "form-8611.0.line.2_credits_additions_qualified_basis": 619,
      // Line 3 — Credits subject to recapture. Subtract line 2 from line 1
      "form-8611.0.line.3_credits_subject_to_recapture": 81781,
      // Line 5 — Accelerated portion of credit. Multiply line 3 by line 4
      "form-8611.0.line.5_accelerated_portion_of_credit": 27233,
      // Line 7 — Amount of accelerated portion recaptured. Multiply line 5 by line 6
      "form-8611.0.line.7_accelerated_portion_recaptured": 4366,
      // Line 9 — Enter the unused portion of the accelerated amount from line 7
      "form-8611.0.line.9_unused_portion_accelerated_amount": 163,
      // Line 10 — Net recapture. Subtract line 9 from line 7 or line 8. If less than zero, enter -
      "form-8611.0.line.10_net_recapture": 4203,
      // Line 11 — Enter interest on the line 10 recapture amount
      "form-8611.0.line.11_interest_on_line_10_recapture": 1205,
      // Line 12 — Total amount subject to recapture. Add lines 10 and 11
      "form-8611.0.line.12_total_amount_subject_to_recapture": 5408,
      // Line 13 — Unused credits attributable to this building reduced by the accelerated portion
      "form-8611.0.line.13_unused_credits_this_building": 2837,
      // Line 14 — Recapture tax. Subtract line 13 from line 12. If zero or less, enter -0-
      "form-8611.0.line.14_recapture_tax": 2571,
      // Line 15 — Carryforward. Line 12 is more than line 13: 0, checked by hand.
      "form-8611.0.line.15_carryforward_low_income_housing_credit": 0,
      // Line 2 Worksheet, line a — Enter the amount from line 10 of Form 8609-A (or predecessor, S
      "form-8611.1.line2_worksheet.a_form_8609a_line_10": 700,
      // Line 2 Worksheet, line b — Multiply a by 2
      "form-8611.1.line2_worksheet.b_line_a_times_2": 1400,
      // Line 2 Worksheet, line c — Enter the amount from line 11 of Form 8609-A (or predecessor, S
      "form-8611.1.line2_worksheet.c_form_8609a_line_11": 300,
      // Line 2 Worksheet, line d — Subtract c from b
      "form-8611.1.line2_worksheet.d_line_b_minus_c": 1100,
      // Line 2 Worksheet, line f — Multiply d by e
      "form-8611.1.line2_worksheet.f_line_d_times_e": 275,
      // Line 2 Worksheet, line g — Subtract f from d
      "form-8611.1.line2_worksheet.g_line_d_minus_f": 825,
      // Line 2 Worksheet, line i — Multiply g by h. Enter this amount on line 2
      "form-8611.1.line2_worksheet.i_line_g_times_h": 619,
    },
    renderedText: {
      "form-8611.0.header.a_taxpayer_name": "Pedron Ashgrove",
      "form-8611.0.header.b_identifying_number": "400-00-8611",
      "form-8611.0.header.c_building_address": "1420 Juniper Row, Reno, NV 89502",
      "form-8611.0.header.d_building_identification_number": "NV-18-00412",
      "form-8611.0.header.e_date_placed_in_service": "06/15/2018",
      "form-8611.0.header.f1_bond_issuer_name": "Washoe Valley Housing Finance Authority",
      "form-8611.0.header.f2_bond_date_of_issue": "11/01/2017",
      "form-8611.0.header.f3_bond_name_of_issue": "Multifamily Housing Revenue Bonds, Series 2017A",
      "form-8611.0.header.f4_bond_cusip_number": "000861AB1",
      // Year 8 of the compliance period: .333 (line-4::b01).
      "form-8611.0.line.4_credit_recapture_percentage_decimal": "333",
      // (2,400,000 − 1,980,000) / 2,400,000 = .175.
      "form-8611.0.line.6_percentage_decrease_qualified_basis_decimal": "175",
      "form-8611.1.line2_worksheet.e_line_14_decimal_amount": ".250",
      // 9 / 12.
      "form-8611.1.line2_worksheet.h_line_16_divided_by_line_15": ".750",
    },
    renderedBlank: [
      "form-8611.0.line.4_credit_recapture_percentage_whole",
      "form-8611.0.line.6_percentage_decrease_qualified_basis_whole",
      // Lines 1 to 7 are figured: no flow-through amount.
      "form-8611.0.line.8_recapture_from_flow_through_entity",
      // Only a section 42(j)(5) partnership completes lines 16 and 17.
      "form-8611.0.line.16_interest_on_line_7_recapture",
      "form-8611.0.line.17_total_recapture",
    ],
  },
  "schedule-2": {
    engineFields: {
      // Line 16 — Recapture of low-income housing credit. Attach Form 8611
      "schedule-2.0.line.16_recapture_low_income_housing_credit": 2571,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 2571,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 185000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 185000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 185000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 185000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 185000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 169250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 33467,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 33467,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 33467,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 2571,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 36038,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 36000,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 36000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 36000,
      // Line 37 — Amount you owe
      "form-1040.line.37": 38,
    },
  },
};

export function pedronExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
