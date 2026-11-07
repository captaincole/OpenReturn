import type { BaseFilingInfo } from "../../filingInfo.js";

export interface Form8960FilingInfo extends BaseFilingInfo {
  /** Every Schedule C business has line G "Yes" (materially participated): its income is nonpassive. */
  scheduleCNonpassive?: boolean;
  /** Line 9b: the part of the deducted Schedule A state and local taxes (line 5e, after the cap) allocated to NII (the taxpayer's answer). */
  stateLocalTaxAllocableToInvestmentIncome?: number;
}
