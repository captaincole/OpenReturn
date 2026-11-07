import type { DependentCredit, DependentFactValue } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";

/* One dependent with the row (7) box the engine decided for it (undefined while an answer is missing). */
export interface DependentRow {
  factKey: string;
  dependent: DependentFactValue;
  credit: DependentCredit | undefined;
}

export interface Schedule8812FilingInfo extends BaseFilingInfo {
  /** Every dependent claimed on the return, in the order recorded. */
  dependents?: DependentRow[];
  /** Line 4: dependents whose row (7) "Child tax credit" box is checked. */
  childTaxCreditCount?: number;
  /** Line 6: dependents whose row (7) "Credit for other dependents" box is checked. */
  otherDependentCount?: number;
}
