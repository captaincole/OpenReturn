import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form7213Copy } from "./cells.js";

export interface Form7213FilingInfo extends BaseFilingInfo {
  /* Undefined while Form 7213 does not file, or files with no copy (a blank form). */
  form7213Copies?: Form7213Copy[];
  /* The copy rendered (federal/index.ts). */
  form7213CopyIndex?: number;
}
