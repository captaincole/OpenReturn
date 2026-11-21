/*
 * odessa — LOCKED expected values, drafted from the engine's
 * output on 2026-11-21 (scripts/draftExpected.ts).
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
  "form-8815": {
    engineFields: {
      // Line 2 — Enter the total qualified higher education expenses you paid in 2025 for the pers
      "form-8815.0.line.2_qualified_education_expenses": 18000,
      // Line 3 — Enter the total of any nontaxable educational benefits (such as nontaxable schola
      "form-8815.0.line.3_nontaxable_educational_benefits": 3000,
      // Line 4 — Subtract line 3 from line 2
      "form-8815.0.line.4_net_education_expenses": 15000,
      // Line 5 — Enter the total proceeds (principal and interest) from all series EE and I U.S. s
      "form-8815.0.line.5_total_bond_proceeds": 28010,
      // Line 6 — Enter the interest included on line 5
      "form-8815.0.line.6_bond_interest": 10010,
      // Line 8 — Multiply line 6 by line 7
      "form-8815.0.line.8_interest_times_ratio": 5365,
      // Line 9 — Enter your modified adjusted gross income
      "form-8815.0.line.9_modified_adjusted_gross_income": 168697,
      // Line 10 — Enter $99,500 if single, head of household, or qualifying surviving spouse; $149
      "form-8815.0.line.10_phaseout_threshold": 149250,
      // Line 11 — Subtract line 10 from line 9
      "form-8815.0.line.11_income_over_threshold": 19447,
      // Line 13 — Multiply line 8 by line 12
      "form-8815.0.line.13_phaseout_reduction": 3477,
      // Line 14 — Excludable savings bond interest. Subtract line 13 from line 8
      "form-8815.0.line.14_excludable_bond_interest": 1888,
      // Line 6 Worksheet, line 1 — Enter the amount from Form 8815, line 5
      "form-8815.2.line6_worksheet.1_amount_from_line_5": 28010,
      // Line 6 Worksheet, line 2 — Enter the face value of all post-1989 paper series EE bonds cas
      "form-8815.2.line6_worksheet.2_paper_ee_bonds_face_value": 10000,
      // Line 6 Worksheet, line 3 — Multiply line 2 by 50% (0.50)
      "form-8815.2.line6_worksheet.3_half_of_line_2": 5000,
      // Line 6 Worksheet, line 4 — Enter the face value of all electronic series EE bonds (includi
      "form-8815.2.line6_worksheet.4_electronic_ee_and_i_bonds_face_value": 13000,
      // Line 6 Worksheet, line 5 — Add lines 3 and 4
      "form-8815.2.line6_worksheet.5_add_lines_3_and_4": 18000,
      // Line 6 Worksheet, line 6 — Subtract line 5 from line 1
      "form-8815.2.line6_worksheet.6_line_1_minus_line_5": 10010,
      // Line 9 Worksheet, line 1 — Enter the amount from line 2 of Schedule B (Form 1040)
      "form-8815.3.line.1_worksheet_schedule_b_line_2": 14042,
      // Line 9 Worksheet, line 2 — Add the amounts from Form 1040 or 1040-SR, lines 1z, 3b, 4b, 5b
      "form-8815.3.line.2_worksheet_other_income_total": 154700,
      // Line 9 Worksheet, line 3 — Add lines 1 and 2
      "form-8815.3.line.3_worksheet_add_lines_1_2": 168742,
      // Line 9 Worksheet, line 4 — Enter the total of the amounts from Schedule 1 (Form 1040), lin
      "form-8815.3.line.4_worksheet_schedule_1_adjustments": 45,
      // Line 9 Worksheet, line 5 — Subtract line 4 from line 3
      "form-8815.3.line.5_worksheet_modified_agi": 168697,
    },
    renderedText: {
      "form-8815.0.header.taxpayer_name": "Odessa Lindqvist & Rafael Lindqvist",
      "form-8815.0.header.ssn": "400-00-8815",
      "form-8815.0.line.1_row1_col_a": "Odessa Lindqvist",
      "form-8815.0.line.1_row1_col_b_line1": "University of Nevada, Reno",
      "form-8815.0.line.1_row1_col_b_line2": "1664 N Virginia St, Reno, NV 89557",
      "form-8815.0.line.1_row2_col_a": "Rafael Lindqvist",
      "form-8815.0.line.1_row2_col_b_line1": "Truckee Meadows Community College",
      "form-8815.0.line.1_row3_col_b_line1": "QTP: Silver Basin 529 Plan",
      // Line 7: 15,000 / 28,010 = 0.5355 → .536; line 12: 19,447 / 30,000 = 0.6482 → .648.
      "form-8815.0.line.7_expense_ratio_decimal": "536",
      "form-8815.0.line.12_phaseout_ratio_decimal": "648",
    },
    // Below 1 the digit before the point stays empty; no interest was reported before 2025.
    renderedBlank: [
      "form-8815.0.line.7_expense_ratio_whole",
      "form-8815.0.line.12_phaseout_ratio_whole",
      "form-8815.2.line6_worksheet.7_interest_reported_previous_years",
      "form-8815.2.line6_worksheet.8_line_6_minus_line_7",
    ],
  },
  "schedule-b": {
    engineFields: {
      // Line 1 — Amount (row 1)
      "schedule-b.0.line.1_amount_1": 9452,
      // Line 1 — Amount (row 2)
      "schedule-b.0.line.1_amount_2": 4590,
      // Line 2 — Add the amounts on line 1
      "schedule-b.0.line.2_total_interest": 14042,
      // Line 3 — Excludable interest on series EE and I U.S. savings bonds issued after 1989. Atta
      "schedule-b.0.line.3_excludable_savings_bond_interest": 1888,
      // Line 4 — Subtract line 3 from line 2. Enter the result here and on Form 1040 or 1040-SR, l
      "schedule-b.0.line.4_taxable_interest": 12154,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 18 — Penalty on early withdrawal of savings
      "schedule-1.1.line.18": 45,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 45,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 154700,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 154700,
      // Line 2b — Taxable interest
      "form-1040.line.2b": 12154,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 166854,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 45,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 166809,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 166809,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 31500,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 31500,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 135309,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 19596,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 19596,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 19596,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 19596,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 17800,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 17800,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 17800,
      // Line 37 — Amount you owe
      "form-1040.line.37": 1796,
    },
  },
};

export function odessaExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
