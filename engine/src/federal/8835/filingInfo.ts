import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form8835Copy } from "./copies.js";

export interface Form8835FilingInfo extends BaseFilingInfo {
  /* Every Form 8835 of the return (copies.ts); undefined while the form does not file. */
  form8835Copies?: Form8835Copy[];
  /* The copy rendered: copy n prints the nth facility, the pass-through form last. */
  form8835CopyIndex?: number;
}
