/*
 * rhuarc — LOCKED expected values, drafted from the engine's
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
  "form-2106": {
    engineFields: {
      // Line 1, Column A (Other Than Meals) — Vehicle expense from line 22 or line 29
      "form-2106.0.line.1_vehicle_expense_col_a": 2688,
      // Line 2, Column A (Other Than Meals) — Parking fees, tolls, and transportation, including t
      "form-2106.0.line.2_parking_tolls_transportation_col_a": 96,
      // Line 3, Column A (Other Than Meals) — Travel expense while away from home overnight, inclu
      "form-2106.0.line.3_travel_expense_overnight_col_a": 1320,
      // Line 5, Column B (Meals) — Meals expenses
      "form-2106.0.line.5_meals_expenses_col_b": 1680,
      // Line 6, Column A (Other Than Meals) — Total expenses. In Column A, add lines 1 through 4 a
      "form-2106.0.line.6_total_expenses_col_a": 4104,
      // Line 6, Column B (Meals) — Total expenses. In Column B, enter the amount from line 5
      "form-2106.0.line.6_total_expenses_col_b": 1680,
      // Line 7, Column A (Other Than Meals) — Reimbursements received from employer. Include reimb
      "form-2106.0.line.7_employer_reimbursements_col_a": 4400,
      // Line 8, Column B (Meals) — Subtract line 7 from line 6. If zero or less, enter -0-
      "form-2106.0.line.8_expenses_less_reimbursements_col_b": 1680,
      // Line 9, Column B (Meals) — In Column B, see the instructions for the amount to enter
      "form-2106.0.line.9_deductible_amount_col_b": 840,
      // Line 10 — Add the amounts on line 9 for both columns and enter the total here
      "form-2106.0.line.10_total_employee_business_expenses": 840,
      // Line 12 — Total miles the vehicle was driven during 2025, (a) Vehicle 1
      "form-2106.1.line.12_total_miles_driven_col_a": 14000,
      // Line 13 — Business miles included on line 12, (a) Vehicle 1
      "form-2106.1.line.13_business_miles_col_a": 3840,
      // Line 15 — Average daily roundtrip commuting distance, (a) Vehicle 1
      "form-2106.1.line.15_daily_commuting_distance_col_a": 22,
      // Line 16 — Commuting miles included on line 12, (a) Vehicle 1
      "form-2106.1.line.16_commuting_miles_col_a": 5060,
      // Line 17 — Other miles. Add lines 13 and 16 and subtract the total from line 12, (a) Vehicl
      "form-2106.1.line.17_other_miles_col_a": 5100,
      // Line 22 — Multiply line 13 by 70¢ (0.70)
      "form-2106.1.line.22_standard_mileage_rate_amount": 2688,
    },
    // Line 7A (4,400) is more than line 6A (4,104): line 8A is 0 and the 296 excess is on Form 1040 line 1a.
    renderedText: {
      "form-2106.0.header.taxpayer_name": "Rhuarc Delacorte",
      "form-2106.0.header.occupation": "Army Reserve sergeant",
      "form-2106.0.line.8_expenses_less_reimbursements_col_a": "0",
      "form-2106.0.line.9_deductible_amount_col_a": "0",
      "form-2106.1.line.14_percent_business_use_col_a": "27.43",
    },
    renderedChecked: [
      "form-2106.1.line.18_available_personal_use_yes",
      "form-2106.1.line.19_another_vehicle_personal_use_no",
      "form-2106.1.line.20_evidence_support_deduction_yes",
      "form-2106.1.line.21_evidence_written_no",
    ],
    renderedBlank: [
      "form-2106.0.line.4_other_business_expenses_col_a",
      "form-2106.0.line.7_employer_reimbursements_col_b",
      "form-2106.1.line.23_gasoline_oil_repairs_insurance_col_a",
      "form-2106.1.line.29_total_vehicle_expenses_col_a",
      "form-2106.1.line.12_total_miles_driven_col_b",
    ],
  },
  "schedule-1": {
    engineFields: {
      // Line 12 — Certain business expenses of reservists, performing artists, and fee-basis gover
      "schedule-1.1.line.12": 840,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 840,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 65696,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 65696,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 65696,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 840,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 64856,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 64856,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 49106,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 5722,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 5722,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 5722,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 5722,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 4600,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 4600,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 4600,
      // Line 37 — Amount you owe
      "form-1040.line.37": 1122,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Part One. Income Adjustment Schedule. Section A. Income from federal Form 1040 or 1040-SR.
      "schedule-ca.0.line.1a_federal": 65696,
      // Line 1z. Add line 1a through line 1i. Column A. Federal Amounts.
      "schedule-ca.0.line.1z_federal": 65696,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 65696,
      // Line 12. Certain business expenses of reservists, performing artists, and fee-basis govern
      "schedule-ca.2.line.c12_federal": 840,
      // Line 26. Add line 11 through line 23 and line 25 in columns A, B, and C. See instructions.
      "schedule-ca.3.line.c26_federal": 840,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 64856,
      // Line 30. Enter the larger of the amount on line 29 or your standard deduction shown below:
      "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 5706,
    },
    // No Form 2106 depreciation: no column B or C adjustment on line 12.
    renderedBlank: ["schedule-ca.2.line.c12_subtractions", "schedule-ca.2.line.c12_additions"],
  },
  "form-540": {
    engineFields: {
      // Exemptions. For line 7, line 8, line 9, and line 10: Multiply the number you enter in the
      "form-540.line.7_personal_exemption_count": 1,
      // Multiply the number you put in the line 7 box by $153. Enter this number into this field.
      "form-540.line.7_personal_exemption_amount": 153,
      // Line 11. Exemption amount: Add line 7 through line 10. Transfer this amount to line 32. Wh
      "form-540.line.11_total_exemption_amount": 153,
      // Taxable Income. Line 12. State wages from your federal Form or Forms W-2, box 16 .
      "form-540.line.12_state_wages": 65400,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040 or 1040-SR, li
      "form-540.line.13_federal_agi": 64856,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 64856,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 64856,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 59150,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 2112,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 153,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 1959,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 1959,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 1959,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 1959,
      // Payments. Line 71. California income tax withheld. See instructions.
      "form-540.line.71_ca_income_tax_withheld": 2050,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 2050,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 2050,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 2050,
      // Line 97. Overpaid tax. If line 95 is more than line 64, subtract line 64 from line 95.
      "form-540.line.97_overpaid_tax": 91,
      // Line 99. Overpaid tax available this year. Subtract line 98 from line 97.
      "form-540.line.99_overpaid_tax_available": 91,
      // Refund and Direct Deposit. Line 115. Refund or no amount due. Subtract the sum of line 110
      "form-540.line.115_refund_or_no_amount_due": 91,
    },
  },
};

export function rhuarcExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
