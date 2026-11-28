import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form7207Copy } from "./copies.js";

export interface Form7207FilingInfo extends BaseFilingInfo {
  /* Every Form 7207 of the return (copies.ts); undefined while the form does not file. */
  form7207Copies?: Form7207Copy[];
  /* The copy rendered: copy n prints the nth facility, the pass-through form last. */
  form7207CopyIndex?: number;
}
