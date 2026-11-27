/*
 * Schedule P (540NR) Part II line 29: the California part of each Part I
 * adjustment and preference, as the taxpayer states it. Line 29 takes "the
 * amounts that relate to income and deductions shown on Schedule CA (540NR),
 * Part II, column E. This is income from both of the following: (1)
 * California sources for any part of the year you were a nonresident, and (2)
 * your income from all sources for any part of the year you were a resident"
 * (ca-540nr-sched-p-inst-2025::sec::line-29-adjustments-and-preferences::b01).
 *
 * As for column E (kinds/caCaliforniaAmounts.ts, issue #336), the engine
 * never splits an amount between states itself: a spread from options
 * exercised while a resident is all California's; a nonresident's share of a
 * spread follows the days worked in California (FTB Pub. 1100), which only
 * the taxpayer knows. Each value is in dollars; 0 is an answer (none of the
 * adjustment is California's).
 */

export const CA_AMT_CALIFORNIA_KEYS = {
  /*
   * Line 29d: the California part of the incentive stock option spread that
   * Part I line 10 holds (kinds/alternativeMinimumTax.ts, kinds/isoExercise.ts).
   */
  isoExerciseSpread: "ca_540nr.amt_california_amount.iso_exercise_spread",
} as const;

/* The category of the facts above, the one the column E amounts use. */
export const CA_AMT_CALIFORNIA_CATEGORY = "state_local_tax";
