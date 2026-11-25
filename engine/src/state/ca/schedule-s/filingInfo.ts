import type { OtherStateTaxItem } from "../../../facts/index.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";

/*
 * One Schedule S: the stated answers for one other state whose tax California
 * allows a credit for. A field is undefined while its answer waits.
 */
export interface OtherStateCreditInput {
  factKey: string;
  /* Line 7's abbreviation, upper case. */
  state: string;
  /* Part I rows. */
  items?: OtherStateTaxItem[];
  /* Line 7. */
  taxPaid?: number;
  /* Line 9. */
  otherStateAdjustedGrossIncome?: number;
}

/*
 * Schedule S reads Form 540 (line 2: tax; line 4: AGI) and Schedule G-1 through
 * the form accessor. Form 540 line 43 and Schedule P (540) line 20 read
 * `otherStateCredits` to total every copy.
 */
export interface ScheduleSFilingInfo extends BaseFilingInfo {
  /* One entry per Schedule S, in the order the facts were recorded. */
  otherStateCredits?: OtherStateCreditInput[];
  /* The copy being evaluated (0 is the first state). */
  scheduleSCopyIndex?: number;
}
