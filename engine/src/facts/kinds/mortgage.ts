/*
 * Home mortgage answers for Schedule A line 8 (one Form 1098 is supported). Cade's
 * ingest-1098 records the lender's boxes; the two "not on a 1098" amounts are
 * stated by the taxpayer.
 */
export const MORTGAGE_KEYS = {
  /* Line 8a: box 1 interest plus box 6 points reported on the Form 1098. */
  interestForm1098: "mortgage.interest_form_1098",
  /* Box 2: outstanding principal, which decides whether the acquisition-debt limit applies. */
  outstandingPrincipalForm1098: "mortgage.outstanding_principal_form_1098",
  /* Box 3: origination date, MM/DD/YYYY; loans from December 16, 2017 on take the $750,000 limit. */
  originationDateForm1098: "mortgage.origination_date_form_1098",
  /* Line 8b: interest not reported on a Form 1098 (a seller-financed loan). */
  interestNotForm1098: "mortgage.interest_not_form_1098",
  /* Line 8c: points not reported on a Form 1098. */
  pointsNotForm1098: "mortgage.points_not_form_1098",
} as const;
