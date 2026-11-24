/*
 * cadsuane — LOCKED expected values, drafted from the engine's
 * output on 2026-11-23 (scripts/draftExpected.ts).
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
  "form-8582": {
    engineFields: {
      // Line 2a — All other passive activities: activities with net income (enter the amount from
      "form-8582.0.line.2a_other_net_income": 12000,
      // Line 2b — All other passive activities: activities with net loss (enter the amount from Pa
      "form-8582.0.line.2b_other_net_loss": 30000,
      // Line 2d — Combine lines 2a, 2b, and 2c
      "form-8582.0.line.2d_other_combined": -18000,
      // Line 3 — Combine lines 1d and 2d and subtract any prior year unallowed CRD
      "form-8582.0.line.3_combined": -18000,
      // Line 10 — Add the income, if any, on lines 1a and 2a and enter the total
      "form-8582.0.line.10_income_lines_1a_2a": 12000,
      // Line 11 — Total losses allowed from all passive activities for 2025. Add lines 9 and 10
      "form-8582.0.line.11_total_losses_allowed": 12000,
      // Part V, row 1 — (b) Current year net loss (line 2b)
      "form-8582.1.part5.row_1_col_b_net_loss": 30000,
      // Part V, row 1 — (e) Overall loss
      "form-8582.1.part5.row_1_col_e_loss": 30000,
      // Part V, row 2 — (a) Current year net income (line 2a)
      "form-8582.1.part5.row_2_col_a_net_income": 12000,
      // Part V, row 2 — (d) Overall gain
      "form-8582.1.part5.row_2_col_d_gain": 12000,
      // Part V total — (a) Current year net income (line 2a)
      "form-8582.1.part5.total_col_a_net_income": 12000,
      // Part V total — (b) Current year net loss (line 2b)
      "form-8582.1.part5.total_col_b_net_loss": 30000,
      // Part VII, row 1 — (a) Loss
      "form-8582.1.part7.row_1_col_a_loss": 30000,
      // Part VII, row 1 — (c) Unallowed loss
      "form-8582.1.part7.row_1_col_c_unallowed_loss": 18000,
      // Part VII total — (a) Loss
      "form-8582.1.part7.total_col_a_loss": 30000,
      // Part VII total — (c) Unallowed loss
      "form-8582.1.part7.total_col_c_unallowed_loss": 18000,
      // Part VIII, row 1 — (a) Loss
      "form-8582.1.part8.row_1_col_a_loss": 30000,
      // Part VIII, row 1 — (b) Unallowed loss
      "form-8582.1.part8.row_1_col_b_unallowed_loss": 18000,
      // Part VIII, row 1 — (c) Allowed loss
      "form-8582.1.part8.row_1_col_c_allowed_loss": 12000,
      // Part VIII total — (a) Loss
      "form-8582.1.part8.total_col_a_loss": 30000,
      // Part VIII total — (b) Unallowed loss
      "form-8582.1.part8.total_col_b_unallowed_loss": 18000,
      // Part VIII total — (c) Allowed loss
      "form-8582.1.part8.total_col_c_allowed_loss": 12000,
    },
    // The boatyard's loss is on Schedule E line 28, row A (irs-8582-inst-2025::sec::part-vi::b01 writes "Sch E, line 28A").
    renderedText: {
      "form-8582.1.part7.row_1_form_or_schedule": "Sch E, line 28A",
      "form-8582.1.part8.row_1_form_or_schedule": "Sch E, line 28A",
    },
  },
  "schedule-e": {
    engineFields: {
      // Line 28 row A — (g) Passive loss allowed (attach Form 8582 if required)
      "schedule-e.1.line.28_row_a_col_g_passive_loss_allowed": 12000,
      // Line 28 row B — (h) Passive income from Schedule K-1
      "schedule-e.1.line.28_row_b_col_h_passive_income": 12000,
      // Line 29a — Totals, column (h) passive income
      "schedule-e.1.line.29a_totals_col_h": 12000,
      // Line 29b — Totals, column (g) passive loss allowed
      "schedule-e.1.line.29b_totals_col_g": 12000,
      // Line 30 — Add columns (h) and (k) of line 29a
      "schedule-e.1.line.30_add_income_columns": 12000,
      // Line 31 — Add columns (g), (i), and (j) of line 29b
      "schedule-e.1.line.31_add_loss_columns": 12000,
      // Line 32 — Total partnership and S corporation income or (loss): 12,000 − 12,000 (verified zero)
      "schedule-e.1.line.32_total_partnership_s_corp_income": 0,
      // Line 41 — Total income or (loss) (verified zero)
      "schedule-e.1.line.41_total_income_or_loss": 0,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 5 — Schedule E line 41 (verified zero)
      "schedule-1.0.line.5": 0,
      // Line 10 — Additional income (verified zero)
      "schedule-1.0.line.10": 0,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": -12000,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": -12000,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 164250,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 164250,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 32850,
      // Line 15 — Qualified business income deduction: line 4 is 0 (verified zero)
      "form-8995.0.line.15": 0,
      // Line 16 — Total qualified business (loss) carryforward. Combine lines 2 and 3. If greater
      "form-8995.0.line.16": 12000,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 180000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 180000,
      // Line 8 — Additional income from Schedule 1, line 10 (verified zero)
      "form-1040.line.8": 0,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 180000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 180000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 180000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 164250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 32267,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 32267,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 32267,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 32267,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 32000,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 32000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 32000,
      // Line 37 — Amount you owe
      "form-1040.line.37": 267,
    },
  },
};

export function cadsuaneExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
