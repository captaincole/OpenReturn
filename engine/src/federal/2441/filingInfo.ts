import type { DependentCareProviderFactValue } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";

/* Line 2: one qualifying person, with the name and SSN from the dependent fact when it names one. */
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
 */
export interface Form2441FilingInfo extends BaseFilingInfo {
  /** Line 1, in the order recorded. */
  dependentCareProviders?: DependentCareProviderFactValue[];
  /** Line 2, in the order recorded. */
  dependentCarePersons?: DependentCarePersonRow[];
  /** Line 12: W-2 box 10, every W-2 on the return. */
  dependentCareBenefits?: number;
  /** Lines 4 and 5 on a joint return: each spouse's W-2 box 1; undefined while a W-2 cannot be placed. */
  dependentCareTaxpayerW2Wages?: number;
  dependentCareSpouseW2Wages?: number;
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
