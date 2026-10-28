import type { BaseFilingInfo } from "../../filingInfo.js";

export interface ScheduleAFilingInfo extends BaseFilingInfo {
  /** Line 1. */
  medicalDentalExpenses?: number;

  /**
   * Line 5a, cash basis: W-2 box 17 + CA SDI (box 14) + state estimates +
   * prior-year balance paid this year − last year's itemized refunds.
   */
  stateLocalIncomeTaxPaid?: number;

  /** Line 5a checkbox. */
  generalSalesTaxElection?: boolean;

  /** Line 5b. */
  realEstateTaxes?: number;

  /** Line 5c. */
  personalPropertyTaxes?: number;

  /** Line 8a: Form 1098 box 1. Only one 1098 is supported. */
  mortgageInterestForm1098?: number;

  /** Line 8b. */
  mortgageInterestNotForm1098?: number;

  /** Line 8c. */
  pointsNotForm1098?: number;

  /** Line 9. */
  investmentInterest?: number;

  /** Line 11. */
  giftsCashCheck?: number;

  /** Line 12. */
  giftsOtherThanCash?: number;

  /** Line 13. */
  giftsCarryover?: number;
}
