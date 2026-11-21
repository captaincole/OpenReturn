/*
 * Capital loss carried over from last year (Schedule D lines 6 and 14). Each
 * fact is the result of last year's Capital Loss Carryover Worksheet, as a
 * positive amount (irs-1040sd-inst-2025::sec::capital-loss-carryover-worksheet-lines-6-and-14::b02,
 * lines 8 and 13). The taxpayer states it from last year's return.
 */

export const CAPITAL_LOSS_CARRYOVER_KEYS = {
  /* Worksheet line 8: Schedule D line 6. */
  shortTerm: "capital_gains.short_term_loss_carryover",
  /* Worksheet line 13: Schedule D line 14. */
  longTerm: "capital_gains.long_term_loss_carryover",
} as const;

/*
 * California capital loss carryover from 2024 (Schedule D (540) line 6), one
 * positive amount: California taxes short and long term gains alike, so the
 * form has one carryover line. Cade records it only when it differs from the
 * federal carryover, or when Schedule D (540) files for another difference
 * (ca-540-sched-d-inst-2025::sec::line-6-california-capital-loss-carryover-from-2024::b01).
 * It is not in CAPITAL_LOSS_CARRYOVER_KEYS: it does not file the federal Schedule D.
 */
export const CA_CAPITAL_LOSS_CARRYOVER_KEY = "capital_gains.ca_loss_carryover";
