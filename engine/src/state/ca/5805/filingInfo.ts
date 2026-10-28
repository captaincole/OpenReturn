/* Only Part II (short method) is modeled: payments were withholding (or equal estimates). */

import type { BaseFilingInfo } from "../../../filingInfo.js";

export interface Form5805FilingInfo extends BaseFilingInfo {
  priorYearCaTax?: number;
  /** Line 5: 1.10 when prior-year AGI > $150,000 ($75,000 MFS), else 1.00. */
  priorYearSafeHarborRate?: number;
  priorYearAgiSource?: string;
}
