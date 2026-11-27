/*
 * ellorien — LOCKED expected values, drafted from the engine's
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
  /*
   * Copy 1 is Tobin's release (Parts I and II, from the signed form Davin
   * gave Ellorien). Copy 2, Senna's revocation (Part III), is in the golden PDF
   * and in tests/unit/federal/8332/form.test.ts.
   */
  "form-8332": {
    renderedText: {
      "form-8332.0.header.noncustodial_parent_name": "Ellorien Tarvale",
      "form-8332.0.header.noncustodial_parent_ssn": "400-00-8332",
      "form-8332.0.part1.child_name": "Tobin Tarvale",
      "form-8332.0.part1.tax_year": "25",
      "form-8332.0.part1.custodial_parent_ssn": "400-00-8333",
      "form-8332.0.part2.child_name": "Tobin Tarvale",
      "form-8332.0.part2.future_tax_years": "2026 and 2027",
      "form-8332.0.part2.custodial_parent_ssn": "400-00-8333",
    },
    renderedBlank: [
      "form-8332.0.part3.child_name",
      "form-8332.0.part3.revoked_tax_years",
      "form-8332.0.part3.custodial_parent_ssn",
    ],
  },
  "schedule-8812": {
    engineFields: {
      // Line 1 — Enter the amount from line 11a of your Form 1040, 1040-SR, or 1040-NR
      "schedule-8812.0.line.1_form_1040_line_11a": 38000,
      // Line 3 — Add lines 1 and 2d
      "schedule-8812.0.line.3_modified_agi": 38000,
      // Line 4 — Number of qualifying children under age 17 with the required social security numb
      "schedule-8812.0.line.4_qualifying_children_under_17": 2,
      // Line 5 — Multiply line 4 by $2,200
      "schedule-8812.0.line.5_qualifying_children_times_2200": 4400,
      // Line 8 — Add lines 5 and 7
      "schedule-8812.0.line.8_total_credit_before_limit": 4400,
      // Line 9 — Enter the amount shown below for your filing status. Married filing jointly—$400,
      "schedule-8812.0.line.9_filing_status_threshold": 200000,
      // Line 12 — Is the amount on line 8 more than the amount on line 11? Yes. Subtract line 11 f
      "schedule-8812.0.line.12_credit_after_phaseout": 4400,
      // Line 13 — Enter the amount from Credit Limit Worksheet A
      "schedule-8812.0.line.13_credit_limit_worksheet_a": 1438,
      // Line 14 — Enter the smaller of line 12 or line 13. This is your child tax credit and credi
      "schedule-8812.0.line.14_child_tax_credit_and_other_dependents": 1438,
      // Line 16a — Subtract line 14 from line 12. If zero, stop here; you cannot take the addition
      "schedule-8812.1.line.16a_line12_minus_line14": 2962,
      // Line 16b — Number of qualifying children under age 17 with the required social security nu
      "schedule-8812.1.line.16b_qualifying_children_count": 2,
      // Line 16b — Number of qualifying children under age 17 with the required social security nu
      "schedule-8812.1.line.16b_qualifying_children_times_1700": 3400,
      // Line 17 — Enter the smaller of line 16a or line 16b
      "schedule-8812.1.line.17_smaller_of_16a_16b": 2962,
      // Line 18a — Earned income (see instructions)
      "schedule-8812.1.line.18a_earned_income": 38000,
      // Line 19 — Is the amount on line 18a more than $2,500? Yes. Subtract $2,500 from the amount
      "schedule-8812.1.line.19_earned_income_over_2500": 35500,
      // Line 20 — Multiply the amount on line 19 by 15% (0.15) and enter the result
      "schedule-8812.1.line.20_line19_times_15_percent": 5325,
      // Line 27 — This is your additional child tax credit. Enter this amount on Form 1040, 1040-S
      "schedule-8812.1.line.27_additional_child_tax_credit": 2962,
    },
  },
  "schedule-eic": {
    engineFields: {
      // Line 6 — Number of months child lived with you in the United States during 2025, Child 1
      "schedule-eic.0.line.6_months_lived_in_us_child_1": 12,
      // Line 6 — Number of months child lived with you in the United States during 2025, Child 2
      "schedule-eic.0.line.6_months_lived_in_us_child_2": 12,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 38000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 38000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 38000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 38000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 38000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 23625,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 23625,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 14375,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 1438,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 1438,
      // Line 19 — Child tax credit or credit for other dependents from Schedule 8812
      "form-1040.line.19": 1438,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 1438,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 1200,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 1200,
      // Line 27a — Earned income credit (EIC)
      "form-1040.line.27a": 4061,
      // Line 28 — Additional child tax credit (ACTC) from Schedule 8812
      "form-1040.line.28": 2962,
      // Line 32 — Add lines 27a, 28, 29, 30, and 31. Total other payments and refundable credits
      "form-1040.line.32": 7023,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 8223,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 8223,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 8223,
    },
    /*
     * Mira, released to Davin, is the head of household child and not a
     * dependent: her name goes in the entry space, and the Dependents table
     * lists only Tobin and Senna.
     */
    renderedText: {
      "form-1040.header.hoh_qss_qualifying_child_name": "Mira Tarvale",
      "form-1040.dependents.dep1_first_name": "Tobin",
      "form-1040.dependents.dep2_first_name": "Senna",
    },
    renderedBlank: ["form-1040.dependents.dep3_first_name"],
    renderedChecked: [
      "form-1040.dependents.dep1_child_tax_credit",
      "form-1040.dependents.dep2_child_tax_credit",
    ],
  },
};

export function ellorienExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
