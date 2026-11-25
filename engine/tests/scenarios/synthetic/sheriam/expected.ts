/*
 * sheriam — LOCKED expected values, drafted from the engine's
 * output on 2026-11-24 (scripts/draftExpected.ts).
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
  "form-8621": {
    engineFields: {
      // Line 5(b) — Section 1293 (Qualified Electing Fund): amount of inclusion
      "form-8621.0.line.5b_section_1293_amount": 5800,
      // Line 6a — Enter your pro rata share of the ordinary earnings of the QEF
      "form-8621.1.line.6a_qef_ordinary_earnings_share": 5000,
      // Line 6b — Enter the portion of line 6a that is included in income under section 951 or tha
      "form-8621.1.line.6b_ordinary_earnings_section_951_portion": 400,
      // Line 6c — Subtract line 6b from line 6a. Enter this amount on your tax return as ordinary
      "form-8621.1.line.6c_qef_ordinary_income": 4600,
      // Line 7a — Enter your pro rata share of the total net capital gain of the QEF
      "form-8621.1.line.7a_qef_net_capital_gain_share": 1200,
      // Line 7c — Subtract line 7b from line 7a. This amount is a net long-term capital gain
      "form-8621.1.line.7c_qef_net_long_term_gain": 1200,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 8z — Other income amount
      "schedule-1.0.line.8z": 836,
      // Line 9 — Total other income. Add lines 8a through 8z
      "schedule-1.0.line.9": 836,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 836,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 270,
      // Line 12 — Net investment income tax. Attach Form 8960
      "schedule-2.0.line.12_net_investment_income_tax": 334,
      // Line 17p — Any interest from Form 8621, line 16f, relating to distributions from, and disp
      "schedule-2.1.line.17p_interest_form8621_line16f_section_1291_fund": 392,
      // Line 18 — Total additional taxes. Add lines 17a through 17z
      "schedule-2.1.line.18_total_additional_taxes": 392,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 996,
    },
  },
  "schedule-d": {
    engineFields: {
      // Line 11 — Gain from Form 4797, Part I; long-term gain from Forms 2439 and 6252; and long-t
      "schedule-d.0.line.11_long_term_gain_other_forms": 1200,
      // Line 15 — Net long-term capital gain or (loss). Combine lines 8a through 14 in column (h)
      "schedule-d.0.line.15_net_long_term_gain_loss": 1200,
      // Line 16 — Combine lines 7 and 15 and enter the result
      "schedule-d.1.line.16_combined_gain_loss": 1200,
    },
  },
  "form-8959": {
    engineFields: {
      // Line 1 — Medicare wages and tips from Form W-2, box 5
      "form-8959.0.line.1_medicare_wages_tips": 280000,
      // Line 4 — Add lines 1 through 3
      "form-8959.0.line.4_total_medicare_wages": 280000,
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 250000,
      // Line 6 — Subtract line 5 from line 4. If zero or less, enter -0-
      "form-8959.0.line.6_excess_medicare_wages": 30000,
      // Line 7 — Additional Medicare Tax on Medicare wages. Multiply line 6 by 0.9% (0.009)
      "form-8959.0.line.7_additional_medicare_tax_wages": 270,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 270,
      // Line 19 — Medicare tax withheld from Form W-2, box 6
      "form-8959.0.line.19_medicare_tax_withheld": 4780,
      // Line 20 — Enter the amount from line 1
      "form-8959.0.line.20_medicare_wages_from_line1": 280000,
      // Line 21 — Multiply line 20 by 1.45% (0.0145). Regular Medicare tax withholding on Medicare
      "form-8959.0.line.21_regular_medicare_tax_on_wages": 4060,
      // Line 22 — Subtract line 21 from line 19. If zero or less, enter -0-. Additional Medicare T
      "form-8959.0.line.22_additional_medicare_tax_withholding_wages": 720,
      // Line 24 — Total Additional Medicare Tax withholding. Add lines 22 and 23
      "form-8959.0.line.24_total_additional_medicare_tax_withholding": 720,
    },
  },
  "form-8960": {
    engineFields: {
      // Line 5a — Net gain or loss from disposition of property (see instructions)
      "form-8960.0.line.5a": 1200,
      // Line 5d — Combine lines 5a through 5c
      "form-8960.0.line.5d": 1200,
      // Line 6 — Adjustments to investment income for certain CFCs and PFICs (see instructions)
      "form-8960.0.line.6": 7600,
      // Line 8 — Total investment income. Combine lines 1, 2, 3, 4c, 5d, 6, and 7
      "form-8960.0.line.8": 8800,
      // Line 12 — Net investment income. Subtract Part II, line 11, from Part I, line 8. If zero o
      "form-8960.0.line.12": 8800,
      // Line 13 — Modified adjusted gross income (see instructions)
      "form-8960.0.line.13": 282036,
      // Line 14 — Threshold based on filing status (see instructions)
      "form-8960.0.line.14": 250000,
      // Line 15 — Subtract line 14 from line 13. If zero or less, enter -0-
      "form-8960.0.line.15": 32036,
      // Line 16 — Enter the smaller of line 12 or line 15
      "form-8960.0.line.16": 8800,
      // Line 17 — Net investment income tax for individuals. Multiply line 16 by 3.8% (0.038)
      "form-8960.0.line.17": 334,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 280000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 280000,
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": 1200,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 836,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 282036,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 282036,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 282036,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 31500,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 31500,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 250536,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 48218,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 48218,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 48218,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 996,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 49214,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 52000,
      // Line 25c — Federal income tax withheld from other forms (see instructions)
      "form-1040.line.25c": 720,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 52720,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 52720,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 3506,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 3506,
    },
  },
};

export function sheriamExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
