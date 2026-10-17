/*
 * Form5805FilingInfo — FTB 5805 (Underpayment of Estimated Tax) specific
 * slots layered on top of BaseFilingInfo. Today only Part II (short
 * method) is modeled: payments were withholding (or equal estimates).
 */

import type { BaseFilingInfo } from "../../../filingInfo.js";

export interface Form5805FilingInfo extends BaseFilingInfo {
  /** Prior-year CA tax (fact prior_year.ca_tax). Line 5 base. */
  priorYearCaTax?: number;
  /**
   * Line 5 rate: 1.10 when prior-year AGI was over $150,000 ($75,000 MFS),
   * else 1.00. Uses prior_year.ca_agi, else prior_year.federal_agi as a
   * stand-in (see priorYearAgiSource).
   */
  priorYearSafeHarborRate?: number;
  /** Which fact chose the rate: "ca_agi" or "federal_agi (stand-in)". */
  priorYearAgiSource?: string;
}
