/*
 * FTB 3526 mirrors Form 4952 with California amounts: the interest paid and the
 * other expenses are the same answers; the carryover and the income are
 * California's own (no qualified-dividend split, no U.S. obligation interest,
 * last year's FTB 3526 line 7). The bindings read the federal form's
 * disposition lines through the form accessor.
 */

import type { Form4952FilingInfo } from "../../../federal/4952/filingInfo.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";

export interface Form3526FilingInfo
  extends
    BaseFilingInfo,
    Pick<Form4952FilingInfo, "investmentInterestPaid" | "investmentExpenses"> {
  /** Line 2: last year's FTB 3526 line 7 (investment_interest.ca_disallowed_carryover). */
  caDisallowedInterestCarryover?: number;
  /** Line 4a: interest (1099-INT box 1) and ordinary dividends; U.S. obligation interest (box 3) is not California income. */
  caGrossInvestmentIncome?: number;
  /**
   * Line 4e: the net capital gain the taxpayer elects to treat as investment
   * income for California. A separate election from the federal one (form FTB
   * 3526, A Purpose); undefined means no California election was stated.
   */
  caElectedNetCapitalGain?: number;
}
