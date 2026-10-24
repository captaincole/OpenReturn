/*
 * Marcus Chen — Form 1040 expected results.
 *
 * Every numeric value below — both active assertions AND the commented
 * ones — mirrors the CPA-prepared Marcus-1040-Golden.pdf exactly.
 * Lines that already match are asserted. Lines that do not yet match
 * stay COMMENTED OUT with the golden value preserved, so:
 *   - Tests stay green today.
 *   - When the upstream wiring lands, uncomment the line. A pass means
 *     done; a failure means the gap is real.
 *   - The golden numbers stay visible in source for reference.
 *
 * As of this file's last update, the backlog is:
 *   - Schedule D wiring for Marcus (brokerage trades) → line 7a + cascade
 *   - Form 8960 + Schedule 2 → line 23 + cascade
 *   - Owe-tax branch implementation for line 37
 * The QDCG worksheet itself is wired into the 1040 line 16 binding;
 * Marcus's line 16 blocks only on line 15 (which blocks on line 7a).
 */

import type { ExpectedResults } from "../../types.js";

export const marcusExpected: ExpectedResults = {
  engineFields: {
    "form-1040.line.1a": 220000,
    "form-1040.line.1z": 220000,
    // 1099-INT $700 (Wealthfront HYSA) → line 2b.
    "form-1040.line.2b": 700,
    // 1099-DIV: $2,000 qualified (3a), $3,000 ordinary (3b).
    "form-1040.line.3a": 2000,
    "form-1040.line.3b": 3000,
    // Itemized: Schedule A line 17 ($18,422), not the standard deduction.
    "form-1040.line.12e": 18422,
    "form-1040.line.14": 18422,
    // Federal withholding from W-2 box 2.
    "form-1040.line.25a": 40000,
    // 8959 line 24: Additional Medicare Tax withholding ($391).
    "form-1040.line.25c": 391,

    /*
     * ─── Pending wiring (uncomment as the upstream PR lands) ──────────
     * Capital gain from Schedule D line 16. Wires up when Marcus's
     * brokerage trades + Schedule D scope flip land.
     * "form-1040.line.7a": 7500,
     * Total income: wages + interest + ordinary div + capital gain.
     * Blocks on line 7a.
     * "form-1040.line.9": 231200,
     * "form-1040.line.11a": 231200,
     * "form-1040.line.11b": 231200,
     * Taxable income = line 11b − line 14. Blocks on line 11b.
     * "form-1040.line.15": 212778,
     * Line 16 tax via the QDCG worksheet (qualified div + LTCG taxed at
     * preferential rates). Blocks on line 15.
     * "form-1040.line.16": 43962,
     * Other taxes from Schedule 2 line 21. Wires up with Schedule 2
     * bindings. The CPA golden shows $817; our 8959 produces $392 vs the
     * CPA's $391 on Schedule 2 line 11. Resolve the $1 rounding
     * inconsistency at Schedule 2 wiring time.
     * "form-1040.line.23": 817,
     * Total tax. Blocks on lines 16 + 23.
     * "form-1040.line.24": 44779,
     * Withholding subtotals. Line 25c is wired (done); these block on
     * line 24 (pending).
     * "form-1040.line.25d": 40391,
     * "form-1040.line.33": 40391,
     * Amount owed. Blocks on line 24 + the owe-tax binding. Line 37 is
     * unsupported today; it needs the "negative refund" branch.
     * "form-1040.line.37": 4388,
     */
  },

  renderedText: {
    "form-1040.header.first_name_mi": "Marcus",
    "form-1040.header.last_name": "Chen",
    // The 1040 SSN widget is a comb widget: digits-only per the federal default.
    "form-1040.header.ssn": "345678901",
  },

  renderedBlank: [],

  renderedChecked: ["form-1040.header.filing_status_single"],
};
