import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form7218Copy } from "./copies.js";

export interface Form7218FilingInfo extends BaseFilingInfo {
  /* Every Form 7218 of the return (copies.ts); undefined while the form does not file. */
  form7218Copies?: Form7218Copy[];
  /* The copy rendered: copy n prints the nth facility, the pass-through form last. */
  form7218CopyIndex?: number;
}
