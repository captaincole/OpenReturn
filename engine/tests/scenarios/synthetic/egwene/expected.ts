/*
 * egwene — LOCKED expected values, drafted from the engine's
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
  "form-8919": {
    engineFields: {
      // Line 1 (f) — Total wages received with no social security or Medicare tax withholding and
      "form-8919.0.line.1_firm_col_f": 7500,
      // Line 2 (f) — Total wages received with no social security or Medicare tax withholding and
      "form-8919.0.line.2_firm_col_f": 31200,
      // Line 3 (f) — Total wages received with no social security or Medicare tax withholding and
      "form-8919.0.line.3_firm_col_f": 9800,
      // Line 4 (f) — Total wages received with no social security or Medicare tax withholding and
      "form-8919.0.line.4_firm_col_f": 4350,
      // Line 6 — Total wages. Combine lines 1 through 5 in column (f)
      "form-8919.0.line.6_total_wages": 52851,
      // Line 8 — Total social security wages and social security tips (total of boxes 3 and 7 on F
      "form-8919.0.line.8_total_social_security_wages_tips": 140000,
      // Line 9 — Subtract line 8 from line 7. If line 8 is more than line 7, enter -0-
      "form-8919.0.line.9_subtract_line_8_from_7": 36100,
      // Line 10 — Wages subject to social security tax. Enter the smaller of line 6 or line 9
      "form-8919.0.line.10_wages_subject_social_security_tax": 36100,
      // Line 11 — Multiply line 10 by 0.062 (social security tax rate)
      "form-8919.0.line.11_social_security_tax": 2238,
      // Line 12 — Multiply line 6 by 0.0145 (Medicare tax rate)
      "form-8919.0.line.12_medicare_tax": 766,
      // Line 13 — Add lines 11 and 12
      "form-8919.0.line.13_total_uncollected_tax": 3004,
    },
    // MANUAL EDIT: the text columns of lines 1 to 4; column (d) only for codes A and C.
    renderedText: {
      "form-8919.0.line.1_firm_col_a": "Brazos Valley Clinic PA",
      "form-8919.0.line.1_firm_col_c": "H",
      "form-8919.0.line.2_firm_col_c": "A",
      "form-8919.0.line.2_firm_col_d": "08/14/2025",
      "form-8919.0.line.3_firm_col_b": "400-00-8920",
      "form-8919.0.line.3_firm_col_c": "G",
      "form-8919.0.line.4_firm_col_b": "unknown",
      "form-8919.0.line.4_firm_col_c": "C",
      "form-8919.0.line.4_firm_col_d": "03/03/2025",
    },
    renderedChecked: ["form-8919.0.line.1_firm_col_e", "form-8919.0.line.2_firm_col_e"],
    renderedBlank: [
      "form-8919.0.line.1_firm_col_d",
      "form-8919.0.line.3_firm_col_d",
      "form-8919.0.line.3_firm_col_e",
      "form-8919.0.line.5_firm_col_a",
      "form-8919.0.line.5_firm_col_f",
    ],
  },
  "schedule-c": {
    engineFields: {
      // Line 1 — Gross receipts or sales
      "schedule-c.0.line.1": 15000,
      // Line 3 — Subtract line 2 from line 1
      "schedule-c.0.line.3": 15000,
      // Line 5 — Gross profit. Subtract line 4 from line 3
      "schedule-c.0.line.5": 15000,
      // Line 7 — Gross income. Add lines 5 and 6
      "schedule-c.0.line.7": 15000,
      // Line 22 — Supplies (not included in Part III)
      "schedule-c.0.line.22": 3000,
      // Line 28 — Total expenses before expenses for business use of home. Add lines 8 through 27b
      "schedule-c.0.line.28": 3000,
      // Line 29 — Tentative profit or (loss). Subtract line 28 from line 7
      "schedule-c.0.line.29": 12000,
      // Line 31 — Net profit or (loss). Subtract line 30 from line 29
      "schedule-c.0.line.31": 12000,
    },
  },
  "schedule-se": {
    engineFields: {
      // Line 2 — Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box
      "schedule-se.0.line.2": 12000,
      // Line 3 — Combine lines 1a, 1b, and 2
      "schedule-se.0.line.3": 12000,
      // Line 4a — If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise, ente
      "schedule-se.0.line.4a": 11082,
      // Line 4c — Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment
      "schedule-se.0.line.4c": 11082,
      // Line 6 — Add lines 4c and 5b
      "schedule-se.0.line.6": 11082,
      // Line 8a — Total social security wages and tips (total of boxes 3 and 7 on Form(s) W-2) and
      "schedule-se.0.line.8a": 140000,
      // Line 8c — Wages subject to social security tax from Form 8919, line 10
      "schedule-se.0.line.8c": 36100,
      // Line 8d — Add lines 8a, 8b, and 8c
      "schedule-se.0.line.8d": 176100,
      // MANUAL EDIT: verified zeros. Line 8c fills the wage base, so no social security part.
      "schedule-se.0.line.9": 0,
      "schedule-se.0.line.10": 0,
      // Line 11 — Multiply line 6 by 2.9% (0.029)
      "schedule-se.0.line.11": 321,
      // Line 12 — Self-employment tax. Add lines 10 and 11
      "schedule-se.0.line.12": 321,
      // Line 13 — Deduction for one-half of self-employment tax. Multiply line 12 by 50% (0.50)
      "schedule-se.0.line.13": 161,
    },
  },
  "form-8959": {
    engineFields: {
      // Line 1 — Medicare wages and tips from Form W-2, box 5
      "form-8959.0.line.1_medicare_wages_tips": 140000,
      // Line 3 — Wages from Form 8919, line 6
      "form-8959.0.line.3_wages_form_8919": 52851,
      // Line 4 — Add lines 1 through 3
      "form-8959.0.line.4_total_medicare_wages": 192851,
      // Line 5 — Enter the following amount for your filing status
      "form-8959.0.line.5_filing_status_threshold_wages": 200000,
      // MANUAL EDIT: verified zeros. Line 4 is under $200,000.
      "form-8959.0.line.6_excess_medicare_wages": 0,
      "form-8959.0.line.7_additional_medicare_tax_wages": 0,
      // Line 8 — Self-employment income from Schedule SE (Form 1040), Part I, line 6
      "form-8959.0.line.8_self_employment_income": 11082,
      // Line 9 — Enter the following amount for your filing status
      "form-8959.0.line.9_filing_status_threshold_se": 200000,
      // Line 10 — Enter the amount from line 4
      "form-8959.0.line.10_medicare_wages_from_line4": 192851,
      // Line 11 — Subtract line 10 from line 9. If zero or less, enter -0-
      "form-8959.0.line.11_threshold_reduced_by_wages": 7149,
      // Line 12 — Subtract line 11 from line 8. If zero or less, enter -0-
      "form-8959.0.line.12_excess_se_income": 3933,
      // Line 13 — Additional Medicare Tax on self-employment income. Multiply line 12 by 0.9% (0.0
      "form-8959.0.line.13_additional_medicare_tax_se": 35,
      // Line 18 — Total Additional Medicare Tax. Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 35,
      // Line 19 — Medicare tax withheld from Form W-2, box 6
      "form-8959.0.line.19_medicare_tax_withheld": 2030,
      // Line 20 — Enter the amount from line 1
      "form-8959.0.line.20_medicare_wages_from_line1": 140000,
      // Line 21 — Multiply line 20 by 1.45% (0.0145). Regular Medicare tax withholding on Medicare
      "form-8959.0.line.21_regular_medicare_tax_on_wages": 2030,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": 11839,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": 11839,
      // Line 4 — Total qualified business income. Combine lines 2 and 3. If zero or less, enter -0
      "form-8995.0.line.4": 11839,
      // Line 5 — Qualified business income component. Multiply line 4 by 20% (0.20)
      "form-8995.0.line.5": 2368,
      // Line 10 — Qualified business income deduction before the income limitation. Add lines 5 an
      "form-8995.0.line.10": 2368,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 188940,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 188940,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 37788,
      // Line 15 — Qualified business income deduction. Enter the smaller of line 10 or line 14
      "form-8995.0.line.15": 2368,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 3 — Business income or (loss). Attach Schedule C
      "schedule-1.0.line.3": 12000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 12000,
      // Line 15 — Deductible part of self-employment tax (attach Schedule SE)
      "schedule-1.1.line.15": 161,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 161,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 4 — Self-employment tax. Attach Schedule SE
      "schedule-2.0.line.4_self_employment_tax": 321,
      // Line 6 — Uncollected social security and Medicare tax on wages. Attach Form 8919
      "schedule-2.0.line.6_uncollected_ss_medicare_tax_wages": 3004,
      // Line 7 — Total additional social security and Medicare tax. Add lines 5 and 6
      "schedule-2.0.line.7_total_additional_ss_medicare_tax": 3004,
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 35,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 3360,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 140000,
      // Line 1g — Wages from Form 8919, line 6
      "form-1040.line.1g": 52851,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 192851,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 12000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 204851,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 161,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 204690,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 204690,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 2368,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 18118,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 186572,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 37624,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 37624,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 37624,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 3360,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 40984,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 19500,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 19500,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 19500,
      // Line 37 — Amount you owe
      "form-1040.line.37": 21484,
    },
  },
};

export function egweneExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
