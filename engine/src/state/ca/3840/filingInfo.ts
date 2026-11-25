import type { BaseFilingInfo } from "../../../filingInfo.js";
import type { Form3840State } from "./exchanges.js";

export interface Form3840FilingInfo extends BaseFilingInfo {
  /* The printed copy's exchange, or its gap; undefined when the form does not file. */
  form3840?: Form3840State;
  /* One copy for each exchange that files (g-multiple-exchanges::b01); copy 0 is form3840. */
  form3840Copies?: Form3840State[];
  /* Form 540 or Form 540NR files: the form is attached to it and not signed (ca-3840-inst-2025::sec::e-signature::b01). */
  form3840Attached?: boolean;
}
