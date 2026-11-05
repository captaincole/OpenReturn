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
}
