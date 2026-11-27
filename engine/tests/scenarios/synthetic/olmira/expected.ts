/*
 * olmira — LOCKED expected values, drafted from the engine's
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
  "form-8949": {
    engineFields: {
      // Row 1 — (d) Proceeds (sales price)
      "form-8949.1.part2.row1_proceeds": 50000,
      // Row 1 — (e) Cost or other basis
      "form-8949.1.part2.row1_cost_basis": 35000,
      // Row 1 — (h) Gain or (loss)
      "form-8949.1.part2.row1_gain_loss": 15000,
      // Row 2 — (d) Proceeds (sales price)
      "form-8949.1.part2.row2_proceeds": 5000,
      // Row 2 — (e) Cost or other basis
      "form-8949.1.part2.row2_cost_basis": 6000,
      // Row 2 — (h) Gain or (loss)
      "form-8949.1.part2.row2_gain_loss": -1000,
      // Line 2 Totals — (d) Proceeds (sales price)
      "form-8949.1.part2.totals_proceeds": 55000,
      // Line 2 Totals — (e) Cost or other basis
      "form-8949.1.part2.totals_cost_basis": 41000,
      // Line 2 Totals — (h) Gain or (loss)
      "form-8949.1.part2.totals_gain_loss": 14000,
    },
  },
  "schedule-d": {
    engineFields: {
      // Line 8b — Proceeds (sales price) — Totals for all transactions reported on Form(s) 8949 wi
      "schedule-d.0.line.8b_proceeds": 55000,
      // Line 8b — Cost (or other basis) — Totals for all transactions reported on Form(s) 8949 wit
      "schedule-d.0.line.8b_cost": 41000,
      // Line 8b — Gain or (loss) — Totals for all transactions reported on Form(s) 8949 with Box D
      "schedule-d.0.line.8b_gain_loss": 14000,
      // Line 13 — Capital gain distributions
      "schedule-d.0.line.13_capital_gain_distributions": 800,
      // Line 15 — Net long-term capital gain or (loss). Combine lines 8a through 14 in column (h)
      "schedule-d.0.line.15_net_long_term_gain_loss": 14800,
      // Line 16 — Combine lines 7 and 15 and enter the result
      "schedule-d.1.line.16_combined_gain_loss": 14800,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 90000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 90000,
      // Line 3a — Qualified dividends
      "form-1040.line.3a": 600,
      // Line 3b — Ordinary dividends
      "form-1040.line.3b": 1000,
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": 14800,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 105800,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 105800,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 105800,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 90050,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 13653,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 13653,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 13653,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 13653,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 10800,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 10800,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 10800,
      // Line 37 — Amount you owe
      "form-1040.line.37": 2853,
    },
  },
  "schedule-d-540nr": {
    engineFields: {
      // Line 1a. (b) Sales price.
      "schedule-d-540nr.0.line.1a.sales_price": 50000,
      // Line 1a. (c) Cost or other basis.
      "schedule-d-540nr.0.line.1a.cost_basis": 28000,
      // Line 1a. (e) Gain. If (b) is more than (c), subtract (c) from (b).
      "schedule-d-540nr.0.line.1a.gain": 22000,
      // Line 1b. (b) Sales price.
      "schedule-d-540nr.0.line.1b.sales_price": 5000,
      // Line 1b. (c) Cost or other basis.
      "schedule-d-540nr.0.line.1b.cost_basis": 6000,
      // Line 1b. (d) Loss. If (c) is more than (b), subtract (b) from (c).
      "schedule-d-540nr.0.line.1b.loss": 1000,
      // Line 3. Capital gain distributions (federal Form 1099-DIV, box 2a).
      "schedule-d-540nr.0.line.3": 800,
      // Line 4. Total 2025 gains from all sources. Add column (e) amounts of line 1, line 2, and l
      "schedule-d-540nr.0.line.4": 22800,
      // Line 5. 2025 loss. Add column (d) amounts of line 1 and line 2.
      "schedule-d-540nr.0.line.5": 1000,
      // Line 7. Total 2025 loss. Add line 5 and line 6.
      "schedule-d-540nr.0.line.7": 1000,
      // Line 8. Net gain or loss. Combine line 4 and line 7. If a loss, go to line 9. If a gain, g
      "schedule-d-540nr.0.line.8": 21800,
      // Line 10. Enter the gain or (loss) from federal Form 1040 or 1040-SR, line 7a.
      "schedule-d-540nr.0.line.10": 14800,
      // Line 11. Enter the California gain from line 8 or (loss) from line 9.
      "schedule-d-540nr.0.line.11": 21800,
      // Line 12b. If line 10 is less than line 11, enter the difference here and on Schedule C A (
      "schedule-d-540nr.0.line.12b": 7000,
    },
  },
  "schedule-ca-540nr": {
    engineFields: {
      // Line 6 . The number of days I spent in California for any purpose was. Yourself: Enter the
      "schedule-ca-540nr.0.part1.6_days_in_ca_yourself": 60,
      // Part Two. Income Adjustment Schedule. Section A. Income from federal Form 1040 or 1040-SR.
      "schedule-ca-540nr.0.line.1a_federal": 90000,
      // Line 1a. Column D. Total Amounts Using California Law As If You Were a California Resident
      "schedule-ca-540nr.0.line.1a_total_ca_law": 90000,
      // Line 1a. Column E. California Amounts (income earned or received as a California resident
      "schedule-ca-540nr.0.line.1a_ca_amounts": 22500,
      // Line 1z. Add line 1a through line 1i. Column A. Federal Amounts.
      "schedule-ca-540nr.0.line.1z_federal": 90000,
      // Line 1z. Column D. Total Amounts Using California Law As If You Were a California Resident
      "schedule-ca-540nr.0.line.1z_total_ca_law": 90000,
      // Line 1z. Column E. California Amounts.
      "schedule-ca-540nr.0.line.1z_ca_amounts": 22500,
      // Line 3 . Ordinary dividends. See instructions. Line 3a. Amount.
      "schedule-ca-540nr.0.line.3a_federal": 600,
      // Line 3b. Column A. Federal Amounts.
      "schedule-ca-540nr.0.line.3b_federal": 1000,
      // Line 3b. Column D. Total Amounts Using California Law As If You Were a California Resident
      "schedule-ca-540nr.0.line.3b_total_ca_law": 1000,
      // Line 7a . Capital gain or (loss). See instructions. Column A. Federal Amounts.
      "schedule-ca-540nr.0.line.7a_federal": 14800,
      // Line 7a. Column C. Additions.
      "schedule-ca-540nr.0.line.7a_additions": 7000,
      // Line 7a . Column D. Total Amounts Using California Law As If You Were a California Residen
      "schedule-ca-540nr.0.line.7a_total_ca_law": 21800,
      // Line 10 . Total. Add Section A, line 1z through line 7a, and Section B, line 1 through lin
      "schedule-ca-540nr.2.line.b10_federal": 105800,
      // Line 10 . Column C. Additions.
      "schedule-ca-540nr.2.line.b10_additions": 7000,
      // Line 10 . Column D. Total Amounts Using California Law As If You Were a California Residen
      "schedule-ca-540nr.2.line.b10_total_ca_law": 112800,
      // Line 10 . Column E. California Amounts.
      "schedule-ca-540nr.2.line.b10_ca_amounts": 22500,
      // Line 27. Total. Subtract line 26 from line 10 in each column, A through E. See instruction
      "schedule-ca-540nr.3.line.c27_federal": 105800,
      // Line 27. Column C. Additions.
      "schedule-ca-540nr.3.line.c27_additions": 7000,
      // Line 27. Column D. Total Amounts Using California Law As If You Were a California Resident
      "schedule-ca-540nr.3.line.c27_total_ca_law": 112800,
      // Line 27. Column E. California Amounts.
      "schedule-ca-540nr.3.line.c27_ca_amounts": 22500,
      // Line 30 . Enter the larger of the amount on line 29 or your standard deduction shown below
      "schedule-ca-540nr.4.part3.30_itemized_or_standard_deduction": 5706,
      // Part Four. California Taxable Income. Line 1 . California Adjusted Gross Income (A G I). E
      "schedule-ca-540nr.4.part4.1_california_agi": 22500,
      // Line 2 . Enter your deductions from line 30 .
      "schedule-ca-540nr.4.part4.2_deductions_from_line_30": 5706,
      // Line 4 . California Itemized/Standard Deductions. Multiply line 2 by the percentage on lin
      "schedule-ca-540nr.4.part4.4_california_deductions_prorated": 1138,
      // Line 5 . California Taxable Income. Subtract line 4 from line 1 . Transfer this amount to
      "schedule-ca-540nr.4.part4.5_california_taxable_income": 21362,
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
      "form-540nr.1.line.12_state_wages": 22500,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040, 1040-S R, or
      "form-540nr.1.line.13_federal_agi": 105800,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540nr.1.line.15_agi_before_additions": 105800,
      // Line 16. California adjustments – additions. Enter the amount from Schedule CA (540 N R),
      "form-540nr.1.line.16_ca_adjustments_additions": 7000,
      // Line 17. Adjusted gross income from all sources. Combine line 15 and line 16.
      "form-540nr.1.line.17_agi_all_sources": 112800,
      // Line 18. Enter the larger of: Your California itemized deductions from Schedule CA (540 N
      "form-540nr.1.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your total taxable income. If less than ze
      "form-540nr.1.line.19_total_taxable_income": 107094,
      // Line 31. Tax amount.
      "form-540nr.1.line.31_tax_amount": 6398,
      // Line 32. California adjusted gross income from Schedule CA (540 N R), Part 4, line 1.
      "form-540nr.1.line.32_ca_agi": 22500,
      // Line 35. California Taxable Income from Schedule CA (540 N R), Part 4, line 5.
      "form-540nr.1.line.35_ca_taxable_income": 21362,
      // Line 37. California Tax Before Exemption Credits. Multiply line 35 by line 36.
      "form-540nr.1.line.37_ca_tax_before_exemption_credits": 1275,
      // Line 39. California Prorated Exemption Credits. Multiply line 11 by line 38. If the amount
      "form-540nr.1.line.39_ca_prorated_exemption_credits": 31,
      // Line 40. California Regular Tax Before Credits. Subtract line 39 from line 37. If less tha
      "form-540nr.1.line.40_ca_regular_tax_before_credits": 1244,
      // Line 42. Add line 40 and line 41.
      "form-540nr.1.line.42_tax_before_special_credits": 1244,
      // Line 63. Subtract line 62 from line 42. If less than zero, enter 0.
      "form-540nr.2.line.63_tax_after_credits": 1244,
      // Line 74. Add line 63, line 71, line 72, and line 73. This is your total tax.
      "form-540nr.2.line.74_total_tax": 1244,
      // Payments. Line 81. California income tax withheld. See instructions.
      "form-540nr.2.line.81_ca_income_tax_withheld": 700,
      // Line 88. Add line 81 through line 87. These are your total payments. See instructions.
      "form-540nr.2.line.88_total_payments": 700,
      // Overpaid Tax or Tax Due. Line 92. Payments after Individual Shared Responsibility Penalty.
      "form-540nr.2.line.92_payments_after_isr_penalty": 700,
      // Line 104. Tax due. If line 92 is less than line 74, subtract line 92 from line 74.
      "form-540nr.3.line.104_tax_due": 544,
      // Amount You Owe. Line 121. AMOUNT YOU OWE. Add line 93, line 104, and line 120. See instruc
      "form-540nr.4.line.121_amount_you_owe": 544,
      // Line 124. Total amount due. See instructions. Enclose, but do not staple, any payment.
      "form-540nr.4.line.124_total_amount_due": 544,
    },
  },
};

export function olmiraExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
