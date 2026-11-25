import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form8824Totals } from "./totals.js";

/* Schedule D reads form8824Totals for lines 4, 11 and 19; Form 4797 figures its own from the facts. */
export interface Form8824FilingInfo extends BaseFilingInfo {
  /* Every exchange and Part IV sale that files this year; undefined with none. */
  form8824Totals?: Form8824Totals;
}
