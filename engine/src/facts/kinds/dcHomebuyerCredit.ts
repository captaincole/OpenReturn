/*
 * Form 8859, Carryforward of the District of Columbia First-Time Homebuyer
 * Credit. The credit ended for homes bought after 2011
 * (irs-1040-inst-2025::sec::line-6h::b01): a 2025 return can claim only the
 * unused credit carried from 2024, "shown on your prior year Form 8859, line 4"
 * (irs-8859-form-2025::sec::omb-no-1545-0074::b01).
 *
 * One number the taxpayer states: line 4 of the 2024 Form 8859, in dollars
 * (0 when none). Above 0 it files Form 8859.
 */

export const DC_HOMEBUYER_CREDIT_KEYS = {
  /* Form 8859 line 1: "Enter the amount from line 4 of your 2024 Form 8859". */
  carryforwardFrom2024: "prior_year.dc_homebuyer_credit_carryforward",
} as const;
