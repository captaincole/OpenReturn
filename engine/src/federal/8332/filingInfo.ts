import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form8332Copy } from "./lines.js";

export interface Form8332FilingInfo extends BaseFilingInfo {
  /* One copy for each child: "Attach a separate form for each child" (irs-8332-form-2025::sec::form-8332-rev-december-2025::b01). */
  form8332Copies?: Form8332Copy[];
  /* Which child this copy is for (renderCopies sets it); absent means the first. */
  form8332CopyIndex?: number;
}
