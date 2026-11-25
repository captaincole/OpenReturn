/*
 * chiad — LOCKED expected values, drafted from the engine's
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
  "form-6252": {
    engineFields: {
      // Line 5 — Selling price including mortgages and other debts
      "form-6252.0.line.5_selling_price": 1200000,
      // Line 6 — Mortgages, debts, and other liabilities the buyer assumed or took the property su
      "form-6252.0.line.6_liabilities_buyer_assumed": 500000,
      // Line 7 — Subtract line 6 from line 5
      "form-6252.0.line.7_price_less_liabilities": 700000,
      // Line 8 — Cost or other basis of property sold
      "form-6252.0.line.8_cost_or_other_basis": 400000,
      // Line 10 — Adjusted basis. Subtract line 9 from line 8
      "form-6252.0.line.10_adjusted_basis": 400000,
      // Line 11 — Commissions and other expenses of sale
      "form-6252.0.line.11_commissions_expenses_of_sale": 60000,
      // Line 13 — Add lines 10, 11, and 12
      "form-6252.0.line.13_basis_expenses_recapture_total": 460000,
      // Line 14 — Subtract line 13 from line 5
      "form-6252.0.line.14_price_less_line_13": 740000,
      // Line 15 — If the property described on line 1 above was your main home, enter the amount o
      "form-6252.0.line.15_excluded_gain_main_home": 250000,
      // Line 16 — Gross profit. Subtract line 15 from line 14
      "form-6252.0.line.16_gross_profit": 490000,
      // Line 17 — Subtract line 13 from line 6. If zero or less, enter -0-
      "form-6252.0.line.17_liabilities_over_basis": 40000,
      // Line 18 — Contract price. Add line 7 and line 17
      "form-6252.0.line.18_contract_price": 740000,
      // Line 20 — If this is the year of sale, enter the amount from line 17. Otherwise, enter -0-
      "form-6252.0.line.20_year_of_sale_line_17": 40000,
      // Line 21 — Payments received during year
      "form-6252.0.line.21_payments_received_during_year": 200000,
      // Line 22 — Add lines 20 and 21
      "form-6252.0.line.22_total_payments_this_year": 240000,
      // Line 24 — Installment sale income. Multiply line 22 by line 19
      "form-6252.0.line.24_installment_sale_income": 158928,
      // Line 26 — Subtract line 25 from line 24
      "form-6252.0.line.26_income_less_recapture": 158928,
    },
    // MANUAL EDIT: the first copy (the home): the text lines and the boxes, checked by hand.
    renderedText: {
      "form-6252.0.line.1_description_of_property":
        "2 - Main home, 9 Heron Point Lane, Sarasota FL",
      "form-6252.0.line.2a_date_acquired": "08/01/2010",
      "form-6252.0.line.2b_date_sold": "04/15/2025",
      "form-6252.0.line.19_gross_profit_percentage": "0.6622",
    },
    renderedChecked: [
      "form-6252.0.line.3_sold_to_related_party_no",
      "form-6252.0.line.4_selling_price_determinable_yes",
    ],
  },
  "schedule-d": {
    engineFields: {
      // Line 4 — Short-term gain from Form 6252 and short-term gain or (loss) from Forms 4684, 678
      "schedule-d.0.line.4_short_term_gain_other_forms": 8499,
      // Line 7 — Net short-term capital gain or (loss). Combine lines 1a through 6 in column (h)
      "schedule-d.0.line.7_net_short_term_gain_loss": 8499,
      // Line 11 — Gain from Form 4797, Part I; long-term gain from Forms 2439 and 6252; and long-t
      "schedule-d.0.line.11_long_term_gain_other_forms": 158928,
      // Line 15 — Net long-term capital gain or (loss). Combine lines 8a through 14 in column (h)
      "schedule-d.0.line.15_net_long_term_gain_loss": 158928,
      // Line 16 — Combine lines 7 and 15 and enter the result
      "schedule-d.1.line.16_combined_gain_loss": 167427,
    },
  },
  "form-8960": {
    engineFields: {
      // Line 5a — Net gain or loss from disposition of property (see instructions)
      "form-8960.0.line.5a": 167427,
      // Line 5d — Combine lines 5a through 5c
      "form-8960.0.line.5d": 167427,
      // Line 8 — Total investment income. Combine lines 1, 2, 3, 4c, 5d, 6, and 7
      "form-8960.0.line.8": 167427,
      // Line 12 — Net investment income. Subtract Part II, line 11, from Part I, line 8. If zero o
      "form-8960.0.line.12": 167427,
      // Line 13 — Modified adjusted gross income (see instructions)
      "form-8960.0.line.13": 239427,
      // Line 14 — Threshold based on filing status (see instructions)
      "form-8960.0.line.14": 200000,
      // Line 15 — Subtract line 14 from line 13. If zero or less, enter -0-
      "form-8960.0.line.15": 39427,
      // Line 16 — Enter the smaller of line 12 or line 15
      "form-8960.0.line.16": 39427,
      // Line 17 — Net investment income tax for individuals. Multiply line 16 by 3.8% (0.038)
      "form-8960.0.line.17": 1498,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 12 — Net investment income tax. Attach Form 8960
      "schedule-2.0.line.12_net_investment_income_tax": 1498,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 1498,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 72000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 72000,
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": 167427,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 239427,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 239427,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 239427,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 223677,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 32993,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 32993,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 32993,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 1498,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 34491,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 7900,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 7900,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 7900,
      // Line 37 — Amount you owe
      "form-1040.line.37": 26591,
    },
  },
};

export function chiadExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
