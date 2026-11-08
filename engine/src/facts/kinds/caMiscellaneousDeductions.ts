/*
 * Schedule CA (540) Part II lines 19–25: the miscellaneous deductions subject to
 * the 2% floor, which federal law suspended and California still allows
 * (ca-540-sched-ca-inst-2025, Line 19 through Line 22). The taxpayer states them.
 */
export const CA_MISC_DEDUCTION_KEYS = {
  /*
   * Line 21, "Other expenses": fees paid to produce or collect investment income
   * or manage investments (advisory, custodial and management fees). Federal
   * Form 4952 line 5 excludes them; FTB 3526 line 5 takes them after the floor.
   */
  investmentFees: "misc_deductions.investment_fees",
} as const;
