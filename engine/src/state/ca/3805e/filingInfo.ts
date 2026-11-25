import type { BaseFilingInfo } from "../../../filingInfo.js";
import type { Form3805ETotals } from "./totals.js";

export interface Form3805EFilingInfo extends BaseFilingInfo {
  /* Every sale's form and what the forms send on; undefined when the form does not file. */
  form3805ETotals?: Form3805ETotals;
  /* The copy being printed: an index into form3805ETotals.forms (the first when absent). */
  form3805ECopyIndex?: number;
}
