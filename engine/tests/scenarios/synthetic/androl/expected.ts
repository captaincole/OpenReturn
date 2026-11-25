/*
 * androl — LOCKED expected values, drafted from the engine's
 * output on 2026-11-25 (scripts/draftExpected.ts).
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
  "schedule-d": {
    engineFields: {
      // Line 14 — Long-term capital loss carryover
      "schedule-d.0.line.14_long_term_loss_carryover": 20000,
      // Line 15 — Net long-term capital gain or (loss). Combine lines 8a through 14 in column (h)
      "schedule-d.0.line.15_net_long_term_gain_loss": -20000,
      // Line 16 — Combine lines 7 and 15 and enter the result
      "schedule-d.1.line.16_combined_gain_loss": -20000,
      // Line 21 — If line 16 is a loss, enter here and on Form 1040, 1040-SR, or 1040-NR, line 7a,
      "schedule-d.1.line.21_allowable_loss": 3000,
    },
  },
  "schedule-e": {
    engineFields: {
      // Line 28 row A — (i) Nonpassive loss allowed (see Schedule K-1)
      "schedule-e.1.line.28_row_a_col_i_nonpassive_loss_allowed": 400000,
      // Line 29b — Totals, column (i) nonpassive loss allowed
      "schedule-e.1.line.29b_totals_col_i": 400000,
      // Line 31 — Add columns (g), (i), and (j) of line 29b
      "schedule-e.1.line.31_add_loss_columns": 400000,
      // Line 32 — Total partnership and S corporation income or (loss). Combine lines 30 and 31
      "schedule-e.1.line.32_total_partnership_s_corp_income": -400000,
      // Line 41 — Total income or (loss). Combine lines 26, 32, 37, 39, and 40
      "schedule-e.1.line.41_total_income_or_loss": -400000,
    },
  },
  "form-461": {
    engineFields: {
      // Line 3 — Enter amount from Form 1040 or 1040-SR, line 7a
      "form-461.0.line.3_form_1040_line_7a": -3000,
      // Line 5 — Enter amount from Schedule 1 (Form 1040), line 5
      "form-461.0.line.5_schedule_1_line_5": -400000,
      // Line 9 — Combine lines 1 through 8
      "form-461.0.line.9_total_income_loss_items": -403000,
      // Line 11 — Enter any losses or deductions reported on lines 1 through 8 that are not attrib
      "form-461.0.line.11_nonbusiness_losses_deductions": 3000,
      // Line 12 — Subtract line 11 from line 10
      "form-461.0.line.12_nonbusiness_net_adjustment": -3000,
      // Line 13 — If line 12 is a negative number, enter it here as a positive number. If line 12
      "form-461.0.line.13_line_12_sign_reversed": 3000,
      // Line 14 — Add lines 9 and 13
      "form-461.0.line.14_net_business_income_loss": -400000,
      // Line 15 — Enter $313,000 (or $626,000 if married filing jointly)
      "form-461.0.line.15_threshold_amount": 626000,
      // Line 16 — Add lines 14 and 15
      "form-461.0.line.16_excess_business_loss": 226000,
    },
    // No income on lines 1 to 8 is from outside a trade or business (irs-461-inst-2025::sec::line-10::b01).
    renderedBlank: ["form-461.0.line.10_nonbusiness_income_gain"],
  },
  "schedule-1": {
    engineFields: {
      // Line 5 — Rental real estate, royalties, partnerships, S corporations, trusts, etc. Attach
      "schedule-1.0.line.5": -400000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": -400000,
    },
    // Form 461 line 16 is positive: no excess business loss to add back (irs-461-inst-2025::sec::line-16::b01).
    renderedBlank: ["schedule-1.0.line.8p"],
  },
  "schedule-2": {
    engineFields: {
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 2880,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 2880,
    },
  },
  "form-8959": {
    engineFields: {
      // Line 1 — Medicare wages and tips from Form W-2, box 5
      "form-8959.0.line.1_medicare_wages_tips": 570000,
      // Line 4 — Add lines 1 through 3
      "form-8959.0.line.4_total_medicare_wages": 570000,
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 250000,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-8959.0.line.6_excess_medicare_wages": 320000,
      // Line 7 — Additional Medicare Tax on Medicare wages. Multiply line 6 by 0.9% (0.009)
      "form-8959.0.line.7_additional_medicare_tax_wages": 2880,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 2880,
      // Line 19 — Medicare tax withheld from Form W-2, box 6
      "form-8959.0.line.19_medicare_tax_withheld": 9885,
      // Line 20 — Enter the amount from line 1
      "form-8959.0.line.20_medicare_wages_from_line1": 570000,
      // Line 21 — Multiply line 20 by 1.45% (0.0145). Regular Medicare tax withholding on Medicare
      "form-8959.0.line.21_regular_medicare_tax_on_wages": 8265,
      // Line 22 — Subtract line 21 from line 19. If zero or less, enter -0-. Additional Medicare T
      "form-8959.0.line.22_additional_medicare_tax_withholding_wages": 1620,
      // Line 24 — Total Additional Medicare Tax withholding. Add lines 22 and 23
      "form-8959.0.line.24_total_additional_medicare_tax_withholding": 1620,
    },
  },
  "form-8960": {
    engineFields: {
      // Line 4a — Rental real estate, royalties, partnerships, S corporations, trusts, trades or b
      "form-8960.0.line.4a": -400000,
      // Line 4b — Adjustment for net income or loss derived in the ordinary course of a non-sectio
      "form-8960.0.line.4b": 400000,
      // Line 5a — Net gain or loss from disposition of property (see instructions)
      "form-8960.0.line.5a": -3000,
      // Line 5d — Combine lines 5a through 5c
      "form-8960.0.line.5d": -3000,
      // Line 8 — Total investment income. Combine lines 1, 2, 3, 4c, 5d, 6, and 7
      "form-8960.0.line.8": -3000,
      // Line 13 — Modified adjusted gross income (see instructions)
      "form-8960.0.line.13": 167000,
      // Line 14 — Threshold based on filing status (see instructions)
      "form-8960.0.line.14": 250000,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 570000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 570000,
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": -3000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": -400000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 167000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 167000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 167000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 31500,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 31500,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 135500,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 19638,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 19638,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 19638,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 2880,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 22518,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 100000,
      // Line 25c — Federal income tax withheld from other forms (see instructions)
      "form-1040.line.25c": 1620,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 101620,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 101620,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 79102,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 79102,
    },
  },
};

export function androlExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
