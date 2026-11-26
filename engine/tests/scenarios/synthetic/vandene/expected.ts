/*
 * vandene — LOCKED expected values, drafted from the engine's
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
      "form-8978.0.line.1a_total_income_original_col_a": 168000,
      // Line 1a, column (b) — Total income per original return or as previously adjusted
      "form-8978.0.line.1a_total_income_original_col_b": 175000,
      // Line 1a, column (c) — Total income per original return or as previously adjusted
      "form-8978.0.line.1a_total_income_original_col_c": 181000,
      // Line 1a, column (d) — Total income per original return or as previously adjusted
      "form-8978.0.line.1a_total_income_original_col_d": 190000,
      // Line 1b, column (a) — Adjustments to income from Schedule A (Form 8978), line 2, columns (
      "form-8978.0.line.1b_adjustments_to_income_col_a": 15000,
      // Line 1b, column (b) — Adjustments to income from Schedule A (Form 8978), line 2, columns (
      "form-8978.0.line.1b_adjustments_to_income_col_b": -3000,
      // Line 1b, column (c) — Adjustments to income from Schedule A (Form 8978), line 2, columns (
      "form-8978.0.line.1b_adjustments_to_income_col_c": 3000,
      // Line 1b, column (d) — Adjustments to income from Schedule A (Form 8978), line 2, columns (
      "form-8978.0.line.1b_adjustments_to_income_col_d": 1800,
      // Line 2, column (a) — Combine lines 1a and 1b and enter the corrected income
      "form-8978.0.line.2_corrected_income_col_a": 183000,
      // Line 2, column (b) — Combine lines 1a and 1b and enter the corrected income
      "form-8978.0.line.2_corrected_income_col_b": 172000,
      // Line 2, column (c) — Combine lines 1a and 1b and enter the corrected income
      "form-8978.0.line.2_corrected_income_col_c": 184000,
      // Line 2, column (d) — Combine lines 1a and 1b and enter the corrected income
      "form-8978.0.line.2_corrected_income_col_d": 191800,
      // Line 3a, column (a) — Total deductions per original return or as previously adjusted
      "form-8978.0.line.3a_total_deductions_original_col_a": 14000,
      // Line 3a, column (b) — Total deductions per original return or as previously adjusted
      "form-8978.0.line.3a_total_deductions_original_col_b": 12950,
      // Line 3a, column (c) — Total deductions per original return or as previously adjusted
      "form-8978.0.line.3a_total_deductions_original_col_c": 13850,
      // Line 3a, column (d) — Total deductions per original return or as previously adjusted
      "form-8978.0.line.3a_total_deductions_original_col_d": 14600,
      // Line 3b, column (a) — Adjustments to deductions from Schedule A (Form 8978), line 4, colum
      "form-8978.0.line.3b_adjustments_to_deductions_col_a": -2500,
      // Line 3b, column (c) — Adjustments to deductions from Schedule A (Form 8978), line 4, colum
      "form-8978.0.line.3b_adjustments_to_deductions_col_c": -3000,
      // Line 4, column (a) — Combine lines 3a and 3b and enter the corrected deductions
      "form-8978.0.line.4_corrected_deductions_col_a": 11500,
      // Line 4, column (b) — Combine lines 3a and 3b and enter the corrected deductions
      "form-8978.0.line.4_corrected_deductions_col_b": 12950,
      // Line 4, column (c) — Combine lines 3a and 3b and enter the corrected deductions
      "form-8978.0.line.4_corrected_deductions_col_c": 10850,
      // Line 4, column (d) — Combine lines 3a and 3b and enter the corrected deductions
      "form-8978.0.line.4_corrected_deductions_col_d": 14600,
      // Line 5, column (a) — Corrected taxable income. Subtract line 4 from line 2
      "form-8978.0.line.5_corrected_taxable_income_col_a": 171500,
      // Line 5, column (b) — Corrected taxable income. Subtract line 4 from line 2
      "form-8978.0.line.5_corrected_taxable_income_col_b": 159050,
      // Line 5, column (c) — Corrected taxable income. Subtract line 4 from line 2
      "form-8978.0.line.5_corrected_taxable_income_col_c": 173150,
      // Line 5, column (d) — Corrected taxable income. Subtract line 4 from line 2
      "form-8978.0.line.5_corrected_taxable_income_col_d": 177200,
      // Line 6, column (a) — Income tax on line 5
      "form-8978.0.line.6_income_tax_col_a": 35707,
      // Line 6, column (b) — Income tax on line 5
      "form-8978.0.line.6_income_tax_col_b": 32008,
      // Line 6, column (c) — Income tax on line 5
      "form-8978.0.line.6_income_tax_col_c": 34956,
      // Line 6, column (d) — Income tax on line 5
      "form-8978.0.line.6_income_tax_col_d": 35571,
      // Line 7, column (a) — Alternative minimum tax on line 5
      "form-8978.0.line.7_alternative_minimum_tax_col_a": 640,
      // Line 8, column (a) — Total corrected income tax. Add lines 6 and 7
      "form-8978.0.line.8_total_corrected_income_tax_col_a": 36347,
      // Line 8, column (b) — Total corrected income tax. Add lines 6 and 7
      "form-8978.0.line.8_total_corrected_income_tax_col_b": 32008,
      // Line 8, column (c) — Total corrected income tax. Add lines 6 and 7
      "form-8978.0.line.8_total_corrected_income_tax_col_c": 34956,
      // Line 8, column (d) — Total corrected income tax. Add lines 6 and 7
      "form-8978.0.line.8_total_corrected_income_tax_col_d": 35571,
      // Line 9a, column (a) — Total credits per original return or as previously adjusted
      "form-8978.0.line.9a_total_credits_original_col_a": 1500,
      // Line 9b, column (a) — Adjustments to credits from Schedule A (Form 8978), line 6, columns
      "form-8978.0.line.9b_adjustments_to_credits_col_a": -1200,
      // Line 10, column (a) — Combine lines 9a and 9b and enter the corrected credits
      "form-8978.0.line.10_corrected_credits_col_a": 300,
      // Line 11, column (a) — Total corrected income tax liability. Subtract line 10 from line 8
      "form-8978.0.line.11_total_corrected_tax_liability_col_a": 36047,
      // Line 11, column (b) — Total corrected income tax liability. Subtract line 10 from line 8
      "form-8978.0.line.11_total_corrected_tax_liability_col_b": 32008,
      // Line 11, column (c) — Total corrected income tax liability. Subtract line 10 from line 8
      "form-8978.0.line.11_total_corrected_tax_liability_col_c": 34956,
      // Line 11, column (d) — Total corrected income tax liability. Subtract line 10 from line 8
      "form-8978.0.line.11_total_corrected_tax_liability_col_d": 35571,
      // Line 12, column (a) — Total income tax shown on original return or as previously adjusted
      "form-8978.0.line.12_total_income_tax_original_col_a": 29481,
      // Line 12, column (b) — Total income tax shown on original return or as previously adjusted
      "form-8978.0.line.12_total_income_tax_original_col_b": 32728,
      // Line 12, column (c) — Total income tax shown on original return or as previously adjusted
      "form-8978.0.line.12_total_income_tax_original_col_c": 33516,
      // Line 12, column (d) — Total income tax shown on original return or as previously adjusted
      "form-8978.0.line.12_total_income_tax_original_col_d": 35139,
      // Line 13, column (a) — Increase/Decrease to tax. Subtract line 12 from line 11, columns (a)
      "form-8978.0.line.13_increase_decrease_to_tax_col_a": 6566,
      // Line 13, column (b) — Increase/Decrease to tax. Subtract line 12 from line 11, columns (a)
      "form-8978.0.line.13_increase_decrease_to_tax_col_b": -720,
      // Line 13, column (c) — Increase/Decrease to tax. Subtract line 12 from line 11, columns (a)
      "form-8978.0.line.13_increase_decrease_to_tax_col_c": 1440,
      // Line 13, column (d) — Increase/Decrease to tax. Subtract line 12 from line 11, columns (a)
      "form-8978.0.line.13_increase_decrease_to_tax_col_d": 432,
      // Line 14 — Total increase/decrease to reporting year tax. Add line 13, columns (a) through
      "form-8978.0.line.14_total_increase_decrease_reporting_year_tax": 7718,
      // Line 15, column (a) — Penalties
      "form-8978.0.line.15_penalties_col_a": 1313,
      // Line 16 — Total penalties. Add line 15, columns (a) through (d)
      "form-8978.0.line.16_total_penalties": 1313,
      // Line 17, column (a) — Interest
      "form-8978.0.line.17_interest_col_a": 3333,
      // Line 17, column (c) — Interest
      "form-8978.0.line.17_interest_col_c": 295,
      // Line 17, column (d) — Interest
      "form-8978.0.line.17_interest_col_d": 40,
      // Line 18 — Total interest. Add line 17, columns (a) through (d)
      "form-8978.0.line.18_total_interest": 3668,
    },
    renderedText: {
      "form-8978.0.header.partner_name": "Vandene Quillfeather",
      "form-8978.0.header.partner_tax_id_number": "400-00-8978",
      "form-8978.0.header.tax_year_ended_year_col_a": "21",
      "form-8978.0.header.tax_year_ended_year_col_d": "24",
    },
    renderedChecked: ["form-8978.0.header.source_bba_audit"],
    renderedBlank: ["form-8978.0.header.source_aar_filing"],
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 185000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 185000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 185000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 185000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 185000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 169250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 41185,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 41185,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 41185,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 41185,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 42000,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 42000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 42000,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 815,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 815,
    },
    // Line 16 box 3: "Form 8978" and the amount (irs-1040-inst-2025::sec::line-16::b02).
    renderedText: { "form-1040.line.16_other_form_number": "Form 8978 7,718" },
    renderedChecked: ["form-1040.line.16_from_other_form"],
  },
};

export function vandeneExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
