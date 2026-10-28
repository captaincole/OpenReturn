import type { BaseFilingInfo } from "../../filingInfo.js";

export interface HouseholdEmployee {
  name: string;
  socialSecurityWages: number;
  medicareWages: number;
  federalTaxWithheld: number;
}

export interface ScheduleHFilingInfo extends BaseFilingInfo {
  householdEmployees?: readonly HouseholdEmployee[];
  householdEmployerEin?: string;
  /** Line C / line 9: $1,000+ cash wages in any quarter of 2024 or 2025. */
  householdPaid1000InAQuarter?: boolean;
}
