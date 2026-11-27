/*
 * nildra — LOCKED expected values, drafted from the engine's
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
      "form-8949.0.part1.row1_proceeds": 6200,
      // Row 1 — (e) Cost or other basis
      "form-8949.0.part1.row1_cost_basis": 7000,
      // Row 1 — (h) Gain or (loss)
      "form-8949.0.part1.row1_gain_loss": -800,
      // Line 2 Totals — (d) Proceeds (sales price)
      "form-8949.0.part1.totals_proceeds": 6200,
      // Line 2 Totals — (e) Cost or other basis
      "form-8949.0.part1.totals_cost_basis": 7000,
      // Line 2 Totals — (h) Gain or (loss)
      "form-8949.0.part1.totals_gain_loss": -800,
      // Row 1 — (d) Proceeds (sales price)
      "form-8949.1.part2.row1_proceeds": 40000,
      // Row 1 — (e) Cost or other basis
      "form-8949.1.part2.row1_cost_basis": 30000,
      // Row 1 — (h) Gain or (loss)
      "form-8949.1.part2.row1_gain_loss": 10000,
      // Row 2 — (d) Proceeds (sales price)
      "form-8949.1.part2.row2_proceeds": 12000,
      // Row 2 — (e) Cost or other basis
      "form-8949.1.part2.row2_cost_basis": 20000,
      // Row 2 — (h) Gain or (loss)
      "form-8949.1.part2.row2_gain_loss": -8000,
      // Line 2 Totals — (d) Proceeds (sales price)
      "form-8949.1.part2.totals_proceeds": 52000,
      // Line 2 Totals — (e) Cost or other basis
      "form-8949.1.part2.totals_cost_basis": 50000,
      // Line 2 Totals — (h) Gain or (loss)
      "form-8949.1.part2.totals_gain_loss": 2000,
    },
  },
  "schedule-d": {
    engineFields: {
      // Line 1b — Proceeds (sales price) — Totals for all transactions reported on Form(s) 8949 wi
      "schedule-d.0.line.1b_proceeds": 6200,
      // Line 1b — Cost (or other basis) — Totals for all transactions reported on Form(s) 8949 wit
      "schedule-d.0.line.1b_cost": 7000,
      // Line 1b — Gain or (loss) — Totals for all transactions reported on Form(s) 8949 with Box A
      "schedule-d.0.line.1b_gain_loss": -800,
      // Line 6 — Short-term capital loss carryover
      "schedule-d.0.line.6_short_term_loss_carryover": 2000,
      // Line 7 — Net short-term capital gain or (loss). Combine lines 1a through 6 in column (h)
      "schedule-d.0.line.7_net_short_term_gain_loss": -2800,
      // Line 8b — Proceeds (sales price) — Totals for all transactions reported on Form(s) 8949 wi
      "schedule-d.0.line.8b_proceeds": 52000,
      // Line 8b — Cost (or other basis) — Totals for all transactions reported on Form(s) 8949 wit
      "schedule-d.0.line.8b_cost": 50000,
      // Line 8b — Gain or (loss) — Totals for all transactions reported on Form(s) 8949 with Box D
      "schedule-d.0.line.8b_gain_loss": 2000,
      // Line 13 — Capital gain distributions
      "schedule-d.0.line.13_capital_gain_distributions": 1500,
      // Line 15 — Net long-term capital gain or (loss). Combine lines 8a through 14 in column (h)
      "schedule-d.0.line.15_net_long_term_gain_loss": 3500,
      // Line 16 — Combine lines 7 and 15 and enter the result
      "schedule-d.1.line.16_combined_gain_loss": 700,
    },
  },
  "schedule-b": {
    engineFields: {
      // Line 5 — Amount (row 1)
      "schedule-b.0.line.5_amount_1": 2400,
      // Line 6 — Add the amounts on line 5. Enter the total here and on Form 1040 or 1040-SR, line
      "schedule-b.0.line.6_total_ordinary_dividends": 2400,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 114000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 114000,
      // Line 3a — Qualified dividends
      "form-1040.line.3a": 1800,
      // Line 3b — Ordinary dividends
      "form-1040.line.3b": 2400,
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": 700,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 117100,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 117100,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 117100,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 101350,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 17042,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 17042,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 17042,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 17042,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 13200,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 13200,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 13200,
      // Line 37 — Amount you owe
      "form-1040.line.37": 3842,
    },
  },
  "schedule-d-540nr": {
    engineFields: {
      // Line 1a. (b) Sales price.
      "schedule-d-540nr.0.line.1a.sales_price": 40000,
      // Line 1a. (c) Cost or other basis.
      "schedule-d-540nr.0.line.1a.cost_basis": 30000,
      // Line 1a. (e) Gain. If (b) is more than (c), subtract (c) from (b).
      "schedule-d-540nr.0.line.1a.gain": 10000,
      // Line 1b. (b) Sales price.
      "schedule-d-540nr.0.line.1b.sales_price": 12000,
      // Line 1b. (c) Cost or other basis.
      "schedule-d-540nr.0.line.1b.cost_basis": 26000,
      // Line 1b. (d) Loss. If (c) is more than (b), subtract (b) from (c).
      "schedule-d-540nr.0.line.1b.loss": 14000,
      // Line 1c. (b) Sales price.
      "schedule-d-540nr.0.line.1c.sales_price": 6200,
      // Line 1c. (c) Cost or other basis.
      "schedule-d-540nr.0.line.1c.cost_basis": 7000,
      // Line 1c. (d) Loss. If (c) is more than (b), subtract (b) from (c).
      "schedule-d-540nr.0.line.1c.loss": 800,
      // Line 3. Capital gain distributions (federal Form 1099-DIV, box 2a).
      "schedule-d-540nr.0.line.3": 1500,
      // Line 4. Total 2025 gains from all sources. Add column (e) amounts of line 1, line 2, and l
      "schedule-d-540nr.0.line.4": 11500,
      // Line 5. 2025 loss. Add column (d) amounts of line 1 and line 2.
      "schedule-d-540nr.0.line.5": 14800,
      // Line 6. California capital loss carryover from 2024, if any. See instructions.
      "schedule-d-540nr.0.line.6": 6500,
      // Line 7. Total 2025 loss. Add line 5 and line 6.
      "schedule-d-540nr.0.line.7": 21300,
      // Line 8. Net gain or loss. Combine line 4 and line 7. If a loss, go to line 9. If a gain, g
      "schedule-d-540nr.0.line.8": -9800,
      // Line 9. If line 8 is a loss, enter the smaller of: a the loss on line 8. b $3,000 ($1,500
      "schedule-d-540nr.0.line.9": 3000,
      // Line 10. Enter the gain or (loss) from federal Form 1040 or 1040-SR, line 7a.
      "schedule-d-540nr.0.line.10": 700,
      // Line 11. Enter the California gain from line 8 or (loss) from line 9.
      "schedule-d-540nr.0.line.11": -3000,
      // Line 12a. If line 10 is more than line 11, enter the difference here and on Schedule C A (
      "schedule-d-540nr.0.line.12a": 3700,
    },
  },
  "schedule-ca-540nr": {
    engineFields: {
      // Line 6 . The number of days I spent in California for any purpose was. Yourself: Enter the
      "schedule-ca-540nr.0.part1.6_days_in_ca_yourself": 128,
      // Part Two. Income Adjustment Schedule. Section A. Income from federal Form 1040 or 1040-SR.
      "schedule-ca-540nr.0.line.1a_federal": 114000,
      // Line 1a. Column D. Total Amounts Using California Law As If You Were a California Resident
      "schedule-ca-540nr.0.line.1a_total_ca_law": 114000,
      // Line 1a. Column E. California Amounts (income earned or received as a California resident
      "schedule-ca-540nr.0.line.1a_ca_amounts": 36000,
      // Line 1z. Add line 1a through line 1i. Column A. Federal Amounts.
      "schedule-ca-540nr.0.line.1z_federal": 114000,
      // Line 1z. Column D. Total Amounts Using California Law As If You Were a California Resident
      "schedule-ca-540nr.0.line.1z_total_ca_law": 114000,
      // Line 1z. Column E. California Amounts.
      "schedule-ca-540nr.0.line.1z_ca_amounts": 36000,
      // Line 3 . Ordinary dividends. See instructions. Line 3a. Amount.
      "schedule-ca-540nr.0.line.3a_federal": 1800,
      // Line 3b. Column A. Federal Amounts.
      "schedule-ca-540nr.0.line.3b_federal": 2400,
      // Line 3b. Column D. Total Amounts Using California Law As If You Were a California Resident
      "schedule-ca-540nr.0.line.3b_total_ca_law": 2400,
      // Line 3b. Column E. California Amounts.
      "schedule-ca-540nr.0.line.3b_ca_amounts": 800,
      // Line 7a . Capital gain or (loss). See instructions. Column A. Federal Amounts.
      "schedule-ca-540nr.0.line.7a_federal": 700,
      // Line 7 a . Column B. Subtractions.
      "schedule-ca-540nr.0.line.7a_subtractions": 3700,
      // Line 7a . Column D. Total Amounts Using California Law As If You Were a California Residen
      "schedule-ca-540nr.0.line.7a_total_ca_law": -3000,
      // Line 7a . Column E. California Amounts.
      "schedule-ca-540nr.0.line.7a_ca_amounts": -3000,
      // Line 10 . Total. Add Section A, line 1z through line 7a, and Section B, line 1 through lin
      "schedule-ca-540nr.2.line.b10_federal": 117100,
      // Line 10 . Column B. Subtractions.
      "schedule-ca-540nr.2.line.b10_subtractions": 3700,
      // Line 10 . Column D. Total Amounts Using California Law As If You Were a California Residen
      "schedule-ca-540nr.2.line.b10_total_ca_law": 113400,
      // Line 10 . Column E. California Amounts.
      "schedule-ca-540nr.2.line.b10_ca_amounts": 33800,
      // Line 27. Total. Subtract line 26 from line 10 in each column, A through E. See instruction
      "schedule-ca-540nr.3.line.c27_federal": 117100,
      // Line 27. Column B. Subtractions.
      "schedule-ca-540nr.3.line.c27_subtractions": 3700,
      // Line 27. Column D. Total Amounts Using California Law As If You Were a California Resident
      "schedule-ca-540nr.3.line.c27_total_ca_law": 113400,
      // Line 27. Column E. California Amounts.
      "schedule-ca-540nr.3.line.c27_ca_amounts": 33800,
      // Line 30 . Enter the larger of the amount on line 29 or your standard deduction shown below
      "schedule-ca-540nr.4.part3.30_itemized_or_standard_deduction": 5706,
      // Part Four. California Taxable Income. Line 1 . California Adjusted Gross Income (A G I). E
      "schedule-ca-540nr.4.part4.1_california_agi": 33800,
      // Line 2 . Enter your deductions from line 30 .
      "schedule-ca-540nr.4.part4.2_deductions_from_line_30": 5706,
      // Line 4 . California Itemized/Standard Deductions. Multiply line 2 by the percentage on lin
      "schedule-ca-540nr.4.part4.4_california_deductions_prorated": 1701,
      // Line 5 . California Taxable Income. Subtract line 4 from line 1 . Transfer this amount to
      "schedule-ca-540nr.4.part4.5_california_taxable_income": 32099,
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
      "form-540nr.1.line.12_state_wages": 36000,
      // Line 13. Enter federal adjusted gross income (A G I) from federal Form 1040, 1040-S R, or
      "form-540nr.1.line.13_federal_agi": 117100,
      // Line 14. California adjustments – subtractions. Enter the amount from Schedule CA (540 N R
      "form-540nr.1.line.14_ca_adjustments_subtractions": 3700,
      // Line 15. Subtract line 14 from line 13. If less than zero, enter the result in parentheses
      "form-540nr.1.line.15_agi_before_additions": 113400,
      // Line 17. Adjusted gross income from all sources. Combine line 15 and line 16.
      "form-540nr.1.line.17_agi_all_sources": 113400,
      // Line 18. Enter the larger of: Your California itemized deductions from Schedule CA (540 N
      "form-540nr.1.line.18_deductions": 5706,
      // Line 19. Subtract line 18 from line 17. This is your total taxable income. If less than ze
      "form-540nr.1.line.19_total_taxable_income": 107694,
      // Line 31. Tax amount.
      "form-540nr.1.line.31_tax_amount": 6454,
      // Line 32. California adjusted gross income from Schedule CA (540 N R), Part 4, line 1.
      "form-540nr.1.line.32_ca_agi": 33800,
      // Line 35. California Taxable Income from Schedule CA (540 N R), Part 4, line 5.
      "form-540nr.1.line.35_ca_taxable_income": 32099,
      // Line 37. California Tax Before Exemption Credits. Multiply line 35 by line 36.
      "form-540nr.1.line.37_ca_tax_before_exemption_credits": 1923,
      // Line 39. California Prorated Exemption Credits. Multiply line 11 by line 38. If the amount
      "form-540nr.1.line.39_ca_prorated_exemption_credits": 46,
      // Line 40. California Regular Tax Before Credits. Subtract line 39 from line 37. If less tha
      "form-540nr.1.line.40_ca_regular_tax_before_credits": 1877,
      // Line 42. Add line 40 and line 41.
      "form-540nr.1.line.42_tax_before_special_credits": 1877,
      // Line 63. Subtract line 62 from line 42. If less than zero, enter 0.
      "form-540nr.2.line.63_tax_after_credits": 1877,
      // Line 74. Add line 63, line 71, line 72, and line 73. This is your total tax.
      "form-540nr.2.line.74_total_tax": 1877,
      // Payments. Line 81. California income tax withheld. See instructions.
      "form-540nr.2.line.81_ca_income_tax_withheld": 1400,
      // Line 88. Add line 81 through line 87. These are your total payments. See instructions.
      "form-540nr.2.line.88_total_payments": 1400,
      // Overpaid Tax or Tax Due. Line 92. Payments after Individual Shared Responsibility Penalty.
      "form-540nr.2.line.92_payments_after_isr_penalty": 1400,
      // Line 104. Tax due. If line 92 is less than line 74, subtract line 92 from line 74.
      "form-540nr.3.line.104_tax_due": 477,
      // Amount You Owe. Line 121. AMOUNT YOU OWE. Add line 93, line 104, and line 120. See instruc
      "form-540nr.4.line.121_amount_you_owe": 477,
      // Line 124. Total amount due. See instructions. Enclose, but do not staple, any payment.
      "form-540nr.4.line.124_total_amount_due": 477,
    },
  },
};

export function nildraExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
