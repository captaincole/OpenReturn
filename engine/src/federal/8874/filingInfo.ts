import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form8874Lines } from "./lines.js";

export interface Form8874FilingInfo extends BaseFilingInfo {
  /* Lines 1 to 3 (lines.ts); undefined while Form 8874 does not file. */
  newMarketsCredit?: Form8874Lines;
}
