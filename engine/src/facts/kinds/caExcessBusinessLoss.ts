/*
 * FTB 3461 answers from last year's California return. California treats a
 * disallowed excess business loss as an excess business loss carryover, not an
 * NOL carryover (ca-3461-inst-2025::sec::a-purpose::b01), so the 2025 form
 * needs two amounts that no 2025 document prints. Each is a positive number,
 * category "other". Cade records them when FTB 3461 files: 0 is an answer.
 */
export const CA_BUSINESS_LOSS_LIMIT_KEYS = {
  /*
   * Line 14b: "Enter the amount from line 16 of your 2024 form FTB 3461"
   * (ca-3461-inst-2025::sec::line-14b::b01), the excess business losses carried
   * over from 2019 through 2024, as a positive amount. The form prints it as a
   * negative number. Asked when the form files; a carryover above 0 files the
   * form by itself.
   */
  priorYearCarryover: "ca_business_loss_limit.prior_year_carryover",
  /*
   * Line 17: "the excess business loss adjustment amount included as income in
   * prior years from Schedule CA (540 or 540NR) or other applicable forms"
   * (ca-3461-inst-2025::sec::line-17::b01), a positive amount. Asked when the
   * carryover is above 0.
   */
  priorYearAdjustmentsIncluded: "ca_business_loss_limit.prior_year_adjustments_included",
} as const;
