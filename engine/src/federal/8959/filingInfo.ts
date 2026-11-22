import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Money } from "../../money.js";
import type { Form4137FilingInfo } from "../4137/filingInfo.js";
import type { Form8919FilingInfo } from "../8919/filingInfo.js";

/* Lines 2 and 3 add a second Form 4137 and Form 8919 (a spouse's) from their filers. */
export interface Form8959FilingInfo
  extends
    BaseFilingInfo,
    Pick<Form4137FilingInfo, "form4137Filers">,
    Pick<Form8919FilingInfo, "form8919Filers"> {
  w2MedicareWagesTotal?: Money;
  w2MedicareTaxWithheld?: Money;
}
