import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form8283Row } from "./lines.js";

export interface Form8283FilingInfo extends BaseFilingInfo {
  /* The Section A rows of each Form 8283, four to a form (lines.ts form8283Plan). */
  form8283Copies?: Form8283Row[][];
  /* Which form this copy is (renderCopies sets it); absent means the first. */
  form8283CopyIndex?: number;
}
