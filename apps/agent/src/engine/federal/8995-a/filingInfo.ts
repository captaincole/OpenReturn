/*
 * Form8995AFilingInfo — Form 8995-A (Qualified Business Income Deduction)
 * specific slots layered on top of BaseFilingInfo. Today only Part IV's
 * REIT dividend path is modeled (no trade or business scenario yet).
 */

import type { BaseFilingInfo } from "../../filingInfo.js";
import type { EngineDerivation } from "../../types.js";

export interface Form8995AFilingInfo extends BaseFilingInfo {
  /**
   * Form 8995-A must-file determination. Driven by
   * `decisions.scope.must_file_8995_a`, with a fallback to "qualified REIT
   * dividends exist". Form 8995 (the simple form, below the taxable-income
   * threshold) is not modeled, so an explicit decision should pick 8995-A.
   */
  mustFile8995A?: boolean;
  /** Provenance for mustFile8995A. */
  mustFile8995ADerivation?: EngineDerivation;
  /** Line 28: sum of 1099-DIV box 5 (section 199A dividends), cents kept. */
  qualifiedReitDividends?: number;
}
