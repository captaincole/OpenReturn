import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form6252Totals } from "./totals.js";

export interface Form6252FilingInfo extends BaseFilingInfo {
  /* Every sale's form and what the forms send on; undefined when the form does not file. */
  form6252Totals?: Form6252Totals;
  /* The copy being printed: an index into form6252Totals.forms (the first when absent). */
  form6252CopyIndex?: number;
}
