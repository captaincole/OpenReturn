import type { BaseFilingInfo } from "../../filingInfo.js";

export interface Schedule1FilingInfo extends BaseFilingInfo {
  /** Line 3: Schedule C line 31 summed over every business; undefined when any line 31 is blank. */
  businessIncome?: number;
  /** Line 8b: W-2G box 1 sum, cents kept. */
  gamblingWinnings?: number;
  /** Line 8z: 1099-MISC box 3 sum, cents kept. */
  miscOtherIncome?: number;
}
