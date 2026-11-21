import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Money } from "../../money.js";
import type { Form4137FilingInfo } from "../4137/filingInfo.js";

/* Line 2 adds a second Form 4137 (a spouse's) from its filers. */
export interface Form8959FilingInfo
  extends BaseFilingInfo, Pick<Form4137FilingInfo, "form4137Filers"> {
  w2MedicareWagesTotal?: Money;
  w2MedicareTaxWithheld?: Money;
}
