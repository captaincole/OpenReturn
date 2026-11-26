import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form2555Filer } from "./person.js";

export interface Form2555FilingInfo extends BaseFilingInfo {
  /*
   * One Form 2555 for each person who qualifies, the taxpayer first: "You each
   * must complete Part VII of your separate Forms 2555"
   * (irs-2555-inst-2025::sec::part-vii-taxpayers-claiming-the::b01).
   */
  form2555Filers?: Form2555Filer[];
  /* Which person this copy is for (renderCopies sets it); absent means the first. */
  form2555CopyIndex?: number;
}
