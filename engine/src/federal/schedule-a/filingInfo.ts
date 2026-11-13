import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form1040FilingInfo } from "../1040/filingInfo.js";
import type { Form4952FilingInfo } from "../4952/filingInfo.js";

/*
 * Line 9 reads Form 4952 line 8 through the form accessor; the 4952 answer
 * covers the no-file exception. Line 16 figures the standard deduction (line
 * 12b's MFS answer) for the increased standard deduction, and line 18 reads
 * whether the federal return itemizes.
 */
export interface ScheduleAFilingInfo
  extends
    BaseFilingInfo,
    Pick<Form4952FilingInfo, "investmentInterestPaid" | "noFormException">,
    Pick<Form1040FilingInfo, "spouseItemizesSeparately" | "useItemizedDeductions"> {
  /** Line 1. */
  medicalDentalExpenses?: number;

  /**
   * Line 5a, cash basis: W-2 box 17 + CA SDI (box 14) + state estimates +
   * prior-year balance paid this year − last year's itemized refunds.
   */
  stateLocalIncomeTaxPaid?: number;

  /** Line 5a checkbox. */
  generalSalesTaxElection?: boolean;

  /** Line 5a with the election: state and local general sales taxes paid. */
  generalSalesTaxPaid?: number;

  /** Line 5b. */
  realEstateTaxes?: number;

  /** Line 5c. */
  personalPropertyTaxes?: number;

  /** Line 8a: Form 1098 box 1. Only one 1098 is supported. */
  mortgageInterestForm1098?: number;
  /**
   * The 1098 interest is stated but line 8a cannot print it yet: the principal is
   * over the acquisition-debt limit (Pub. 936 is not modeled) or an answer the
   * limit needs is missing. Lines 8e, 10 and 17 wait with it.
   */
  mortgageInterestWaits?: boolean;

  /** Line 8b. */
  mortgageInterestNotForm1098?: number;

  /** Line 8c. */
  pointsNotForm1098?: number;

  /** Line 11. */
  giftsCashCheck?: number;

  /** Line 12. */
  giftsOtherThanCash?: number;

  /** Line 13. */
  giftsCarryover?: number;

  /** Line 16: Form 4684 line 15 when it is a net qualified disaster loss; 0 with none; undefined while its totals wait. */
  netQualifiedDisasterLoss?: number;

  /** Why Form 4684's totals cannot be figured (an engine gap); undefined when they can, or only wait. */
  disasterLossGap?: string;

  /**
   * Schedule A files only for the increased standard deduction: the return
   * takes the standard deduction with a net qualified disaster loss. Only line
   * 16 prints. Undefined while Form 4684's totals wait.
   */
  increasedStandardDeduction?: boolean;

  /** Line 16: gambling losses as stated; the binding limits them to Schedule 1 line 8b. */
  gamblingLosses?: number;
  /** Line 6: other taxes and their type (irs-1040sa-inst-2025::sec::line-6-2::b01). */
  otherTaxes?: number;
  otherTaxesDescription?: string;
  /** Line 16: impairment-related work expenses of a disabled person. */
  impairmentRelatedWorkExpenses?: number;
}
