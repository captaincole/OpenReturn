import type { HsaCoverageType } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";

export interface Form8889FilingInfo extends BaseFilingInfo {
  /** Line 1. */
  hsaCoverageType?: HsaCoverageType;
  hsaCoverageMonths?: number;
  /** Line 2: contributions made outside payroll. */
  hsaOwnContributions?: number;
  /** Line 9: W-2 box 12 code W sum, cents kept. */
  hsaEmployerContributions?: number;
  /** Line 14a: 1099-SA box 1 sum, cents kept. */
  hsaDistributionsTotal?: number;
  /** Line 15: every distribution paid qualified medical expenses. */
  hsaDistributionsAllQualified?: boolean;
}
