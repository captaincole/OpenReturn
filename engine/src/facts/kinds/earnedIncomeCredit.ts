/*
 * Earned income credit answers (1040 instructions, lines 27a–27c). The amounts
 * come from the return (earned income, AGI, investment income); these are the
 * eligibility questions only the taxpayer can answer. The qualifying child's
 * tests read the dependent facts (relationship, age, student, disabled, months
 * lived with the taxpayer in the United States).
 */

export const EIC_KEYS = {
  /* Step 1, question 4: the taxpayer or spouse was a nonresident alien for any part of the year. */
  nonresidentAlien: "eic.nonresident_alien",
  /*
   * Step 3, question 6 and Step 4, question 5: the taxpayer could be a qualifying
   * child of another person (No when that person files no return, or files only
   * for a refund of withholding).
   */
  qualifyingChildOfAnother: "eic.qualifying_child_of_another",
  /* Step 4, question 3 (no qualifying child): the main home was in the United States more than half the year. */
  mainHomeInUs: "eic.main_home_in_us",
  /* Step 4, question 6 (no qualifying child): someone can claim the taxpayer as a dependent. */
  claimableAsDependent: "eic.claimable_as_dependent",
  /*
   * Form 8862: the EIC was denied or reduced in a year after 1996 for a reason
   * other than a math or clerical error. The return then needs Form 8862.
   */
  deniedInEarlierYear: "eic.denied_in_earlier_year",
  /* An IRS notice bars the credit this year (the 2- or 10-year ban for reckless or fraudulent claims). */
  barredByIrs: "eic.barred_by_irs",
} as const;
