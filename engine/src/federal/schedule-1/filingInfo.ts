import type { BaseFilingInfo } from "../../filingInfo.js";

export interface Schedule1FilingInfo extends BaseFilingInfo {
  /** Line 3: Schedule C line 31 summed over every business; undefined when any line 31 is blank. */
  businessIncome?: number;
  /**
   * A business fact is on this return (spouse's and unreadable ones too). Line 10
   * tells a waiting line 3 (true) from no business (false).
   */
  hasBusiness?: boolean;
  /** Line 8b: W-2G box 1 sum, cents kept. */
  gamblingWinnings?: number;
  /** Line 8z: 1099-MISC box 3 sum, cents kept. */
  miscOtherIncome?: number;
  /** Line 8g: the Alaska Permanent Fund dividend the taxpayer states, cents kept. */
  alaskaPermanentFundDividends?: number;
  /** Line 11: the educator expense deduction, at most $300 per eligible educator. */
  educatorExpenses?: number;
  /** Line 18: 1099-INT box 2 sum, cents kept. */
  earlyWithdrawalPenalty?: number;
  /** Line 21: Form 1098-E box 1 summed, cents kept; undefined with no Form 1098-E. */
  studentLoanInterestPaid?: number;
  /** Line 21: a Form 1098-E has box 2 checked (Pub. 970 figures the deduction). */
  studentLoanBox2Checked?: boolean;
  /** Line 21: the taxpayer, or the spouse on a joint return, is claimed as another person's dependent. */
  studentLoanClaimedAsDependent?: boolean;
}
