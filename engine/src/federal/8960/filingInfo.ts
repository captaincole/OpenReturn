import type { BaseFilingInfo } from "../../filingInfo.js";

export interface Form8960FilingInfo extends BaseFilingInfo {
  /** Every Schedule C business has line G "Yes" (materially participated): its income is nonpassive. */
  scheduleCNonpassive?: boolean;
}
