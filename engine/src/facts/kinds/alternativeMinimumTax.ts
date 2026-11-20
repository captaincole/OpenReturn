/*
 * Answers the alternative minimum tax forms read (Form 6251, Schedule P (540)).
 * The taxpayer states them. Form 3921 (kinds/isoExercise.ts) carries the spread
 * too, and replaces a stated one.
 */
export const AMT_KEYS = {
  /*
   * The spread on incentive stock options exercised in the year and not sold by
   * year end: fair market value at exercise less the exercise price (Form 6251
   * line 2i; Schedule P (540) Part I, incentive stock options and California
   * qualified stock options). Not on the W-2 (Form 3921 reports the exercise).
   */
  isoExerciseSpread: "amt.iso_exercise_spread",
  /*
   * With a Form 3921 on file: did the taxpayer still hold the shares at the end
   * of the year? Boolean. The form reports the exercise, not a later sale.
   */
  isoSharesHeldAtYearEnd: "amt.iso_shares_held_at_year_end",
  /*
   * Not an answer, and never recorded. The forms list this key while a stated
   * spread above ISO_FORM_REQUIRED_ABOVE has no Form 3921: only the form's fact
   * (kinds/isoExercise.ts) clears it.
   */
  isoForm3921: "amt.iso_exercise_form_3921",
} as const;

/* A stated spread above this amount needs its Form 3921 (a product rule, not a tax rule). */
export const ISO_FORM_REQUIRED_ABOVE = 10_000;
