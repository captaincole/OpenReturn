/*
 * Form8949FilingInfo — Form 8949 (Sales and Other Dispositions of
 * Capital Assets) specific slots layered on top of BaseFilingInfo.
 *
 * 8949 itemizes individual security sales. Each TradeFact maps 1:1 to a
 * row on the form.
 */

import type { Form8949Box, TradeFactValue } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";
import type { BoxTotals, Form8949Copy } from "./copyPlan.js";

export interface Form8949FilingInfo extends BaseFilingInfo {
  /**
   * Trade facts partitioned by holding period for 8949 row assignment.
   * Each TradeFactValue maps 1:1 to a form row. Short-term trades fill
   * Part I rows in order; long-term trades fill Part II rows. The
   * arrays are empty when the taxpayer has no covered-security sales of
   * that type.
   *
   * Partition rule: held > 1 year (date_sold − date_acquired) ⇒
   * long-term, else short-term. This matches the IRC §1222 split.
   */
  shortTermTrades?: TradeFactValue[];
  longTermTrades?: TradeFactValue[];

  /** The copies to file (copyPlan.ts). Empty when there are no sales. */
  form8949Copies?: Form8949Copy[];
  /**
   * Which copy the Form 8949 bindings fill. The engine evaluates copy 0;
   * the renderer re-evaluates with 1, 2, … for the other copies.
   */
  form8949CopyIndex?: number;
  /** Column totals per box across all copies, in cents. Schedule D reads these. */
  form8949BoxTotals?: Partial<Record<Form8949Box, BoxTotals>>;
}
