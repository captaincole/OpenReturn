/* Parts I and II for Schedule C businesses, and Part IV's REIT dividend path. */

import type { BaseFilingInfo } from "../../filingInfo.js";

/* One Schedule C business on this return: a column of Parts I and II. */
export interface QbiBusiness {
  factKey: string;
  owner: "taxpayer" | "spouse";
  /* Line 1(a): Schedule C line C, else line A. */
  name: string;
  ein?: string;
  specifiedService?: boolean;
  /* Schedule C line 31; undefined while it is blank. */
  netProfit?: number;
  /* The owner's only business, so it carries all of the owner's Schedule SE line 13. */
  ownersOnlyBusiness: boolean;
  /* Line 4: W-2 wages the business paid; undefined while unanswered. */
  w2WagesPaid?: number;
  /* Line 7: UBIA of qualified property; undefined while unanswered. */
  qualifiedPropertyUbia?: number;
}

export interface Form8995AFilingInfo extends BaseFilingInfo {
  /** Line 28: 1099-DIV box 5 sum, cents kept. */
  qualifiedReitDividends?: number;
  /* Columns A, B and C, in fact order; undefined with no business. */
  qbiBusinesses?: QbiBusiness[];
  /* Schedule SE must-file: false means no deductible SE tax. */
  qbiScheduleSEFiled?: boolean;
}
