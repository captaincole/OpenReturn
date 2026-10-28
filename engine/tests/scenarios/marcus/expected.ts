/*
 * Every value is from the CPA-prepared docs/Marcus-1040-Golden.pdf. The commented-out
 * lines keep golden values the engine does not reach yet; uncomment them as they wire up.
 */

import type { ExpectedResults } from "../../types.js";

export const marcusExpected: ExpectedResults = {
  engineFields: {
    "form-1040.line.1a": 220000,
    "form-1040.line.1z": 220000,
    // 1099-INT box 1.
    "form-1040.line.2b": 700,
    // 1099-DIV boxes 1b and 1a.
    "form-1040.line.3a": 2000,
    "form-1040.line.3b": 3000,
    // Schedule A line 17.
    "form-1040.line.12e": 18422,
    "form-1040.line.14": 18422,
    // W-2 box 2.
    "form-1040.line.25a": 40000,
    // 8959 line 24.
    "form-1040.line.25c": 391,

    /*
     * Pending wiring:
     * "form-1040.line.7a": 7500,
     * "form-1040.line.9": 231200,
     * "form-1040.line.11a": 231200,
     * "form-1040.line.11b": 231200,
     * "form-1040.line.15": 212778,
     * "form-1040.line.16": 43962,
     * "form-1040.line.23": 817, (the CPA's Schedule 2 line 11 says 391; our 8959 says 392)
     * "form-1040.line.24": 44779,
     * "form-1040.line.25d": 40391,
     * "form-1040.line.33": 40391,
     * "form-1040.line.37": 4388,
     */
  },

  renderedText: {
    "form-1040.header.first_name_mi": "Marcus",
    "form-1040.header.last_name": "Chen",
    // Comb widget: digits only.
    "form-1040.header.ssn": "345678901",
  },

  renderedBlank: [],

  renderedChecked: ["form-1040.header.filing_status_single"],
};
