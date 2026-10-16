/*
 * Form8960FilingInfo — Form 8960 (Net Investment Income Tax) specific
 * slots layered on top of BaseFilingInfo.
 *
 * Every computed line reads other forms (1040 lines 2b, 3b, 7a, 11b;
 * Schedule 1; Schedule A line 9), so the only slot is the must-file
 * determination. The filing-status threshold is a binding-side lookup.
 */

import type { BaseFilingInfo } from "../../filingInfo.js";
import type { EngineDerivation } from "../../types.js";

export interface Form8960FilingInfo extends BaseFilingInfo {
  /**
   * Form 8960 must-file determination. Driven by
   * `decisions.scope.must_file_8960`, with a fallback described on
   * resolve8960Info.
   */
  mustFile8960?: boolean;
  /** Provenance for mustFile8960. */
  mustFile8960Derivation?: EngineDerivation;
}
