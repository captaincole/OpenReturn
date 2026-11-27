import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form3468Copy } from "./copies.js";

export interface Form3468FilingInfo extends BaseFilingInfo {
  /* Every Form 3468 of the return (copies.ts); undefined while the form does not file. */
  form3468Copies?: Form3468Copy[];
  /* The copy rendered: copy n prints the nth property, the cooperative form last. */
  form3468CopyIndex?: number;
}
