/* The QBI slots Form 8995 and Form 8995-A both read; resolveQbiInfo fills them. */

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

export interface QbiFilingInfo extends BaseFilingInfo {
  /** Form 8995 line 6, Form 8995-A line 28: 1099-DIV box 5 sum, cents kept. */
  qualifiedReitDividends?: number;
  /* The Schedule C businesses on this return, in fact order; undefined with no business. */
  qbiBusinesses?: QbiBusiness[];
  /* Schedule SE must-file: false means no deductible SE tax. */
  qbiScheduleSEFiled?: boolean;
}
