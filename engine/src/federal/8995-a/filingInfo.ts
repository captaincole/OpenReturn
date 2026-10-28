/* Only Part IV's REIT dividend path is modeled. */

import type { BaseFilingInfo } from "../../filingInfo.js";

export interface Form8995AFilingInfo extends BaseFilingInfo {
  /** Line 28: 1099-DIV box 5 sum, cents kept. */
  qualifiedReitDividends?: number;
}
