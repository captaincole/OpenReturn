import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Money } from "../../money.js";

export interface Form1040FilingInfo extends BaseFilingInfo {
  /** Every filer must answer. Undefined fills neither box, so the gap shows. */
  hasDigitalAssets?: boolean;
  w2WagesTotal?: Money;
  w2FederalWithholding?: Money;
  ordinaryDividends?: Money;
  qualifiedDividends?: Money;
  /** Line 25b. */
  form1099FederalWithholding?: Money;
  capitalGainDistributionsNoScheduleD?: Money;
  taxableInterestTotal?: Money;
  taxExemptInterestTotal?: Money;
  /** Lines 4a–4c. */
  iraDistributions?: RetirementLine;
  /** Lines 5a–5c. */
  pensionDistributions?: RetirementLine;
  /** Line 6a. */
  socialSecurityBenefits?: Money;
  /** MFS: the line 6d box, and a $25,000 worksheet base instead of 0. */
  livedApartFromSpouseAllYear?: boolean;
  /** MFS: the line 12b box. */
  spouseItemizesSeparately?: boolean;
  /** Federal only. Form 540 has its own: a taxpayer can choose per jurisdiction. */
  refundFullOverpaymentFederal?: boolean;
  useItemizedDeductions?: boolean;
}

/** `taxable` is undefined when a 1099-R needs the Simplified Method or Form 8606 (not modeled). */
export interface RetirementLine {
  gross: number;
  taxable?: number;
  rollover: boolean;
}
