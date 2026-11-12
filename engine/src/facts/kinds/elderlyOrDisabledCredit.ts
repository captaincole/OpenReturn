/*
 * Schedule R answers (credit for the elderly or the disabled). The ages come
 * from the dates of birth, the taxable disability income from the 1099-Rs
 * reported on Form 1040 line 1h, and the nontaxable social security from
 * Form 1040 lines 6a and 6b. These are the questions only the taxpayer can
 * answer (irs-1040sr-inst-2025::sec::qualified-individual::b01).
 */

export const ELDERLY_OR_DISABLED_KEYS = {
  /*
   * Part I boxes 2, 4, 5, 6 and 9: a person under 65 at the end of the year who
   * retired on permanent and total disability (under-age-65::b01). Asked only of
   * a person under 65 with taxable disability income.
   */
  taxpayerRetiredOnDisability: "elderly_or_disabled.taxpayer_retired_on_disability",
  spouseRetiredOnDisability: "elderly_or_disabled.spouse_retired_on_disability",
  /*
   * Part II: a physician's statement was filed for 1983 or earlier, or a later
   * statement was signed on line B, and the person was still unable to engage
   * in substantial gainful activity this year (part-ii-statement-of-permanent-and::b02).
   */
  physicianStatementOnFile: "elderly_or_disabled.physician_statement_on_file",
  /*
   * Line 13b: nontaxable veterans' pensions and other pensions, annuities or
   * disability benefits excluded from income by a law other than the Internal
   * Revenue Code (line-13b::b01). 0 when none.
   */
  nontaxablePensions: "elderly_or_disabled.nontaxable_pensions",
} as const;
