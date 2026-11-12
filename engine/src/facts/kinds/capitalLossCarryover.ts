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
