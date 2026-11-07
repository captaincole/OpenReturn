import type { BaseFilingInfo } from "../../filingInfo.js";

export interface Form4952FilingInfo extends BaseFilingInfo {
  /** Line 1. */
  investmentInterestPaid?: number;
  /** Line 2: last year's Form 4952 line 7. */
  disallowedInterestCarryover?: number;
  /** Line 4g: the amount of qualified dividends and net capital gain elected as investment income. */
  electedQualifiedDividendsAndGain?: number;
  /** Line 5. */
  investmentExpenses?: number;
  /** Line 4a: taxable interest plus ordinary dividends from the 1099 facts. */
  grossInvestmentIncome?: number;
  /** Line 4b: qualified dividends from the 1099-DIV facts. */
  qualifiedDividends?: number;
}
