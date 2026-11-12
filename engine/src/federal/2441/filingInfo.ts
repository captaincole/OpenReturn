import type { DependentCareProviderFactValue } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";
import type { QbiFilingInfo } from "../qbi/filingInfo.js";
import type { Schedule1FilingInfo } from "../schedule-1/filingInfo.js";

/*
 * Line 2: one qualifying person, with the name and SSN from the dependent fact
 * when it names one. The resolver leaves out a person who does not qualify.
 */
export interface DependentCarePersonRow {
  factKey: string;
  firstName?: string;
  lastName?: string;
  ssn?: string;
  /* Age on December 31; undefined with no date of birth. */
  ageAtYearEnd?: number;
  unableToCareForSelf?: boolean;
  expensesPaid: number;
}

/*
 * Form 2441 reads the answers below; lines 4, 5, 7 and 10 read Form 1040,
 * Schedule SE, Schedule 1 and Schedule 3 through the form accessor.
 * MANUAL EDIT: lines 4 and 5 read Schedule 1 line 3 when a business files no
 * Schedule SE (hasBusiness, and qbiScheduleSEFiled from the QBI resolver).
 */
export interface Form2441FilingInfo
  extends
    BaseFilingInfo,
    Pick<Schedule1FilingInfo, "hasBusiness">,
    Pick<QbiFilingInfo, "qbiScheduleSEFiled"> {
  /** Line 1, in the order recorded. */
  dependentCareProviders?: DependentCareProviderFactValue[];
  /** Line 2, in the order recorded. */
  dependentCarePersons?: DependentCarePersonRow[];
  /** Line 12: W-2 box 10, every W-2 on the return. */
  dependentCareBenefits?: number;
  /** Line 12: each W-2's box 10 above zero, one plan each. */
  dependentCareBenefitsByW2?: number[];
  /** Lines 4 and 5 on a joint return: each spouse's W-2 box 1; undefined while a W-2 cannot be placed. */
  dependentCareTaxpayerW2Wages?: number;
  dependentCareSpouseW2Wages?: number;
  /** Lines 4 and 5 on a joint return: each spouse's disability pensions on Form 1040 line 1h; undefined while an answer is missing. */
  dependentCareTaxpayerDisabilityWages?: number;
  dependentCareSpouseDisabilityWages?: number;
  /** Line 9b. */
  dependentCarePriorYearExpensesPaid?: number;
  /** Line A (MFS). */
  dependentCareMfsTreatedAsUnmarried?: boolean;
  /** Line B (MFJ): a spouse was a full-time student or unable to care for themselves. */
  dependentCareStudentOrDisabledSpouse?: boolean;
  /** Lines 13, 14, 16 and 21. */
  dependentCareGracePeriodCarryover?: number;
  dependentCareBenefitsForfeited?: number;
  dependentCareExpensesIncurred?: number;
  dependentCarePlanExclusionLimit?: number;
}
