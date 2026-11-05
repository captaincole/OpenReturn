import type { BaseFilingInfo } from "../../filingInfo.js";

export interface ScheduleSEFilingInfo extends BaseFilingInfo {
  /* The taxpayer's Schedule C net profit (line 31), summed over their businesses. */
  scheduleCNetProfit?: number;
  /* Line 8a: the taxpayer's W-2 boxes 3 and 7, summed; undefined with no taxpayer W-2. */
  w2SocialSecurityWagesAndTips?: number;
}
