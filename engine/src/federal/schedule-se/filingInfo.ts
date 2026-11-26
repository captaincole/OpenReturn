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
  /* The taxpayer has a business whose line 31 is still blank: line 3 waits. */
  scheduleCNetProfitWaits?: boolean;
  /* Line 1a: the taxpayer's Schedule F line 34, summed over their farms; undefined with no farm or while one waits. */
  farmNetProfit?: number;
  /* Line 1a cannot be figured: a farm's line 34 is a case the engine does not handle. */
  farmNetProfitGap?: string;
  /* A taxpayer's farm whose line 34 still waits: line 3 waits too. */
  farmNetProfitWaits?: boolean;
  /* Line 1b: the taxable CRP payments the taxpayer's farms received while on social security, cents kept. */
  crpPayments?: number;
  /* Line 3 from facts (lines 1a and 2 less 1b); undefined with no self-employment or while a part waits. */
  selfEmploymentLine3?: number;
  /* Line 8a: the taxpayer's W-2 boxes 3 and 7, summed; undefined with no taxpayer W-2. */
  w2SocialSecurityWagesAndTips?: number;
}
