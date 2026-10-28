/*
 * Every numeric value is from the CPA-completed docs/Alejandro-1040-Golden.pdf.
 * IRS 1040 inst., line 16: QDCG worksheet, because lines 3a and 7a are > 0.
 */

import type { ExpectedResults } from "../../types.js";

export const alejandroExpected: ExpectedResults = {
  engineFields: {
    "form-1040.line.1a": 100000, // W-2 box 1
    "form-1040.line.1z": 100000,
    "form-1040.line.3a": 381, // 1099-DIV box 1b
    "form-1040.line.3b": 385, // 1099-DIV box 1a
    "form-1040.line.7a": 2550, // Schedule D line 16
    "form-1040.line.9": 102935,
    "form-1040.line.11a": 102935,
    "form-1040.line.11b": 102935,
    "form-1040.line.12e": 15750, // 2025 single standard deduction
    "form-1040.line.14": 15750,
    "form-1040.line.15": 87185,
    "form-1040.line.16": 13916, // QDCG worksheet, not the Tax Table
    "form-1040.line.18": 13916,
    "form-1040.line.22": 13916,
    "form-1040.line.24": 13916,
    "form-1040.line.25a": 14500, // W-2 box 2
    "form-1040.line.25d": 14500,
    "form-1040.line.33": 14500,
    "form-1040.line.34": 584,
  },

  renderedText: {
    "form-1040.header.first_name_mi": "Alejandro",
    "form-1040.header.last_name": "Reyes",
    "form-1040.header.ssn": "234567890",
    "form-1040.header.home_address": "123 Valencia Street",
    "form-1040.header.city": "San Francisco",
    "form-1040.header.state": "CA",
    "form-1040.header.zip": "94110",
    "form-1040.line.16": "13,916",
    "form-1040.line.34": "584",
    "form-1040.signing.taxpayer_occupation": "marketing",
    "form-1040.signing.taxpayer_phone": "4156369589",
    "form-1040.signing.taxpayer_email": "alejandro@reyes.com",
  },

  renderedBlank: [
    "form-1040.header.tax_year_beginning_mm",
    "form-1040.header.tax_year_ending_mm",
    "form-1040.header.tax_year_ending_yy",
    "form-1040.line.35b_routing_number",
    "form-1040.line.35d_account_number",
  ],

  renderedChecked: ["form-1040.header.filing_status_single"],
};
