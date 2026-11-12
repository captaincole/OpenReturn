import type { MarketplaceCoverageAmounts } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";

export interface Form8962FilingInfo extends BaseFilingInfo {
  /** Line A: an MFS filer who qualifies for Exception 2 (domestic abuse or spousal abandonment). */
  ptcMfsException?: boolean;
  /** Line 9: the taxpayer allocates policy amounts (Part IV) or uses the year-of-marriage calculation (Part V). */
  ptcAllocatesPolicyOrMarriageCalc?: boolean;
  /** How many Forms 1095-A the taxpayer has. */
  marketplaceStatementCount?: number;
  /** Form 1095-A line 33, columns A–C, added over every Form 1095-A. */
  marketplaceAnnualTotals?: MarketplaceCoverageAmounts;
  /** Form 1095-A lines 21–32, columns A–C, January first, added over every Form 1095-A. */
  marketplaceMonthlyTotals?: MarketplaceCoverageAmounts[];
  /** Per month, January first: the Forms 1095-A with a column A or B amount that month. */
  marketplaceMonthlyStatementCounts?: number[];
  /**
   * Line 10 "Yes" test from the documents: every Form 1095-A covers all 12
   * months, and columns A and B are each the same every month.
   */
  marketplaceSameEveryMonth?: boolean;
  /** Dependents the taxpayer lists (tax family size, line 1; dependents' MAGI, line 2b). */
  dependentCount?: number;
}
