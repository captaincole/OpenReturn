/*
 * Form 2210-F answers: a federal farmer or fisher has one estimated tax payment,
 * due January 15, 2026 (irs-pub-505-2025::sec::farming-and-fishing-2::b01).
 * Category estimated_payments. The payments themselves, their dates, the 2024
 * overpayment applied and the waiver request are the Form 2210 facts
 * (estimatedTax.ts); the 2024 tax is PRIOR_YEAR_KEYS.federalTax. California's
 * answers for FTB 5805F are in caFarmerEstimatedTax.ts.
 */

export const FARMER_ESTIMATED_TAX_KEYS = {
  /*
   * true when the 2025 federal return is filed and the tax due is paid by
   * March 2, 2026: "You won't have to pay the penalty or file this form"
   * (irs-2210f-inst-2025::sec::exceptions-to-the-penalty::b01). Asked whenever
   * Form 2210-F files.
   */
  filedAndPaidByMarch2: "farmer_estimated_tax.filed_and_paid_by_march_2",
  /*
   * Line 14: the day the rest of the line 13 underpayment was paid, "YYYY-MM-DD",
   * when it was paid before April 15, 2026 by a payment that is not a dated
   * estimated tax payment (for example with the return). Absent, line 14 is
   * the day the dated payments after January 15 cover line 13, else April 15, 2026.
   */
  underpaymentPaidOn: "farmer_estimated_tax.underpayment_paid_on",
  /*
   * Line 4: the applicable net tax liability of a qualified sale of qualified
   * farmland property to a qualified farmer, for which the taxpayer made the
   * section 1062(a) election for 2025, a number. Line 4 includes 75% of it
   * (irs-2210f-inst-2025::sec::line-4::b01–b02, Notice 2026-3). Recorded only
   * with such an election; absent means none.
   */
  section1062NetTaxLiability: "farmer_estimated_tax.section_1062_net_tax_liability",
} as const;
