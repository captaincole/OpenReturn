/*
 * ScheduleHFilingInfo — Schedule H (Household Employment Taxes) slots
 * layered on top of BaseFilingInfo. resolveInfo.ts fills them from the
 * household-employee W-2 facts (facts/kinds/householdEmployment.ts).
 */

import type { BaseFilingInfo } from "../../filingInfo.js";

/** One household employee, from the W-2 the taxpayer issued. */
export interface HouseholdEmployee {
  name: string;
  /** W-2 box 3: cash wages subject to social security tax. */
  socialSecurityWages: number;
  /** W-2 box 5: cash wages subject to Medicare tax. */
  medicareWages: number;
  /** W-2 box 2: federal income tax withheld. */
  federalTaxWithheld: number;
}

export interface ScheduleHFilingInfo extends BaseFilingInfo {
  householdEmployees?: readonly HouseholdEmployee[];
  /** The taxpayer's EIN as a household employer (W-2 box b). */
  householdEmployerEin?: string;
  /** Line C / line 9: $1,000+ cash wages in any quarter of 2024 or 2025. */
  householdPaid1000InAQuarter?: boolean;
}
