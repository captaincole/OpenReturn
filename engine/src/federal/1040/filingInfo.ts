import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Money } from "../../money.js";
import type { Schedule8812FilingInfo } from "../schedule-8812/filingInfo.js";

/** The Dependents table reads Schedule 8812's `dependents` slot. */
export interface Form1040FilingInfo
  extends BaseFilingInfo, Pick<Schedule8812FilingInfo, "dependents"> {
  /** Every filer must answer. Undefined fills neither box, so the gap shows. */
  hasDigitalAssets?: boolean;
  w2WagesTotal?: Money;
  w2FederalWithholding?: Money;
  ordinaryDividends?: Money;
  qualifiedDividends?: Money;
  /** Line 25b. */
  form1099FederalWithholding?: Money;
  /** Line 25c: W-2G box 4 sum, not rounded. */
  w2gFederalWithholding?: Money;
  capitalGainDistributionsNoScheduleD?: Money;
  taxableInterestTotal?: Money;
  taxExemptInterestTotal?: Money;
  /** Lines 4a–4c. */
  iraDistributions?: IraLine;
  /** Lines 5a–5c. */
  pensionDistributions?: RetirementLine;
  /** Line 6a. */
  socialSecurityBenefits?: Money;
  /** MFS: the line 6d box, and a $25,000 worksheet base instead of 0. */
  livedApartFromSpouseAllYear?: boolean;
  /** MFS or HOH: the page 1 box (lived apart the last 6 months of the year). */
  livedApartFromSpouseLastSixMonths?: boolean;
  /** MFS or HOH: the page 1 box (legally separated, not in the spouse's household at year end). */
  legallySeparatedApartAtYearEnd?: boolean;
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

/**
 * `taxable` leaves out a Form 8606 Part I filer's traditional IRA rows (line 4b
 * adds line 15c) and every filer's Roth conversions (line 4b adds line 18).
 */
export interface IraLine extends RetirementLine {
  /** People who file Form 8606 (0, 1 or 2). */
  form8606Filers: number;
  /** The one filer's traditional distributions come from Form 8606 line 15c. */
  form8606PartI: boolean;
}
