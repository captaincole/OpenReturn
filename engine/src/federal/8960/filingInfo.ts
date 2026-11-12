import type { BaseFilingInfo } from "../../filingInfo.js";
import type { RentalProperty } from "../schedule-e/filingInfo.js";

export interface Form8960FilingInfo extends BaseFilingInfo {
  /** Every Schedule C business has line G "Yes" (materially participated): its income is nonpassive. */
  scheduleCNonpassive?: boolean;
  /** Line 4b: the Schedule E Part I properties, when Schedule E files. */
  rentalProperties?: RentalProperty[];
  /** Line 9b: the part of the deducted Schedule A state and local taxes (line 5e, after the cap) allocated to NII (the taxpayer's answer). */
  stateLocalTaxAllocableToInvestmentIncome?: number;
}
