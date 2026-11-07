/*
 * Answers the alternative minimum tax forms read (Form 6251, Schedule P (540)).
 * The taxpayer states them: no document carries them.
 */
export const AMT_KEYS = {
  /*
   * The spread on incentive stock options exercised in the year and not sold by
   * year end: fair market value at exercise less the exercise price (Form 6251
   * line 2i; Schedule P (540) Part I, incentive stock options and California
   * qualified stock options). Not on the W-2 (Form 3921 reports the exercise).
   */
  isoExerciseSpread: "amt.iso_exercise_spread",
} as const;
