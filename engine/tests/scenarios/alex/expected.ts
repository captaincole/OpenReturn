/* Every numeric value is from the CPA-completed docs/Alex-1040-Golden.pdf. */

import type { ExpectedResults } from "../../types.js";

export const alexExpected: ExpectedResults = {
  engineFields: {
    "form-1040.line.1a": 79000, // W-2 box 1
    "form-1040.line.1z": 79000,
    "form-1040.line.9": 79000,
    "form-1040.line.11b": 79000,
    "form-1040.line.12e": 15750, // 2025 single standard deduction
    "form-1040.line.14": 15750,
    "form-1040.line.15": 63250,
    "form-1040.line.16": 8835, // 2025 IRS Tax Table
    "form-1040.line.18": 8835,
    "form-1040.line.22": 8835,
    "form-1040.line.24": 8835,
    "form-1040.line.25a": 9420, // W-2 box 2
    "form-1040.line.25d": 9420,
    "form-1040.line.33": 9420,
    "form-1040.line.34": 585,
  },

  renderedText: {
    "form-1040.header.first_name_mi": "Alex",
    "form-1040.header.last_name": "Morales",
    "form-1040.header.ssn": "123456789", // maxLength=9 strips the separators
    "form-1040.header.home_address": "2245 Lakeshore Ave",
    "form-1040.header.city": "Oakland",
    "form-1040.header.state": "CA",
    "form-1040.header.zip": "94606",
    "form-1040.line.16": "8,835",
    "form-1040.line.34": "585",
    "form-1040.signing.taxpayer_occupation": "Engineer",
    "form-1040.signing.taxpayer_phone": "7039530253",
    "form-1040.signing.taxpayer_email": "alex@morales.com",
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
