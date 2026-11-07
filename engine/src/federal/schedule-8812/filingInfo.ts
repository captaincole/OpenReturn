import type { DependentCredit, DependentFactValue } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";

/*
 * One dependent with every derived Dependents-table answer decided in one
 * place (the Schedule 8812 resolver): undefined while an answer is missing.
 */
export interface DependentRow {
  factKey: string;
  dependent: DependentFactValue;
  /** Row (5)(a): lived with the taxpayer more than half the year. */
  livedWithYouOverHalfYear: boolean | undefined;
  /** Row (5)(b): and in the U.S., a sub-question of (a). */
  livedWithYouInUs: boolean | undefined;
  /** Row (7): the credit box. */
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
