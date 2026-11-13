import type { ActivityDepreciation } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";

/* One business or rental that files Form 4562, with its answers. */
export interface Form4562Activity {
  factKey: string;
  /* The header's business or activity name. */
  name: string;
  depreciation: ActivityDepreciation;
}

export interface Form4562FilingInfo extends BaseFilingInfo {
  /* One Form 4562 per business or activity (irs-4562-inst-2025::sec::who-must-file::b01). */
  form4562Activities?: Form4562Activity[];
  /* Which activity this copy is for (renderCopies sets it); absent means the first. */
  form4562CopyIndex?: number;
}
