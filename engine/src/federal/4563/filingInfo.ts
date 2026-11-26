import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form4563Filer } from "./lines.js";

export interface Form4563FilingInfo extends BaseFilingInfo {
  /*
   * One Form 4563 for each person who excludes income, the taxpayer first:
   * Part I describes one person's residence, and the header asks for "Your
   * social security number" (irs-4563-form-2025::sec::face-header::b01).
   */
  form4563Filers?: Form4563Filer[];
  /* Which person this copy is for (renderCopies sets it); absent means the first. */
  form4563CopyIndex?: number;
}
