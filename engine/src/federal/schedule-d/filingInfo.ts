import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Money } from "../../money.js";
import type { Form8949FilingInfo } from "../8949/filingInfo.js";

export interface ScheduleDFilingInfo
  extends BaseFilingInfo, Pick<Form8949FilingInfo, "form8949BoxTotals"> {
  // 1099-DIV box 2a, summed across every payer (line 13).
  capitalGainDistributions?: Money;
}
