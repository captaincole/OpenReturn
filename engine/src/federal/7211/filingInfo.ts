import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form7211Copy } from "./copies.js";

export interface Form7211FilingInfo extends BaseFilingInfo {
  /* Every Form 7211 of the return (copies.ts); undefined while the form does not file. */
  form7211Copies?: Form7211Copy[];
  /* The copy rendered: copy n prints the nth facility, the pass-through form last. */
  form7211CopyIndex?: number;
}
