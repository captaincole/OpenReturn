import type { BaseFilingInfo } from "../../filingInfo.js";

export interface ScheduleSEFilingInfo extends BaseFilingInfo {
  /* The taxpayer's Schedule C net profit (line 31), summed over their businesses. */
  scheduleCNetProfit?: number;
}
