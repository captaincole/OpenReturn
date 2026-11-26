/*
 * harine — LOCKED expected values, drafted from the engine's
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
  "form-8978": {
    engineFields: {
      // Line 1a, column (a) — Total income per original return or as previously adjusted
      "form-8978.0.line.1a_total_income_original_col_a": 58000,
      // Line 1a, column (b) — Total income per original return or as previously adjusted
      "form-8978.0.line.1a_total_income_original_col_b": 44000,
      // Line 1b, column (a) — Adjustments to income from Schedule A (Form 8978), line 2, columns (
      "form-8978.0.line.1b_adjustments_to_income_col_a": -40000,
      // Line 2, column (a) — Combine lines 1a and 1b and enter the corrected income
      "form-8978.0.line.2_corrected_income_col_a": 18000,
      // Line 2, column (b) — Combine lines 1a and 1b and enter the corrected income
      "form-8978.0.line.2_corrected_income_col_b": 44000,
      // Line 3a, column (a) — Total deductions per original return or as previously adjusted
      "form-8978.0.line.3a_total_deductions_original_col_a": 19150,
      // Line 3a, column (b) — Total deductions per original return or as previously adjusted
      "form-8978.0.line.3a_total_deductions_original_col_b": 18850,
      // Line 3b, column (a) — Adjustments to deductions from Schedule A (Form 8978), line 4, colum
      "form-8978.0.line.3b_adjustments_to_deductions_col_a": -6200,
      // Line 3b, column (b) — Adjustments to deductions from Schedule A (Form 8978), line 4, colum
      "form-8978.0.line.3b_adjustments_to_deductions_col_b": -1800,
      // Line 4, column (a) — Combine lines 3a and 3b and enter the corrected deductions
      "form-8978.0.line.4_corrected_deductions_col_a": 12950,
      // Line 4, column (b) — Combine lines 3a and 3b and enter the corrected deductions
      "form-8978.0.line.4_corrected_deductions_col_b": 17050,
      // Line 5, column (a) — Corrected taxable income. Subtract line 4 from line 2
      "form-8978.0.line.5_corrected_taxable_income_col_a": 5050,
      // Line 5, column (b) — Corrected taxable income. Subtract line 4 from line 2
      "form-8978.0.line.5_corrected_taxable_income_col_b": 26950,
      // Line 6, column (a) — Income tax on line 5
      "form-8978.0.line.6_income_tax_col_a": 505,
      // Line 6, column (b) — Income tax on line 5
      "form-8978.0.line.6_income_tax_col_b": 3014,
      // Line 8, column (a) — Total corrected income tax. Add lines 6 and 7
      "form-8978.0.line.8_total_corrected_income_tax_col_a": 505,
      // Line 8, column (b) — Total corrected income tax. Add lines 6 and 7
      "form-8978.0.line.8_total_corrected_income_tax_col_b": 3014,
      // Line 11, column (a) — Total corrected income tax liability. Subtract line 10 from line 8
      "form-8978.0.line.11_total_corrected_tax_liability_col_a": 505,
      // Line 11, column (b) — Total corrected income tax liability. Subtract line 10 from line 8
      "form-8978.0.line.11_total_corrected_tax_liability_col_b": 3014,
      // Line 12, column (a) — Total income tax shown on original return or as previously adjusted
      "form-8978.0.line.12_total_income_tax_original_col_a": 4457,
      // Line 12, column (b) — Total income tax shown on original return or as previously adjusted
      "form-8978.0.line.12_total_income_tax_original_col_b": 2798,
      // Line 13, column (a) — Increase/Decrease to tax. Subtract line 12 from line 11, columns (a)
      "form-8978.0.line.13_increase_decrease_to_tax_col_a": -3952,
      // Line 13, column (b) — Increase/Decrease to tax. Subtract line 12 from line 11, columns (a)
      "form-8978.0.line.13_increase_decrease_to_tax_col_b": 216,
      // Line 14 — Total increase/decrease to reporting year tax. Add line 13, columns (a) through
      "form-8978.0.line.14_total_increase_decrease_reporting_year_tax": -3736,
      // Line 17, column (b) — Interest
      "form-8978.0.line.17_interest_col_b": 34,
      // Line 18 — Total interest. Add line 17, columns (a) through (d)
      "form-8978.0.line.18_total_interest": 34,
    },
    renderedChecked: ["form-8978.0.header.source_aar_filing"],
    renderedBlank: ["form-8978.0.header.source_bba_audit"],
  },
  "schedule-2": {
    engineFields: {
      // Line 8 — Additional tax on IRAs or other tax-favored accounts. Attach Form 5329 if require
      "schedule-2.0.line.8_additional_tax_iras_tax_favored_accounts": 500,
      // Line 17z — Any other taxes amount
      "schedule-2.1.line.17z_other_taxes_amount": -500,
      // Line 18 — Total additional taxes. Add lines 17a through 17z
      "schedule-2.1.line.18_total_additional_taxes": -500,
      // Line 21 — verified zero: line 8's $500 less the $500 adjustment.
      "schedule-2.1.line.21_total_other_taxes": 0,
    },
    renderedText: { "schedule-2.1.line.17z_other_taxes_description": "Form 8978 ADJ" },
  },
  "schedule-3": {
    engineFields: {
      // Line 6l — Amount on Form 8978, line 14
      "schedule-3.0.line.6l": 1355,
      // Line 7 — Total other nonrefundable credits. Add lines 6a through 6z
      "schedule-3.0.line.7": 1355,
      // Line 8 — Add lines 1 through 4, 5a, 5b, and 7. Enter here and on Form 1040, line 20
      "schedule-3.0.line.8": 1355,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 24000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 24000,
      // Line 5a — Pensions and annuities
      "form-1040.line.5a": 5000,
      // Line 5b — Taxable amount
      "form-1040.line.5b": 5000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 29000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 29000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 29000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 13250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 1355,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 1355,
      // Line 20 — Amount from Schedule 3, line 8
      "form-1040.line.20": 1355,
      // Line 21 — Add lines 19 and 20
      "form-1040.line.21": 1355,
      // Lines 22 and 24 — verified zeros: line 6l takes all of line 18; Schedule 2 line 21 is 0.
      "form-1040.line.22": 0,
      "form-1040.line.24": 0,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 1400,
      // Line 25b — Federal income tax withheld from Form(s) 1099
      "form-1040.line.25b": 1000,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 2400,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 2400,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 2400,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 2400,
    },
  },
};

export function harineExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
