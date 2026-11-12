import type { DependentCredit, DependentFactValue } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Money } from "../../money.js";
import type { EicLineSlot } from "../schedule-eic/eicAnswers.js";
import type { ScheduleSEFilingInfo } from "../schedule-se/filingInfo.js";

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

/* Line 24 reads Form 1040 line 27a's outcome: the EIC slot and Schedule SE's net profit. */
export interface Schedule8812FilingInfo
  extends BaseFilingInfo, EicLineSlot, Pick<ScheduleSEFilingInfo, "scheduleCNetProfit"> {
  /** Every dependent claimed on the return, in the order recorded. */
  dependents?: DependentRow[];
  /** Line 4: dependents whose row (7) "Child tax credit" box is checked. */
  childTaxCreditCount?: number;
  /** Line 6: dependents whose row (7) "Credit for other dependents" box is checked. */
  otherDependentCount?: number;
  /** Line 18b: W-2 box 12 code Q on every W-2; undefined when no W-2 has one. */
  w2NontaxableCombatPay?: Money;
  /** Line 21: W-2 box 4 (social security tax withheld) on every W-2. */
  w2SocialSecurityTaxWithheld?: Money;
  /** Line 21: W-2 box 6 (Medicare tax withheld) on every W-2. */
  w2MedicareTaxWithheld?: Money;
}
