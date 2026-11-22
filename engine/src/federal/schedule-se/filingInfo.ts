import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form4137FilingInfo } from "../4137/filingInfo.js";
import type { Form8919FilingInfo } from "../8919/filingInfo.js";

/* Lines 8b and 8c read the taxpayer's Form 4137 and Form 8919; the filers say whose copy comes first. */
export interface ScheduleSEFilingInfo
  extends
    BaseFilingInfo,
    Pick<Form4137FilingInfo, "form4137Filers">,
    Pick<Form8919FilingInfo, "form8919Filers"> {
  /* The taxpayer's Schedule C net profit (line 31), summed over their businesses. */
  scheduleCNetProfit?: number;
  /* Line 8a: the taxpayer's W-2 boxes 3 and 7, summed; undefined with no taxpayer W-2. */
  w2SocialSecurityWagesAndTips?: number;
}
