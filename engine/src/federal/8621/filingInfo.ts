import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form8621Totals } from "./totals.js";

export interface Form8621FilingInfo extends BaseFilingInfo {
  /* Every fund's form and the amounts they send to other forms; undefined with no fund fact. */
  form8621Totals?: Form8621Totals;
  /* The copy being printed: an index into form8621Totals.filed (the first when absent). */
  form8621CopyIndex?: number;
}
