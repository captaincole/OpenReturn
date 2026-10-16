/*
 * Form8889FilingInfo — Form 8889 (Health Savings Accounts) specific
 * slots layered on top of BaseFilingInfo. Inputs: HSA coverage facts
 * (hsa.*), W-2 box 12 code W (employer contributions), and 1099-SA
 * distributions.
 */

import type { HsaCoverageType } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";
import type { EngineDerivation } from "../../types.js";

export interface Form8889FilingInfo extends BaseFilingInfo {
  /**
   * Form 8889 must-file determination. Driven by
   * `decisions.scope.must_file_8889`, with a fallback to "any HSA fact"
   * (coverage, W-2 code W, or 1099-SA).
   */
  mustFile8889?: boolean;
  /** Provenance for mustFile8889. */
  mustFile8889Derivation?: EngineDerivation;
  /** Line 1: HDHP coverage type (fact hsa.coverage_type). */
  hsaCoverageType?: HsaCoverageType;
  /** Months of HDHP coverage (fact hsa.coverage_months). */
  hsaCoverageMonths?: number;
  /** Line 2: contributions the taxpayer made outside payroll (fact hsa.own_contributions). */
  hsaOwnContributions?: number;
  /** Line 9: employer contributions, sum of W-2 box 12 code W (cents kept). */
  hsaEmployerContributions?: number;
  /** Line 14a: sum of 1099-SA box 1 (cents kept). Undefined without 1099-SA facts. */
  hsaDistributionsTotal?: number;
  /** Line 15: every distribution paid qualified medical expenses (fact hsa.distributions_all_qualified). */
  hsaDistributionsAllQualified?: boolean;
}
