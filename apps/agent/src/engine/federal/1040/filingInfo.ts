/*
 * Form1040FilingInfo — federal-1040-specific slots layered on top of
 * the shared BaseFilingInfo (identity + cross-form scope).
 *
 * Add a slot here when a 1040 binding first references it. State forms
 * that need one of these slots can import this type directly.
 */

import type { BaseFilingInfo } from "../../filingInfo.js";
import type { EngineDerivation } from "../../types.js";
import type { Money } from "../../values.js";

export interface Form1040FilingInfo extends BaseFilingInfo {
  /** Federal Form 1040 must-file determination. */
  mustFileFederal?: boolean;
  /** Provenance for mustFileFederal — populated by resolveFilingInfo. */
  mustFileFederalDerivation?: EngineDerivation;

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
  /** Sum of 1099 Box 4 (federal income tax withheld on 1099 forms). */
  form1099FederalWithholding?: Money;

  // ─── 1099-INT aggregates ─────────────────────────────────────────────
  /** Sum of 1099-INT Box 1 (taxable interest income) across all accounts. */
  taxableInterestTotal?: Money;
  /** Sum of 1099-INT Box 8 (tax-exempt interest) across all accounts. */
  taxExemptInterestTotal?: Money;

  /** Lines 4a–4c (IRA, SEP, SIMPLE: 1099-R box 7 IRA/SEP/SIMPLE checked). */
  iraDistributions?: RetirementLine;
  /** Lines 5a–5c (pensions and annuities: every other 1099-R). */
  pensionDistributions?: RetirementLine;

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
