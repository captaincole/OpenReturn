import type { MortgageCreditCertificateFactValue } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";

/* Lines 4 to 6: the credit carried forward from the 2024 Form 8396, as stated. */
export interface MortgageCreditCarryforwards {
  from2022?: number;
  from2023?: number;
  from2024?: number;
}

export interface Form8396FilingInfo extends BaseFilingInfo {
  mortgageCreditCertificate?: MortgageCreditCertificateFactValue;
  mortgageCreditCarryforwards?: MortgageCreditCarryforwards;
}
