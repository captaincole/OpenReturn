import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Money } from "../../money.js";
import type { Form4797FilingInfo } from "../4797/filingInfo.js";
import type { Form6252FilingInfo } from "../6252/filingInfo.js";
import type { Form8621FilingInfo } from "../8621/filingInfo.js";
import type { Form8814FilingInfo } from "../8814/filingInfo.js";
import type { Form8824FilingInfo } from "../8824/filingInfo.js";
import type { Form8949FilingInfo } from "../8949/filingInfo.js";
import type { Receipt } from "../passThrough/receipts.js";

/*
 * Line 13 also reads Form 8814's totals (line 10); line 11 reads Form 4797's and
 * Form 8621's (line 7c); lines 4, 11 and 19 read Form 6252's and Form 8824's.
 */
export interface ScheduleDFilingInfo
  extends
    BaseFilingInfo,
    Pick<Form6252FilingInfo, "form6252Totals">,
    Pick<Form8949FilingInfo, "form8949BoxTotals">,
    Pick<Form8814FilingInfo, "form8814Totals">,
    Pick<Form8621FilingInfo, "form8621Totals">,
    Pick<Form8824FilingInfo, "form8824Totals">,
    Pick<
      Form4797FilingInfo,
      "form4797" | "form4797Gap" | "form4797SummaryGap" | "form4797Section1250"
    > {
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
  // 1099-DIV box 2b and box 2d, every payer: the Unrecaptured Section 1250 Gain Worksheet lines 11 and 14 (line 19).
  dividendUnrecaptured1250Gain?: number;
  dividendCollectiblesGain?: number;
}
