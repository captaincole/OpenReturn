import type { DependentFact } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";

export interface Schedule8812FilingInfo extends BaseFilingInfo {
  /** Every dependent claimed on the return, in the order recorded. */
  dependents?: DependentFact[];
  /** Line 4: dependents whose row (7) "Child tax credit" box is checked. */
  childTaxCreditCount?: number;
  /** Line 6: dependents whose row (7) "Credit for other dependents" box is checked. */
  otherDependentCount?: number;
}
