import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form4136Result } from "./form.js";

export interface Form4136FilingInfo extends BaseFilingInfo {
  /* The printed Form 4136; undefined with no claim or with a gap. */
  form4136?: Form4136Result;
  /* Why every Part II line, line 17 and Schedule 3 line 12 are unsupported (a claim the engine cannot place). */
  form4136Gap?: string;
}
