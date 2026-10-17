/*
 * Form8995AFilingInfo — Form 8995-A (Qualified Business Income Deduction)
 * specific slots layered on top of BaseFilingInfo. Today only Part IV's
 * REIT dividend path is modeled (no trade or business scenario yet).
 */

import type { BaseFilingInfo } from "../../filingInfo.js";

export interface Form8995AFilingInfo extends BaseFilingInfo {
  /** Line 28: sum of 1099-DIV box 5 (section 199A dividends), cents kept. */
  qualifiedReitDividends?: number;
}
