/*
 * loial — LOCKED expected values, drafted from the engine's
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
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 96400,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 96400,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 96400,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 96400,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 96400,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 80650,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 12663,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 12663,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 12663,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 12663,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 9800,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 9800,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 9800,
      // Line 37 — Amount you owe
      "form-1040.line.37": 2863,
    },
  },
  "schedule-ca": {
    engineFields: {
      // Part One. Income Adjustment Schedule. Section A. Income from federal Form 1040 or 1040-SR.
      "schedule-ca.0.line.1a_federal": 96400,
      // Line 1z. Add line 1a through line 1i. Column A. Federal Amounts.
      "schedule-ca.0.line.1z_federal": 96400,
      // Line 10. Total. Add Section A, line 1z through line 7a, and Section B, line 1 through line
      "schedule-ca.2.line.b10_federal": 96400,
      // Line 14. Moving expenses. Attach form FTB 3913. See instructions. Column C. Additions.
      "schedule-ca.2.line.c14_additions": 7577,
      // Line 26. Column C. Additions.
      "schedule-ca.3.line.c26_additions": 7577,
      // Line 27. Total. Subtract line 26 from line 10 in columns A, B, and C. See instructions. Co
      "schedule-ca.3.line.c27_federal": 96400,
      // Line 27. Column C. Additions.
      "schedule-ca.3.line.c27_additions": -7577,
      // Line 30. Enter the larger of the amount on line 29 or your standard deduction shown below:
      "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 5706,
    },
  },
  "form-3913": {
    engineFields: {
      // Line 1. Transportation and storage of household goods and personal effects. See instructio
      "form-3913.0.line.1_transportation_storage_household_goods": 7258,
      // Line 2. Travel (including lodging) from your old home to your new home. Do not include the
      "form-3913.0.line.2_travel_and_lodging": 319,
      // Line 3. Add line 1 and line 2
      "form-3913.0.line.3_total_moving_expenses": 7577,
      // Line 4 — a verified 0: the relocation bonus is in W-2 box 1
      "form-3913.0.line.4_employer_paid_not_in_wages": 0,
      // Line 5. Is line 3 more than line 4?.
      "form-3913.0.line.5_moving_expense_deduction": 7577,
    },
    renderedText: {
      "form-3913.0.header.names_on_return": "Loial Fennimore",
      "form-3913.0.header.ssn_or_itin": "400003913",
    },
    // Not a military member; line 3 (7,577) is more than line 4 (0): Yes.
    renderedChecked: [
      "form-3913.0.header.military_member",
      "form-3913.0.line.5_line_3_more_than_line_4",
    ],
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
      "form-540.line.12_state_wages": 96400,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040 or 1040-SR, li
      "form-540.line.13_federal_agi": 96400,
      // Line 14. California adjustments – subtractions. Enter the amount from Schedule CA (540), P
      "form-540.line.14_ca_adjustments_subtractions": 7577,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540.line.15_ca_agi_before_additions": 88823,
      // Line 17. California adjusted gross income. Combine line 15 and line 16.
      "form-540.line.17_ca_agi": 88823,
      // Line 18. Enter the larger of your California itemized deductions from Schedule CA (540), P
      "form-540.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your taxable income. If less than zero, en
      "form-540.line.19_taxable_income": 83117,
      // Line 31. Tax amount.
      "form-540.line.31_tax_amount": 4167,
      // Line 32. Exemption credits. Enter the amount from line 11. If your federal adjusted gross
      "form-540.line.32_exemption_credits": 153,
      // Line 33. Subtract line 32 from line 31. If less than zero, enter 0.
      "form-540.line.33_tax_after_exemption_credits": 4014,
      // Line 35. Add line 33 and line 34.
      "form-540.line.35_total_tax_after_credits": 4014,
      // Line 48. Subtract line 47 from line 35. If less than zero, enter 0.
      "form-540.line.48_tax_after_credits": 4014,
      // Line 64. Add line 48, line 61, line 62, and line 63. This is your total tax.
      "form-540.line.64_total_tax": 4014,
      // Payments. Line 71. California income tax withheld. See instructions.
      "form-540.line.71_ca_income_tax_withheld": 3900,
      // Line 78. Add line 71 through line 77. These are your total payments. See instructions.
      "form-540.line.78_total_payments": 3900,
      // Overpaid Tax or Tax Due. Line 93 Payments balance. If line 78 is more than line 91, subtra
      "form-540.line.93_payments_balance": 3900,
      // Line 95. Payments after Individual Shared Responsibility penalty. If line 93 is more than
      "form-540.line.95_payments_after_isr_penalty": 3900,
      // Line 100. Tax due. If line 95 is less than line 64, subtract line 95 from line 64.
      "form-540.line.100_tax_due": 114,
      // Amount You Owe. Line 111. Amount You Owe. If you do not have an amount on line 99, add lin
      "form-540.line.111_amount_you_owe": 114,
      // Line 114. Total amount due. See instructions. Enclose, but do not staple, any payment.
      "form-540.line.114_total_amount_due": 114,
    },
  },
};

export function loialExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
