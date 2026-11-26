import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form4563Filer } from "./lines.js";

export interface Form4563FilingInfo extends BaseFilingInfo {
  /*
   * One Form 4563 for each person who excludes income, the taxpayer first:
   * Part I describes one person's residence, and the header asks for "Your
   * social security number" (irs-4563-form-2025::sec::face-header::b01).
   */
  form4563Filers?: Form4563Filer[];
  /*
   * The facts on this return that hold American Samoa income but file no Form
   * 4563 (the person does not qualify, or the decision files none). "If you do
   * not qualify for the exclusion ... Report all your taxable income"
   * (irs-4563-form-2025::sec::omb-no-1545-0074::b03), and no other form reads
   * these amounts, so Form 1040 line 9 is a gap (results.ts).
   */
  form4563IncomeNotExcluded?: string[];
  /* Which person this copy is for (renderCopies sets it); absent means the first. */
  form4563CopyIndex?: number;
}
