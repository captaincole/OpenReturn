/*
 * Every value is from the CPA-prepared docs/Marcus-8959-Golden.pdf.
 * Line 7: 0.9% × (243,500 − 200,000) = 391.50 → 392.
 * Line 24: box 6 3,922 − 1.45% × 243,500 (3,531) = 391.
 */

import type { ExpectedResults } from "../../types.js";

export const marcus8959Expected: ExpectedResults = {
  engineFields: {
    "form-8959.0.line.1_medicare_wages_tips": 243500,
    "form-8959.0.line.4_total_medicare_wages": 243500,
    "form-8959.0.line.5_filing_status_threshold_wages": 200000,
    "form-8959.0.line.6_excess_medicare_wages": 43500,
    "form-8959.0.line.7_additional_medicare_tax_wages": 392,
    "form-8959.0.line.18_total_additional_medicare_tax": 392,
    "form-8959.0.line.19_medicare_tax_withheld": 3922,
    "form-8959.0.line.20_medicare_wages_from_line1": 243500,
    "form-8959.0.line.21_regular_medicare_tax_on_wages": 3531,
    "form-8959.0.line.22_additional_medicare_tax_withholding_wages": 391,
    "form-8959.0.line.24_total_additional_medicare_tax_withholding": 391,
  },

  renderedText: {
    "form-8959.0.header.taxpayer_name": "Marcus Chen",
    "form-8959.0.header.ssn": "345-67-8901",
    "form-8959.0.line.1_medicare_wages_tips": "243,500",
    "form-8959.0.line.4_total_medicare_wages": "243,500",
    "form-8959.0.line.5_filing_status_threshold_wages": "200,000",
    "form-8959.0.line.6_excess_medicare_wages": "43,500",
    "form-8959.0.line.7_additional_medicare_tax_wages": "392",
    "form-8959.0.line.18_total_additional_medicare_tax": "392",
    "form-8959.0.line.19_medicare_tax_withheld": "3,922",
    "form-8959.0.line.20_medicare_wages_from_line1": "243,500",
    "form-8959.0.line.21_regular_medicare_tax_on_wages": "3,531",
    "form-8959.0.line.22_additional_medicare_tax_withholding_wages": "391",
    "form-8959.0.line.24_total_additional_medicare_tax_withholding": "391",
  },

  renderedBlank: [
    "form-8959.0.line.8_self_employment_income",
    "form-8959.0.line.9_filing_status_threshold_se",
    "form-8959.0.line.10_medicare_wages_from_line4",
    "form-8959.0.line.11_threshold_reduced_by_wages",
    "form-8959.0.line.12_excess_se_income",
    "form-8959.0.line.13_additional_medicare_tax_se",
    "form-8959.0.line.14_rrta_compensation_tips",
    "form-8959.0.line.15_filing_status_threshold_rrta",
    "form-8959.0.line.16_excess_rrta_compensation",
    "form-8959.0.line.17_additional_medicare_tax_rrta",
    "form-8959.0.line.23_additional_medicare_tax_withholding_rrta",
  ],

  renderedChecked: [],
};
