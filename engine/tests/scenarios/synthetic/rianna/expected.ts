/*
 * rianna — LOCKED expected values, drafted from the engine's
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
  "form-8582": {
    engineFields: {
      // Line 1a — Rental real estate activities with active participation: activities with net inc
      "form-8582.0.line.1a_rental_net_income": 15410,
      // Line 1d — Combine lines 1a, 1b, and 1c
      "form-8582.0.line.1d_rental_combined": 15410,
      // Line 3 — Combine lines 1d and 2d and subtract any prior year unallowed CRD
      "form-8582.0.line.3_combined": 15410,
      // Part IV Row 1 — (a) Current year net income (line 1a)
      "form-8582.0.part4.row_1_col_a_net_income": 15410,
      // Part IV Row 1 — (d) Overall gain
      "form-8582.0.part4.row_1_col_d_gain": 15410,
      // Part IV Total — (a) Current year net income (line 1a)
      "form-8582.0.part4.total_col_a_net_income": 15410,
    },
  },
  "schedule-e": {
    engineFields: {
      // Line 2 — Fair Rental Days (Property A)
      "schedule-e.0.line.2_fair_rental_days_a": 365,
      // Line 3 — Rents received (Property A)
      "schedule-e.0.line.3_rents_received_a": 33600,
      // Line 9 — Insurance (Property A)
      "schedule-e.0.line.9_insurance_a": 1450,
      // Line 11 — Management fees (Property A)
      "schedule-e.0.line.11_management_fees_a": 2690,
      // Line 14 — Repairs (Property A)
      "schedule-e.0.line.14_repairs_a": 2150,
      // Line 16 — Taxes (Property A)
      "schedule-e.0.line.16_taxes_a": 4300,
      // Line 18 — Depreciation expense or depletion (Property A)
      "schedule-e.0.line.18_depreciation_or_depletion_a": 7600,
      // Line 20 — Total expenses. Add lines 5 through 19 (Property A)
      "schedule-e.0.line.20_total_expenses_a": 18190,
      // Line 21 — Subtract line 20 from line 3 (rents) and/or 4 (royalties) (Property A)
      "schedule-e.0.line.21_income_or_loss_a": 15410,
      // Line 23a — Total of all amounts reported on line 3 for all rental properties
      "schedule-e.0.line.23a_total_rents": 33600,
      // Line 23d — Total of all amounts reported on line 18 for all properties
      "schedule-e.0.line.23d_total_depreciation": 7600,
      // Line 23e — Total of all amounts reported on line 20 for all properties
      "schedule-e.0.line.23e_total_expenses": 18190,
      // Line 24 — Income. Add positive amounts shown on line 21. Do not include any losses
      "schedule-e.0.line.24_income": 15410,
      // Line 26 — Total rental real estate and royalty income or (loss). Combine lines 24 and 25
      "schedule-e.0.line.26_total_income_or_loss": 15410,
      // Line 41 — Total income or (loss). Combine lines 26, 32, 37, 39, and 40
      "schedule-e.1.line.41_total_income_or_loss": 15410,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 5 — Rental real estate, royalties, partnerships, S corporations, trusts, etc. Attach
      "schedule-1.0.line.5": 15410,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 15410,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 142000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 142000,
      // Line 2b — Taxable interest
      "form-1040.line.2b": 900,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 15410,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 158310,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 158310,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 158310,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 142560,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 27061,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 27061,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 27061,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 27061,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 19400,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 19400,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 19400,
      // Line 37 — Amount you owe
      "form-1040.line.37": 7661,
    },
  },
  "schedule-ca-540nr": {
    engineFields: {
      // Line 6 . The number of days I spent in California for any purpose was. Yourself: Enter the
      "schedule-ca-540nr.0.part1.6_days_in_ca_yourself": 58,
      // Part Two. Income Adjustment Schedule. Section A. Income from federal Form 1040 or 1040-SR.
      "schedule-ca-540nr.0.line.1a_federal": 142000,
      // Line 1a. Column D. Total Amounts Using California Law As If You Were a California Resident
      "schedule-ca-540nr.0.line.1a_total_ca_law": 142000,
      // Line 1a. Column E. California Amounts (income earned or received as a California resident
      "schedule-ca-540nr.0.line.1a_ca_amounts": 29600,
      // Line 1z. Add line 1a through line 1i. Column A. Federal Amounts.
      "schedule-ca-540nr.0.line.1z_federal": 142000,
      // Line 1z. Column D. Total Amounts Using California Law As If You Were a California Resident
      "schedule-ca-540nr.0.line.1z_total_ca_law": 142000,
      // Line 1z. Column E. California Amounts.
      "schedule-ca-540nr.0.line.1z_ca_amounts": 29600,
      // Line 2b. Column A. Federal Amounts.
      "schedule-ca-540nr.0.line.2b_federal": 900,
      // Line 2b. Column D. Total Amounts Using California Law As If You Were a California Resident
      "schedule-ca-540nr.0.line.2b_total_ca_law": 900,
      // Line 5. Rental real estate, royalties, partnerships, S corporations, trusts, etcetera. Col
      "schedule-ca-540nr.1.line.b5_federal": 15410,
      // Line 5. Column D. Total Amounts Using California Law As If You Were a California Resident.
      "schedule-ca-540nr.1.line.b5_total_ca_law": 15410,
      // Line 5. Column E. California Amounts.
      "schedule-ca-540nr.1.line.b5_ca_amounts": 15410,
      // Line 10 . Total. Add Section A, line 1z through line 7a, and Section B, line 1 through lin
      "schedule-ca-540nr.2.line.b10_federal": 158310,
      // Line 10 . Column D. Total Amounts Using California Law As If You Were a California Residen
      "schedule-ca-540nr.2.line.b10_total_ca_law": 158310,
      // Line 10 . Column E. California Amounts.
      "schedule-ca-540nr.2.line.b10_ca_amounts": 45010,
      // Line 27. Total. Subtract line 26 from line 10 in each column, A through E. See instruction
      "schedule-ca-540nr.3.line.c27_federal": 158310,
      // Line 27. Column D. Total Amounts Using California Law As If You Were a California Resident
      "schedule-ca-540nr.3.line.c27_total_ca_law": 158310,
      // Line 27. Column E. California Amounts.
      "schedule-ca-540nr.3.line.c27_ca_amounts": 45010,
      // Line 30 . Enter the larger of the amount on line 29 or your standard deduction shown below
      "schedule-ca-540nr.4.part3.30_itemized_or_standard_deduction": 5706,
      // Part Four. California Taxable Income. Line 1 . California Adjusted Gross Income (A G I). E
      "schedule-ca-540nr.4.part4.1_california_agi": 45010,
      // Line 2 . Enter your deductions from line 30 .
      "schedule-ca-540nr.4.part4.2_deductions_from_line_30": 5706,
      // Line 4 . California Itemized/Standard Deductions. Multiply line 2 by the percentage on lin
      "schedule-ca-540nr.4.part4.4_california_deductions_prorated": 1622,
      // Line 5 . California Taxable Income. Subtract line 4 from line 1 . Transfer this amount to
      "schedule-ca-540nr.4.part4.5_california_taxable_income": 43388,
    },
  },
  "form-540nr": {
    engineFields: {
      // Exemptions. Line 7. Personal: If you checked box 1, 3, or 4 above, enter 1 in the box. If
      "form-540nr.0.line.7_personal_exemption_count": 1,
      // Multiply the number you put in the line 7 box by $153. Enter this number into this field.
      "form-540nr.0.line.7_personal_exemption_amount": 153,
      // Line 11. Exemption amount: Add line 7 through line 10.
      "form-540nr.1.line.11_total_exemption_amount": 153,
      // Total Taxable Income. Line 12. Total California wages from your federal Form or Forms W-2,
      "form-540nr.1.line.12_state_wages": 29600,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040, 1040-S R, or
      "form-540nr.1.line.13_federal_agi": 158310,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540nr.1.line.15_agi_before_additions": 158310,
      // Line 17. Adjusted gross income from all sources. Combine line 15 and line 16.
      "form-540nr.1.line.17_agi_all_sources": 158310,
      // Line 18. Enter the larger of: Your California itemized deductions from Schedule CA (540 N
      "form-540nr.1.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your total taxable income. If less than ze
      "form-540nr.1.line.19_total_taxable_income": 152604,
      // Line 31. Tax amount.
      "form-540nr.1.line.31_tax_amount": 10631,
      // Line 32. California adjusted gross income from Schedule CA (540 N R), Part 4, line 1.
      "form-540nr.1.line.32_ca_agi": 45010,
      // Line 35. California Taxable Income from Schedule CA (540 N R), Part 4, line 5.
      "form-540nr.1.line.35_ca_taxable_income": 43388,
      // Line 37. California Tax Before Exemption Credits. Multiply line 35 by line 36.
      "form-540nr.1.line.37_ca_tax_before_exemption_credits": 3024,
      // Line 39. California Prorated Exemption Credits. Multiply line 11 by line 38. If the amount
      "form-540nr.1.line.39_ca_prorated_exemption_credits": 44,
      // Line 40. California Regular Tax Before Credits. Subtract line 39 from line 37. If less tha
      "form-540nr.1.line.40_ca_regular_tax_before_credits": 2980,
      // Line 42. Add line 40 and line 41.
      "form-540nr.1.line.42_tax_before_special_credits": 2980,
      // Line 63. Subtract line 62 from line 42. If less than zero, enter 0.
      "form-540nr.2.line.63_tax_after_credits": 2980,
      // Line 74. Add line 63, line 71, line 72, and line 73. This is your total tax.
      "form-540nr.2.line.74_total_tax": 2980,
      // Payments. Line 81. California income tax withheld. See instructions.
      "form-540nr.2.line.81_ca_income_tax_withheld": 1180,
      // Line 88. Add line 81 through line 87. These are your total payments. See instructions.
      "form-540nr.2.line.88_total_payments": 1180,
      // Overpaid Tax or Tax Due. Line 92. Payments after Individual Shared Responsibility Penalty.
      "form-540nr.2.line.92_payments_after_isr_penalty": 1180,
      // Line 104. Tax due. If line 92 is less than line 74, subtract line 92 from line 74.
      "form-540nr.3.line.104_tax_due": 1800,
      // Amount You Owe. Line 121. AMOUNT YOU OWE. Add line 93, line 104, and line 120. See instruc
      "form-540nr.4.line.121_amount_you_owe": 1800,
      // Line 124. Total amount due. See instructions. Enclose, but do not staple, any payment.
      "form-540nr.4.line.124_total_amount_due": 1800,
    },
  },
};

export function riannaExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
