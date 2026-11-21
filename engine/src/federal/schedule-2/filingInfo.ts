import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form4137FilingInfo } from "../4137/filingInfo.js";

/* Line 5 adds a second Form 4137 (a spouse's) from its filers. */
export interface Schedule2FilingInfo
  extends BaseFilingInfo, Pick<Form4137FilingInfo, "form4137Filers"> {}
