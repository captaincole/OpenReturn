/*
 * Schedule1FilingInfo — Schedule 1 (Additional Income and Adjustments to
 * Income) specific slots layered on top of BaseFilingInfo.
 */

import type { BaseFilingInfo } from "../../filingInfo.js";

export interface Schedule1FilingInfo extends BaseFilingInfo {
  /** Line 8z: sum of 1099-MISC box 3 (other income), cents kept. Undefined without 1099-MISC facts. */
  miscOtherIncome?: number;
}
