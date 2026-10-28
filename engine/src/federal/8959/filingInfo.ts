import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Money } from "../../money.js";

export interface Form8959FilingInfo extends BaseFilingInfo {
  w2MedicareWagesTotal?: Money;
  w2MedicareTaxWithheld?: Money;
}
