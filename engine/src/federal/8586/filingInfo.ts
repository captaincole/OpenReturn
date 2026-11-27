import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form8586Lines } from "./lines.js";

export interface Form8586FilingInfo extends BaseFilingInfo {
  /* Lines 1 to 5 (lines.ts); undefined while Form 8586 does not file. */
  lowIncomeHousingCredit?: Form8586Lines;
}
