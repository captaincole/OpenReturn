/*
 * FTB 3526 mirrors Form 4952 with California amounts: the same answers feed it
 * (interest paid, the carryover, the elected gain, other expenses). California
 * has no qualified-dividend split, so the form's line 4 differs from the
 * federal one; the bindings read the federal lines through the form accessor.
 */

import type { Form4952FilingInfo } from "../../../federal/4952/filingInfo.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";

export interface Form3526FilingInfo
  extends
    BaseFilingInfo,
    Pick<
      Form4952FilingInfo,
      | "investmentInterestPaid"
      | "disallowedInterestCarryover"
      | "investmentExpenses"
      | "grossInvestmentIncome"
    > {
  /**
   * Line 4e: the net capital gain the taxpayer elects to treat as investment
   * income for California. A separate election from the federal one (form FTB
   * 3526, A Purpose); undefined means no California election was stated.
   */
  caElectedNetCapitalGain?: number;
}
