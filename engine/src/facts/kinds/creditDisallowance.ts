/*
 * Form 8862 answers: a credit that the IRS reduced or disallowed in an earlier
 * year, and the Part II questions that no other fact answers
 * (irs-8862-inst-2025::sec::general-instructions::b01). The EIC's denial and
 * ban are EIC_KEYS.deniedInEarlierYear and EIC_KEYS.barredByIrs; the keys here
 * are the same two answers for the other credits, and the EIC answers that
 * only Form 8862 asks. A child's days in the home are on the dependent fact
 * (daysLivedWithYouInUs).
 *
 * The child tax credit and American opportunity credit answers are optional:
 * absent means no earlier denial was stated, as on every return before Form
 * 8862 had rules (QUESTIONS.md in federal/8862).
 */

export const FORM_8862_KEYS = {
  /*
   * The child tax credit, additional child tax credit, credit for other
   * dependents (or 2021 refundable child tax credit) was reduced or disallowed
   * for a year after 2015, for a reason other than a math or clerical error,
   * and was not allowed again since on a return with Form 8862.
   */
  ctcDeniedInEarlierYear: "ctc.denied_in_earlier_year",
  /* An IRS notice bars these credits this year (the 2- or 10-year ban). */
  ctcBarredByIrs: "ctc.barred_by_irs",
  /* The same for the American opportunity credit (a year after 2015). */
  aotcDeniedInEarlierYear: "aotc.denied_in_earlier_year",
  aotcBarredByIrs: "aotc.barred_by_irs",
  /*
   * Line 3: the only reason the EIC was reduced or disallowed was earned income
   * or investment income reported wrong (irs-8862-face-2025, line 3).
   */
  eicOnlyIncomeMisreported: "eic.form_8862.only_income_misreported",
  /*
   * Exception (irs-8862-inst-2025::sec::general-instructions::b03): the only
   * reason the earlier EIC was reduced or disallowed was that a child on
   * Schedule EIC was not a qualifying child. Asked only of a filer with no
   * qualifying child this year, who then takes the EIC without Form 8862.
   */
  eicDeniedOnlyForChild: "eic.form_8862.denied_only_for_child",
  /*
   * Line 9a: the days of 2025 the main home was in the United States; extended
   * active military duty abroad counts as in the United States
   * (irs-8862-inst-2025::sec::line-9::b01).
   */
  daysMainHomeInUs: "eic.form_8862.days_main_home_in_us",
  /* Line 9b: the same for the spouse on a joint return. */
  spouseDaysMainHomeInUs: "eic.form_8862.spouse_days_main_home_in_us",
} as const;
