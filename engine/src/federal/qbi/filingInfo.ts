/* The QBI slots Form 8995 and Form 8995-A both read; resolveQbiInfo fills them. */

import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form461FilingInfo } from "../461/filingInfo.js";
import type { Form7206FilingInfo } from "../7206/filingInfo.js";
import type { PropertyColumn, RentalProperty } from "../schedule-e/filingInfo.js";

/* One QBI trade or business on this return: a column of Parts I and II. */
export interface QbiBusiness {
  factKey: string;
  /*
   * A Schedule C business, a rental or royalty property that is a trade or
   * business (Schedule E), or a K-1's section 199A statement (passThrough).
   */
  kind: "business" | "rental" | "passThrough";
  /* A rental's column on Schedule E Part I. */
  scheduleEColumn?: PropertyColumn;
  owner: "taxpayer" | "spouse";
  /* Line 1(a): Schedule C line C, else line A; a rental's street address, else its type. */
  name: string;
  ein?: string;
  specifiedService?: boolean;
  /* Schedule C line 31; undefined while it is blank, and for a rental (Schedule E is read). */
  netProfit?: number;
  /*
   * A K-1's QBI as its section 199A statement gives it, scaled to the part of
   * the business losses the limits allow; undefined while the K-1 waits.
   */
  statementQbi?: number;
  /*
   * Form 8995 line 3: the qualified part of a K-1's basis loss carried from an
   * earlier year and allowed this year, a positive amount, unrounded.
   */
  priorYearQbiLoss?: number;
  /* The owner's only business, so it carries all of the owner's Schedule SE line 13. */
  ownersOnlyBusiness: boolean;
  /* Schedule 1 line 16 (self-employed plan contributions) this business's QBI takes off, cents kept. */
  retirementPlanDeduction?: number;
  /* Why the engine does not figure this business's QBI, or undefined. */
  qbiGap?: string;
  /* Form 4797's ordinary gain or loss on the property of this business or rental (qbi/form4797.ts). */
  form4797Ordinary?: number;
  /* A Form 4797 sale does not name its business yet: the QBI waits. */
  form4797Waits?: boolean;
  /* Line 4: W-2 wages the business paid; undefined while unanswered. */
  w2WagesPaid?: number;
  /* Line 7: UBIA of qualified property; undefined while unanswered. */
  qualifiedPropertyUbia?: number;
}

/*
 * Form 461's slots: an excess business loss holds QBI lines (qbi/excessBusinessLoss.ts).
 * Form 7206's plans: a business's QBI takes off its health insurance deduction (qbi/lines.ts).
 */
export interface QbiFilingInfo
  extends
    BaseFilingInfo,
    Pick<Form461FilingInfo, "form461">,
    Pick<Form7206FilingInfo, "form7206Plans" | "form7206Line5" | "form2555Filers"> {
  /** Form 8995 line 6, Form 8995-A line 28: 1099-DIV box 5 and K-1 section 199A dividends, cents kept. */
  qualifiedReitDividends?: number;
  /** Why a K-1's section 199A dividends are not known (an unsupported K-1); lines 6 and 28 show it. */
  qualifiedReitDividendsGap?: string;
  /* The QBI rentals, then the Schedule C businesses, then the K-1 statements, in fact order; undefined with none. */
  qbiBusinesses?: QbiBusiness[];
  /* Schedule SE must-file: false means no deductible SE tax. */
  qbiScheduleSEFiled?: boolean;
  /* Schedule E's columns (its resolver fills them); a QBI rental reads its property. */
  rentalProperties?: RentalProperty[];
}
