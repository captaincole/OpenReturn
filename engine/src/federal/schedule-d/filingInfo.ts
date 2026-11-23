import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Money } from "../../money.js";
import type { Form8814FilingInfo } from "../8814/filingInfo.js";
import type { Form8949FilingInfo } from "../8949/filingInfo.js";
import type { Receipt } from "../passThrough/receipts.js";

/* Line 13 also reads Form 8814's totals (line 10). */
export interface ScheduleDFilingInfo
  extends
    BaseFilingInfo,
    Pick<Form8949FilingInfo, "form8949BoxTotals">,
    Pick<Form8814FilingInfo, "form8814Totals"> {
  // 1099-DIV box 2a, summed across every payer (line 13).
  capitalGainDistributions?: Money;
  // Last year's Capital Loss Carryover Worksheet lines 8 and 13, positive (lines 6 and 14).
  shortTermLossCarryover?: Money;
  longTermLossCarryover?: Money;
  // What the K-1s send to lines 5, 12, 18 and 19 (passThrough/receipts.ts).
  passThroughShortTermGain?: Receipt;
  passThroughLongTermGain?: Receipt;
  passThrough28RateGain?: Receipt;
  passThroughUnrecaptured1250Gain?: Receipt;
}
