/*
 * amys — LOCKED expected values, drafted from the engine's
 * output on 2026-11-24 (scripts/draftExpected.ts), then edited by hand the
 * same day for the income in foreign currencies, and again for the rates the
 * engine now looks up in its tables (README.md, "Hand check").
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
  "form-8938": {
    engineFields: {
      // Number of additional statements
      "form-8938.0.header.number_of_additional_statements": 2,
      // Line 5 — Number of deposit accounts (reported in Part V)
      "form-8938.0.line.5_number_deposit_accounts": 2,
      // Line 6 — Maximum value of all deposit accounts
      "form-8938.0.line.6_max_value_deposit_accounts": 139128,
      // Line 7 — Number of custodial accounts (reported in Part V)
      "form-8938.0.line.7_number_custodial_accounts": 1,
      // Line 8 — Maximum value of all custodial accounts
      "form-8938.0.line.8_max_value_custodial_accounts": 82369,
      // Line 10 — Number of foreign assets (reported in Part VI)
      "form-8938.0.line.10_number_foreign_assets": 2,
      // Line 11 — Maximum value of all assets (reported in Part VI)
      "form-8938.0.line.11_max_value_foreign_assets": 298899,
      // Line 13a — Foreign deposit and custodial accounts: Interest — (c) Amount reported on form
      "form-8938.0.line.13a_accounts_interest_col_c": 1332,
      // Line 13b — Foreign deposit and custodial accounts: Dividends — (c) Amount reported on form
      "form-8938.0.line.13b_accounts_dividends_col_c": 1471,
      // Line 13e — Foreign deposit and custodial accounts: Gains (losses) — (c) Amount reported on
      "form-8938.0.line.13e_accounts_gains_losses_col_c": 6120,
      // Line 13f — Foreign deposit and custodial accounts: Deductions — (c) Amount reported on for
      "form-8938.0.line.13f_accounts_deductions_col_c": 47,
      // Line 13g — Foreign deposit and custodial accounts: Credits — (c) Amount reported on form o
      "form-8938.0.line.13g_accounts_credits_col_c": 139,
      // Line 14a — Other foreign assets: Interest — (c) Amount reported on form or schedule
      "form-8938.0.line.14a_other_assets_interest_col_c": 1913,
      // Line 14b — Other foreign assets: Dividends — (c) Amount reported on form or schedule
      "form-8938.0.line.14b_other_assets_dividends_col_c": 1262,
      // Line 14g — Other foreign assets: Credits — (c) Amount reported on form or schedule
      "form-8938.0.line.14g_other_assets_credits_col_c": 189,
      // Line 18 — Number of Forms 8621
      "form-8938.0.line.18_number_forms_8621": 1,
      // Line 23 — Maximum value of account during tax year
      "form-8938.1.line.23_account_maximum_value": 122209,
      // Line 32e — If more than $200,000, list value
      "form-8938.1.line.32e_asset_maximum_value_over_200000": 222399,
    },
    // Page 1, and copy 1 of page 2: the Bologna account (Part V) and the Fjordline shares (Part VI).
    renderedText: {
      "form-8938.0.header.calendar_year": "25",
      "form-8938.0.header.taxpayer_name": "Amys Halloran & Corin Halloran",
      "form-8938.0.header.tin": "400-00-8938",
      "form-8938.0.line.13a_accounts_interest_col_d": "Form 1040, line 2b",
      "form-8938.0.line.13a_accounts_interest_col_e": "Schedule B, line 1",
      "form-8938.0.line.13b_accounts_dividends_col_e": "Schedule B, line 5",
      "form-8938.0.line.13e_accounts_gains_losses_col_d": "Form 1040, line 7a",
      "form-8938.0.line.13e_accounts_gains_losses_col_e": "Schedule D, line 3",
      "form-8938.0.line.13f_accounts_deductions_col_d": "Form 1040, line 10",
      "form-8938.0.line.13f_accounts_deductions_col_e": "Schedule 1, line 18",
      "form-8938.0.line.13g_accounts_credits_col_d": "Form 1040, line 20",
      "form-8938.0.line.13g_accounts_credits_col_e": "Schedule 3, line 1",
      "form-8938.0.line.14a_other_assets_interest_col_e": "Schedule B, line 1",
      "form-8938.0.line.14b_other_assets_dividends_col_d": "Form 1040, line 3b",
      "form-8938.0.line.14g_other_assets_credits_col_e": "Schedule 3, line 1",
      "form-8938.1.line.21_account_number": "IT00 X000 0000 0000 0000 0089 38",
      "form-8938.1.line.25_account_exchange_rate_col_a": "Euro (EUR)",
      "form-8938.1.line.25_account_exchange_rate_col_b": "0.851",
      "form-8938.1.line.26a_financial_institution_name": "Banca Saragozza S.p.A.",
      "form-8938.1.line.26b_institution_giin_segment_1": "B4S7G2",
      "form-8938.1.line.26b_institution_giin_segment_4": "380",
      "form-8938.1.line.28_financial_institution_city_country": "Bologna, Italy 40123",
      "form-8938.1.line.29_description_of_asset":
        "22,400 ordinary shares of Fjordline Shipping ASA",
      "form-8938.1.line.34_asset_exchange_rate_col_b": "10.072",
      "form-8938.1.line.35a_foreign_entity_name": "Fjordline Shipping ASA",
      "form-8938.1.line.35e_foreign_entity_city_country": "Bergen, Norway 5013",
    },
    renderedChecked: [
      "form-8938.0.header.additional_statements_attached",
      "form-8938.0.line.3a_filer_specified_individual",
      "form-8938.0.line.9_accounts_closed_yes",
      "form-8938.0.line.12_assets_acquired_sold_yes",
      "form-8938.1.line.20a_type_of_account_deposit",
      "form-8938.1.line.22c_account_jointly_owned_spouse",
      "form-8938.1.line.24_account_exchange_rate_used_yes",
      "form-8938.1.line.33_asset_exchange_rate_used_yes",
      "form-8938.1.line.35c_foreign_entity_type_corporation",
    ],
    // No royalties or other income; the Bologna account has tax items (22d), the shares are not owned jointly (31c).
    renderedBlank: [
      "form-8938.0.line.13c_accounts_royalties_col_c",
      "form-8938.0.line.13d_accounts_other_income_col_c",
      "form-8938.0.line.14e_other_assets_gains_losses_col_c",
      "form-8938.0.line.15_number_forms_3520",
      "form-8938.0.line.4a_specified_person_name",
      "form-8938.1.line.22d_account_no_tax_item",
      "form-8938.1.line.31c_asset_jointly_owned_spouse",
      "form-8938.1.line.32a_asset_maximum_value_0_to_50000",
    ],
  },
  "schedule-b": {
    engineFields: {
      // Line 1 — Amount (row 1)
      "schedule-b.0.line.1_amount_1": 1332,
      // Line 1 — Amount (row 2)
      "schedule-b.0.line.1_amount_2": 1913,
      // Line 2 — Add the amounts on line 1
      "schedule-b.0.line.2_total_interest": 3245,
      // Line 4 — Subtract line 3 from line 2. Enter the result here and on Form 1040 or 1040-SR, l
      "schedule-b.0.line.4_taxable_interest": 3245,
      // Line 5 — Amount (row 1)
      "schedule-b.0.line.5_amount_1": 1471,
      // Line 5 — Amount (row 2)
      "schedule-b.0.line.5_amount_2": 1262,
      // Line 6 — Add the amounts on line 5. Enter the total here and on Form 1040 or 1040-SR, line
      "schedule-b.0.line.6_total_ordinary_dividends": 2732,
    },
    /*
     * Line 7b — the countries of the financial accounts, in the order recorded: the three
     * Part V accounts, then the Alpenrose fund units (a mutual fund). The Norwegian shares on
     * the company's register and the Dutch note are not accounts.
     */
    renderedText: {
      "schedule-b.0.line.7b_foreign_country_1": "Italy",
      "schedule-b.0.line.7b_foreign_country_2": "United Kingdom, Switzerland, Luxembourg",
    },
    /* Line 7: the account facts answer both questions; one account alone is over $10,000. */
    renderedChecked: [
      "schedule-b.0.line.7a_foreign_account_yes",
      "schedule-b.0.line.7a_fincen_114_required_yes",
      "schedule-b.0.line.8_foreign_trust_no",
    ],
    renderedBlank: [
      "schedule-b.0.line.7a_foreign_account_no",
      "schedule-b.0.line.7a_fincen_114_required_no",
    ],
  },
  "form-8949": {
    engineFields: {
      // Row 1 — (d) Proceeds (sales price)
      "form-8949.0.part1.row1_proceeds": 18314,
      // Row 1 — (e) Cost or other basis
      "form-8949.0.part1.row1_cost_basis": 12194,
      // Row 1 — (h) Gain or (loss)
      "form-8949.0.part1.row1_gain_loss": 6120,
      // Line 2 Totals — (d) Proceeds (sales price)
      "form-8949.0.part1.totals_proceeds": 18314,
      // Line 2 Totals — (e) Cost or other basis
      "form-8949.0.part1.totals_cost_basis": 12194,
      // Line 2 Totals — (h) Gain or (loss)
      "form-8949.0.part1.totals_gain_loss": 6120,
    },
  },
  "schedule-d": {
    engineFields: {
      // Line 3 — Proceeds (sales price) — Totals for all transactions reported on Form(s) 8949 wit
      "schedule-d.0.line.3_proceeds": 18314,
      // Line 3 — Cost (or other basis) — Totals for all transactions reported on Form(s) 8949 with
      "schedule-d.0.line.3_cost": 12194,
      // Line 3 — Gain or (loss) — Totals for all transactions reported on Form(s) 8949 with Box C
      "schedule-d.0.line.3_gain_loss": 6120,
      // Line 7 — Net short-term capital gain or (loss). Combine lines 1a through 6 in column (h)
      "schedule-d.0.line.7_net_short_term_gain_loss": 6120,
      // Line 16 — Combine lines 7 and 15 and enter the result
      "schedule-d.1.line.16_combined_gain_loss": 6120,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 18 — Penalty on early withdrawal of savings
      "schedule-1.1.line.18": 47,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 47,
    },
  },
  "schedule-3": {
    engineFields: {
      // Line 1 — Foreign tax credit. Attach Form 1116 if required
      "schedule-3.0.line.1": 328,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 328,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 172400,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 172400,
      // Line 2b — Taxable interest
      "form-1040.line.2b": 3245,
      // Line 3a — Qualified dividends
      "form-1040.line.3a": 2732,
      // Line 3b — Ordinary dividends
      "form-1040.line.3b": 2732,
      // Line 7a — Capital gain or (loss). Attach Schedule D if required
      "form-1040.line.7a": 6120,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 184497,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 47,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 184450,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 184450,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 31500,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 31500,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 152950,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 23286,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 23286,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 328,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 328,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 22958,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 22958,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 27850,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 27850,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 27850,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 4892,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 4892,
    },
  },
};

export function amysExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
