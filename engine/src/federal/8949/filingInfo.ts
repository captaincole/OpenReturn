import type { Form8949Box, TradeFactValue } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";
import type { BoxTotals, Form8949Copy } from "./copyPlan.js";

export interface Form8949FilingInfo extends BaseFilingInfo {
  /** IRC §1222: held more than 1 year ⇒ long-term. */
  shortTermTrades?: TradeFactValue[];
  longTermTrades?: TradeFactValue[];

  form8949Copies?: Form8949Copy[];
  /** The engine evaluates copy 0; the renderer re-evaluates with 1, 2, …. */
  form8949CopyIndex?: number;
  form8949BoxTotals?: Partial<Record<Form8949Box, BoxTotals>>;
}
