import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form8958Table } from "./form.js";

export interface Form8958FilingInfo extends BaseFilingInfo {
  /* The rows of lines 1–12; undefined when the form does not file. No other form reads it. */
  form8958?: Form8958Table;
}
