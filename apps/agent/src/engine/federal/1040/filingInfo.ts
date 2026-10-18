/*
 * Form1040FilingInfo — federal-1040-specific slots layered on top of
 * the shared BaseFilingInfo (identity + cross-form scope).
 *
 * Add a slot here when a 1040 binding first references it. State forms
 * that need one of these slots can import this type directly.
 */

import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Money } from "../../money.js";

export interface Form1040FilingInfo extends BaseFilingInfo {
  /**
   * Digital-assets question (1040 page 1). Every filer must answer it.
   * True when the taxpayer received, sold, or otherwise transacted in a
   * digital asset (crypto, NFT, etc.) during the tax year. The value
   * selects which of the two yes/no checkboxes renders. Undefined means
   * the scenario has not recorded the decision yet; neither checkbox
   * fires, which surfaces the gap loudly.
   */
  hasDigitalAssets?: boolean;

  // ─── W-2 federal aggregates ─────────────────────────────────────────
  /** Sum of W-2 Box 1 (federal taxable wages) across all employers. */
  w2WagesTotal?: Money;
  /** Sum of W-2 Box 2 (federal income tax withheld) across all employers. */
  w2FederalWithholding?: Money;

  // ─── 1099-DIV aggregates ─────────────────────────────────────────────
  /** Sum of 1099-DIV Box 1a across all accounts. */
  ordinaryDividends?: Money;
  /** Sum of 1099-DIV Box 1b across all accounts. */
  qualifiedDividends?: Money;
  /**
   * Line 25b: federal income tax withheld on 1099 forms — 1099-INT,
   * 1099-DIV, and 1099-R box 4, plus SSA-1099 box 6. Undefined when no
   * 1099 withheld anything (the line stays blank).
   */
  form1099FederalWithholding?: Money;
  /**
   * Line 7a when Schedule D is not filed (instructions, line 7a,
   * Exception 1): the sum of 1099-DIV box 2a. Undefined when Schedule D
   * is filed or there are no capital gain distributions.
   */
  capitalGainDistributionsNoScheduleD?: Money;

  // ─── 1099-INT aggregates ─────────────────────────────────────────────
  /** Sum of 1099-INT Box 1 (taxable interest income) across all accounts. */
  taxableInterestTotal?: Money;
  /** Sum of 1099-INT Box 8 (tax-exempt interest) across all accounts. */
  taxExemptInterestTotal?: Money;

  /** Lines 4a–4c (IRA, SEP, SIMPLE: 1099-R box 7 IRA/SEP/SIMPLE checked). */
  iraDistributions?: RetirementLine;
  /** Lines 5a–5c (pensions and annuities: every other 1099-R). */
  pensionDistributions?: RetirementLine;

  /** Line 6a: SSA-1099 / RRB-1099 box 5 (net benefits). Undefined when none. */
  socialSecurityBenefits?: Money;
  /**
   * Married filing separately and lived apart from the spouse all year:
   * the line 6d box, and the $25,000 base on the Social Security
   * Benefits Worksheet instead of 0.
   */
  livedApartFromSpouseAllYear?: boolean;

  /**
   * Refund the federal overpayment in full, or apply some to 2026
   * estimated tax. This is the federal decision. The state analog lives
   * on Form540FilingInfo because a taxpayer can choose differently per
   * jurisdiction.
   */
  refundFullOverpaymentFederal?: boolean;

  /**
   * True when `decisions.itemize_vs_standard === "itemized"`. Flips the
   * line 12e source from the standard deduction table to Schedule A
   * line 17. Undefined or "standard" keeps the standard deduction path.
   */
  useItemizedDeductions?: boolean;
}

/**
 * One 1040 retirement line pair. `taxable` is undefined when any 1099-R
 * leaves box 2a blank with "taxable amount not determined" (Simplified
 * Method, not modeled). `rollover` is true when any distribution is a
 * direct rollover (box 7 code G or H): the "Rollover" box next to (b).
 */
export interface RetirementLine {
  gross: number;
  taxable?: number;
  rollover: boolean;
}
