import type { OtherIncomeItem } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";

export interface Schedule1FilingInfo extends BaseFilingInfo {
  /** Line 3: Schedule C line 31 summed over every business; undefined when any line 31 is blank. */
  businessIncome?: number;
  /**
   * A business fact is on this return (spouse's and unreadable ones too). Line 10
   * tells a waiting line 3 (true) from no business (false).
   */
  hasBusiness?: boolean;
  /** Line 8b: W-2G box 1 sum, cents kept. */
  gamblingWinnings?: number;
  /** Line 8z: 1099-MISC box 3 sum, cents kept. */
  miscOtherIncome?: number;
  /** Line 8g: the Alaska Permanent Fund dividend the taxpayer states, cents kept. */
  alaskaPermanentFundDividends?: number;
  /** Line 2a: alimony received, and whether its agreement predates 2019 (undefined while the date is missing). */
  alimonyReceived?: number;
  alimonyReceivedTaxable?: boolean;
  /** Line 2b: YYYY-MM-DD. */
  alimonyReceivedAgreementDate?: string;
  /** Lines 8h, 8i, 8k. */
  juryDutyPay?: number;
  prizesAndAwards?: number;
  stockOptions?: number;
  /** Line 8z: other income the taxpayer lists. */
  otherIncomeItems?: OtherIncomeItem[];
  /** Line 16. */
  selfEmployedPlanDeduction?: number;
  /** Lines 19a–19c. */
  alimonyPaid?: number;
  alimonyPaidDeductible?: boolean;
  alimonyPaidAgreementDate?: string;
  alimonyRecipientSsn?: string;
  /** Lines 24a, 24d, 24e, 24f (W-2 box 12 code H), 24h, 24i. */
  juryDutyPayToEmployer?: number;
  reforestation?: number;
  tradeActBenefitRepayment?: number;
  section501c18dContributions?: number;
  discriminationClaimFees?: number;
  whistleblowerAwardFees?: number;
  /** Line 20: the IRA Deduction Worksheet's answers for the taxpayer's IRA. */
  iraContributions?: number;
  iraCoveredAtWork?: boolean;
  iraAge50OrOlder?: boolean;
  iraWages?: number;
  /** W-2 box 12 code T: excluded adoption benefits send a covered person to Pub. 590-A. */
  iraAdoptionBenefits?: boolean;
  livedApartAllYear?: boolean;
  /** Social Security with a traditional IRA contribution and a plan: Pub. 590-A figures line 20 (pub590a.ts). */
  pub590aWorksheets?: boolean;
}
