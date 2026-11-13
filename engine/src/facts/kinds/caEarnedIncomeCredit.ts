/*
 * California earned income tax credit answers (form FTB 3514). The amounts come
 * from the return; the federal EIC answers (EIC_KEYS) settle the questions the
 * two credits share: nonresident alien, qualifying child of another person,
 * claimed as a dependent, and the IRS's earlier disallowance (line 1a). These
 * are the questions only FTB 3514 asks.
 */

export const CA_EITC_KEYS = {
  /*
   * Line 1b: the FTB disallowed or reduced the California EITC in an earlier
   * year for a reason other than a math or clerical error. A yes does not stop
   * the credit (ca-3514-inst-2025::sec::specific-instructions::b01).
   */
  ftbDisallowedEarlierYear: "ca_eitc.ftb_disallowed_earlier_year",
  /*
   * Step 10, the Foster Youth Tax Credit: the taxpayer was in foster care at age
   * 13 or older, placed through the California foster care system.
   */
  fosterYouthTaxpayer: "ca_eitc.foster_youth_taxpayer",
  /* The same for the spouse/RDP on a joint return. */
  fosterYouthSpouse: "ca_eitc.foster_youth_spouse",
  /*
   * Line 33: the taxpayer who claims the FYTC consents to the California
   * Department of Social Services confirming it. Optional: without it, a
   * county or state letter is attached.
   */
  cdssConsentTaxpayer: "ca_eitc.cdss_consent_taxpayer",
  /* The same for the spouse/RDP. */
  cdssConsentSpouse: "ca_eitc.cdss_consent_spouse",
} as const;
