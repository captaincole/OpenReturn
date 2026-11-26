/*
 * ferane — LOCKED expected values, drafted from the engine's
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
  "form-965-a": {
    engineFields: {
      // Part I, line 1 (2017) — (b) Taxpayer's net tax liability with all 965 amounts
      "form-965-a.0.part1.1_net_965_liability_col_b": 412600,
      // Part I, line 1 (2017) — (c) Taxpayer's net tax liability without 965 amounts
      "form-965-a.0.part1.1_net_965_liability_col_c": 318400,
      // Part I, line 1 (2017) — (d) Net 965 tax liability (subtract column (c) from column (b))
      "form-965-a.0.part1.1_net_965_liability_col_d": 94200,
      // Part I, line 1 (2017) — (e) S corporation shareholder total deferred net 965 tax liability
      "form-965-a.0.part1.1_net_965_liability_col_e": 18500,
      // Part I, line 2 (2018) — (b) Taxpayer's net tax liability with all 965 amounts
      "form-965-a.0.part1.2_net_965_liability_col_b": 288350,
      // Part I, line 2 (2018) — (c) Taxpayer's net tax liability without 965 amounts
      "form-965-a.0.part1.2_net_965_liability_col_c": 241900,
      // Part I, line 2 (2018) — (d) Net 965 tax liability (subtract column (c) from column (b))
      "form-965-a.0.part1.2_net_965_liability_col_d": 46450,
      // Part I, line 2 (2018) — (e) S corporation shareholder total deferred net 965 tax liability
      "form-965-a.0.part1.2_net_965_liability_col_e": 12400,
      // Part I, line 3 (2019) — (b) Taxpayer's net tax liability with all 965 amounts
      "form-965-a.0.part1.3_net_965_liability_col_b": 96800,
      // Part I, line 3 (2019) — (c) Taxpayer's net tax liability without 965 amounts
      "form-965-a.0.part1.3_net_965_liability_col_c": 90050,
      // Part I, line 3 (2019) — (d) Net 965 tax liability (subtract column (c) from column (b))
      "form-965-a.0.part1.3_net_965_liability_col_d": 6750,
      // Part I, line 4 (2020) — (b) Taxpayer's net tax liability with all 965 amounts
      "form-965-a.0.part1.4_net_965_liability_col_b": 51200,
      // Part I, line 4 (2020) — (c) Taxpayer's net tax liability without 965 amounts
      "form-965-a.0.part1.4_net_965_liability_col_c": 48975,
      // Part I, line 4 (2020) — (d) Net 965 tax liability (subtract column (c) from column (b))
      "form-965-a.0.part1.4_net_965_liability_col_d": 2225,
      // Part I, line 1 (2017) — (f) Net 965 tax liability eligible for installment payment electio
      "form-965-a.0.part1.1_net_965_liability_col_f": 75700,
      // Part I, line 1 (2017) — (i) Net 965 tax liability to be paid in installments (if column (g
      "form-965-a.0.part1.1_net_965_liability_col_i": 75700,
      // Part I, line 2 (2018) — (f) Net 965 tax liability eligible for installment payment electio
      "form-965-a.0.part1.2_net_965_liability_col_f": 34050,
      // Part I, line 2 (2018) — (i) Net 965 tax liability to be paid in installments (if column (g
      "form-965-a.0.part1.2_net_965_liability_col_i": 34050,
      // Part I, line 2 (2018) — (j) Net 965 tax liability transferred (out), transferred in, or su
      "form-965-a.0.part1.2_net_965_liability_col_j": 4000,
      // Part I, line 3 (2019) — (f) Net 965 tax liability eligible for installment payment electio
      "form-965-a.0.part1.3_net_965_liability_col_f": 6750,
      // Part I, line 3 (2019) — (i) Net 965 tax liability to be paid in installments (if column (g
      "form-965-a.0.part1.3_net_965_liability_col_i": 6750,
      // Part I, line 4 (2020) — (f) Net 965 tax liability eligible for installment payment electio
      "form-965-a.0.part1.4_net_965_liability_col_f": 2225,
      // Part I, line 4 (2020) — (h) Net 965 tax liability to be paid in full for Year 1 (if column
      "form-965-a.0.part1.4_net_965_liability_col_h": 2225,
      // Part I, line 5 — (j) Net 965 tax liability transferred (out), transferred in, or subsequen
      "form-965-a.0.part1.5_net_965_liability_col_j": 60000,
      // Part I, line 6 — (f) Net 965 tax liability eligible for installment payment election (subt
      "form-965-a.0.part1.6_net_965_liability_col_f": 12400,
      // Part I, line 6 — (i) Net 965 tax liability to be paid in installments (if column (g) is "Y
      "form-965-a.0.part1.6_net_965_liability_col_i": 12400,
      // Part II, line 1 (2017) — (b) Paid for Year 1
      "form-965-a.0.part2.1_liability_paid_col_b": 6056,
      // Part II, line 1 (2017) — (c) Paid for Year 2
      "form-965-a.0.part2.1_liability_paid_col_c": 6056,
      // Part II, line 1 (2017) — (d) Paid for Year 3
      "form-965-a.0.part2.1_liability_paid_col_d": 6056,
      // Part II, line 1 (2017) — (e) Paid for Year 4
      "form-965-a.0.part2.1_liability_paid_col_e": 6056,
      // Part II, line 1 (2017) — (f) Paid for Year 5
      "form-965-a.0.part2.1_liability_paid_col_f": 6056,
      // Part II, line 2 (2018) — (b) Paid for Year 1
      "form-965-a.0.part2.2_liability_paid_col_b": 2724,
      // Part II, line 2 (2018) — (c) Paid for Year 2
      "form-965-a.0.part2.2_liability_paid_col_c": 2724,
      // Part II, line 2 (2018) — (d) Paid for Year 3
      "form-965-a.0.part2.2_liability_paid_col_d": 2724,
      // Part II, line 2 (2018) — (e) Paid for Year 4
      "form-965-a.0.part2.2_liability_paid_col_e": 2724,
      // Part II, line 2 (2018) — (f) Paid for Year 5
      "form-965-a.0.part2.2_liability_paid_col_f": 4324,
      // Part II, line 3 (2019) — (b) Paid for Year 1
      "form-965-a.0.part2.3_liability_paid_col_b": 540,
      // Part II, line 3 (2019) — (c) Paid for Year 2
      "form-965-a.0.part2.3_liability_paid_col_c": 540,
      // Part II, line 3 (2019) — (d) Paid for Year 3
      "form-965-a.0.part2.3_liability_paid_col_d": 540,
      // Part II, line 3 (2019) — (e) Paid for Year 4
      "form-965-a.0.part2.3_liability_paid_col_e": 540,
      // Part II, line 3 (2019) — (f) Paid for Year 5
      "form-965-a.0.part2.3_liability_paid_col_f": 540,
      // Part II, line 4 (2020) — (b) Paid for Year 1
      "form-965-a.0.part2.4_liability_paid_col_b": 2225,
      // Part II, line 6 — (b) Paid for Year 1
      "form-965-a.0.part2.6_liability_paid_col_b": 992,
      // Part II, line 6 — (c) Paid for Year 2
      "form-965-a.0.part2.6_liability_paid_col_c": 992,
      // Part II, line 6 — (d) Paid for Year 3
      "form-965-a.0.part2.6_liability_paid_col_d": 992,
      // Part II, line 6 — (e) Paid for Year 4
      "form-965-a.0.part2.6_liability_paid_col_e": 992,
      // Line 1 — (g) Paid for Year 6
      "form-965-a.1.part2.1_net_965_tax_liability_col_g": 11355,
      // Line 1 — (h) Paid for Year 7
      "form-965-a.1.part2.1_net_965_tax_liability_col_h": 15140,
      // Line 1 — (i) Paid for Year 8
      "form-965-a.1.part2.1_net_965_tax_liability_col_i": 18925,
      // Line 2 — (g) Paid for Year 6
      "form-965-a.1.part2.2_net_965_tax_liability_col_g": 5708,
      // Line 2 — (h) Paid for Year 7
      "form-965-a.1.part2.2_net_965_tax_liability_col_h": 7610,
      // Line 2 — (i) Paid for Year 8
      "form-965-a.1.part2.2_net_965_tax_liability_col_i": 9512,
      // Line 2 — (k) Net 965 Tax Liability Paid for the Reporting Year
      "form-965-a.1.part2.2_net_965_tax_liability_col_k": 9512,
      // Line 3 — (g) Paid for Year 6
      "form-965-a.1.part2.3_net_965_tax_liability_col_g": 1013,
      // Line 3 — (h) Paid for Year 7
      "form-965-a.1.part2.3_net_965_tax_liability_col_h": 1350,
      // Line 3 — (j) Net 965 Tax Liability Remaining Unpaid
      "form-965-a.1.part2.3_net_965_tax_liability_col_j": 1687,
      // Line 3 — (k) Net 965 Tax Liability Paid for the Reporting Year
      "form-965-a.1.part2.3_net_965_tax_liability_col_k": 1350,
      // Line 5 — (g) Paid for Year 6
      "form-965-a.1.part2.5_net_965_tax_liability_col_g": 15000,
      // Line 5 — (h) Paid for Year 7
      "form-965-a.1.part2.5_net_965_tax_liability_col_h": 20000,
      // Line 5 — (i) Paid for Year 8
      "form-965-a.1.part2.5_net_965_tax_liability_col_i": 25000,
      // Line 5 — (k) Net 965 Tax Liability Paid for the Reporting Year
      "form-965-a.1.part2.5_net_965_tax_liability_col_k": 25000,
      // Line 6 — (j) Net 965 Tax Liability Remaining Unpaid
      "form-965-a.1.part2.6_net_965_tax_liability_col_j": 8432,
      // Line 6 — (k) Net 965 Tax Liability Paid for the Reporting Year
      "form-965-a.1.part2.6_net_965_tax_liability_col_k": 992,
      // Totals — (j) Net 965 Tax Liability Remaining Unpaid
      "form-965-a.1.part2.totals_net_965_tax_liability_col_j": 10119,
      // Totals — (k) Net 965 Tax Liability Paid for the Reporting Year
      "form-965-a.1.part2.totals_net_965_tax_liability_col_k": 36854,
      // Line 1 (2017), row 1 — (c) Taxpayer’s Net Tax Liability with only 965 amounts from this S
      "form-965-a.1.part3.1_row1_col_c": 336900,
      // Line 1 (2017), row 1 — (d) Taxpayer’s Net Tax Liability without 965 amounts
      "form-965-a.1.part3.1_row1_col_d": 318400,
      // Line 1 (2017), row 1 — (e) Net 965 Tax Liability related to 965 amounts from this S Corpor
      "form-965-a.1.part3.1_row1_col_e": 18500,
      // Line 1 (2017), row 1 — (g) Deferred Net 965 Tax Liability (if column (f) is “Yes,” enter a
      "form-965-a.1.part3.1_row1_col_g": 18500,
      // Line 1 (2017), row 2 — (c) Taxpayer’s Net Tax Liability with only 965 amounts from this S
      "form-965-a.1.part3.1_row2_col_c": 327100,
      // Line 1 (2017), row 2 — (d) Taxpayer’s Net Tax Liability without 965 amounts
      "form-965-a.1.part3.1_row2_col_d": 318400,
      // Line 1 (2017), row 2 — (e) Net 965 Tax Liability related to 965 amounts from this S Corpor
      "form-965-a.1.part3.1_row2_col_e": 8700,
      // Line 1 (2017) Total — (g) Deferred Net 965 Tax Liability
      "form-965-a.1.part3.1_total_col_g": 18500,
      // Line 2 (2018), row 1 — (c) Taxpayer’s Net Tax Liability with only 965 amounts from this S
      "form-965-a.1.part3.2_row1_col_c": 254300,
      // Line 2 (2018), row 1 — (d) Taxpayer’s Net Tax Liability without 965 amounts
      "form-965-a.1.part3.2_row1_col_d": 241900,
      // Line 2 (2018), row 1 — (e) Net 965 Tax Liability related to 965 amounts from this S Corpor
      "form-965-a.1.part3.2_row1_col_e": 12400,
      // Line 2 (2018), row 1 — (g) Deferred Net 965 Tax Liability (if column (f) is “Yes,” enter a
      "form-965-a.1.part3.2_row1_col_g": 12400,
      // Line 2 (2018) — Total of column (g), Deferred Net 965 Tax Liability
      "form-965-a.1.part3.2_total_col_g": 12400,
      // Part IV, line 1, column (d) — Beginning Deferred Net 965 Tax Liability
      "form-965-a.2.part4.1_s_corp_liability_col_d": 18500,
      // Part IV, line 1, column (g) — Deferred 965 Net Tax Liability Transferred (Out) or Transfer
      "form-965-a.2.part4.1_s_corp_liability_col_g": -6000,
      // Part IV, line 1, column (i) — Deferred Net Tax Liability at the end of this Reporting Year
      "form-965-a.2.part4.1_s_corp_liability_col_i": 12500,
      // Part IV, line 2, column (g) — Deferred 965 Net Tax Liability Transferred (Out) or Transfer
      "form-965-a.2.part4.2_s_corp_liability_col_g": 7250,
      // Part IV, line 2, column (i) — Deferred Net Tax Liability at the end of this Reporting Year
      "form-965-a.2.part4.2_s_corp_liability_col_i": 7250,
      // Part IV, Total — column (i), Deferred Net Tax Liability at the end of this Reporting Year
      "form-965-a.2.part4.total_s_corp_liability_col_i": 19750,
      // Part II column (j), verified zeros: lines 1, 2, 4 and 5 are paid in full.
      "form-965-a.1.part2.1_net_965_tax_liability_col_j": 0,
      "form-965-a.1.part2.2_net_965_tax_liability_col_j": 0,
      "form-965-a.1.part2.4_net_965_tax_liability_col_j": 0,
      "form-965-a.1.part2.5_net_965_tax_liability_col_j": 0,
    },
    renderedText: {
      "form-965-a.0.header.taxpayer_name": "Ferane Halloway",
      "form-965-a.0.header.identifying_number": "400-00-9650",
      "form-965-a.0.header.taxable_year_of_reporting": "2025",
      "form-965-a.0.part1.5_net_965_liability_col_a": "2018",
      "form-965-a.0.part1.6_net_965_liability_col_a": "2022",
      "form-965-a.0.part1.5_net_965_liability_col_k": "987-65-4322",
      "form-965-a.0.part2.5_liability_paid_col_a": "2018",
      "form-965-a.0.part2.6_liability_paid_col_a": "2022",
      "form-965-a.1.part3.1_row1_col_a": "Halvard Ridge Holdings Inc",
      "form-965-a.1.part3.1_row2_col_b": "00-0009652",
      "form-965-a.1.part3.2_row1_col_a": "Tillicum Bay Exports Inc",
      "form-965-a.2.part4.1_s_corp_liability_col_a": "2017",
      "form-965-a.2.part4.1_s_corp_liability_col_h": "00-0009654",
      "form-965-a.2.part4.2_s_corp_liability_col_a": "2025",
      "form-965-a.2.part4.2_s_corp_liability_col_b": "Quilcene Shipping Inc",
      "form-965-a.2.part4.2_s_corp_liability_col_h": "987-65-4323",
    },
    renderedChecked: [
      "form-965-a.0.part1.1_net_965_liability_col_g_yes",
      "form-965-a.0.part1.2_net_965_liability_col_g_yes",
      "form-965-a.0.part1.3_net_965_liability_col_g_yes",
      "form-965-a.0.part1.4_net_965_liability_col_g_no",
      "form-965-a.0.part1.6_net_965_liability_col_g_yes",
      "form-965-a.1.part3.1_row1_col_f_yes",
      "form-965-a.1.part3.1_row2_col_f_no",
      "form-965-a.1.part3.2_row1_col_f_yes",
    ],
    // An original return, nothing due on 2017, a transfer in skips (f)–(i), no 2025 trigger.
    renderedBlank: [
      "form-965-a.0.header.amended_report",
      "form-965-a.1.part2.1_net_965_tax_liability_col_k",
      "form-965-a.0.part1.5_net_965_liability_col_f",
      "form-965-a.0.part1.5_net_965_liability_col_g_yes",
      "form-965-a.0.part1.5_net_965_liability_col_g_no",
      "form-965-a.1.part3.1_row2_col_g",
      "form-965-a.2.part4.1_s_corp_liability_col_f",
      "form-965-a.0.part1.4_net_965_liability_col_i",
    ],
  },
  "schedule-2": {
    engineFields: {
      // Line 20 — Section 965 net tax liability installment from Form 965-A
      "schedule-2.1.line.20_section_965_net_tax_liability_installment": 36854,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 188000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 188000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 188000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 188000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 188000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 172250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 34187,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 34187,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 34187,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 34187,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 36000,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 36000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 36000,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 1813,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 1813,
    },
  },
};

export function feraneExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
