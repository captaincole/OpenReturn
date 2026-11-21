import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form8814FilingInfo } from "../8814/filingInfo.js";

/* Line 4a also reads Form 8814's totals. */
export interface Form4952FilingInfo
  extends BaseFilingInfo, Pick<Form8814FilingInfo, "form8814Totals"> {
  /** Line 1. */
  investmentInterestPaid?: number;
  /** Who Must File's exception: the interest is deducted on Schedule A line 9 without the form. */
  noFormException?: boolean;
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
