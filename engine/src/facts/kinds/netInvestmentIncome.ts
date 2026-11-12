/*
 * Form 8960 answers the taxpayer states. Line 10 holds deductions and
 * modifications properly allocable to net investment income that lines 1–9
 * leave out (irs-8960-inst-2025::sec::line-10-additional-modifications::b01).
 */
export const NET_INVESTMENT_INCOME_KEYS = {
  /* Line 10, category "investment_income": a number, recorded only when the taxpayer states one. */
  additionalModifications: "investment_income.niit_additional_modifications",
} as const;
