import type { HouseholdEmployee, ScheduleHFilingInfo } from "./filingInfo.js";

/* Schedule H line A: 2025 cash-wage threshold for one household employee. */
export const HOUSEHOLD_WAGE_THRESHOLD = 2800;

/* Line 5: Additional Medicare Tax withholding on wages over this, per employee. */
export const ADDITIONAL_MEDICARE_WITHHOLDING_THRESHOLD = 200000;

type Info = ScheduleHFilingInfo;

export function paysLineA(e: HouseholdEmployee): boolean {
  return Math.max(e.socialSecurityWages, e.medicareWages) >= HOUSEHOLD_WAGE_THRESHOLD;
}

export const lineAEmployees = (info: Info): HouseholdEmployee[] =>
  (info.householdEmployees ?? []).filter(paysLineA);

export const lineA = (info: Info): boolean | undefined =>
  info.householdEmployees ? lineAEmployees(info).length > 0 : undefined;

export const lineB = (info: Info): boolean | undefined =>
  lineA(info) === false
    ? (info.householdEmployees ?? []).some((e) => e.federalTaxWithheld > 0)
    : undefined;

export const lineC = (info: Info): boolean | undefined =>
  lineB(info) === false ? info.householdPaid1000InAQuarter : undefined;

export const partI = (info: Info): boolean => lineA(info) === true;
export const lines7to9 = (info: Info): boolean => lineA(info) === true || lineB(info) === true;

/* Line 9 Yes means Part II (FUTA tax) applies, which is not modeled. */
export const line9 = (info: Info): boolean | undefined =>
  lines7to9(info) ? info.householdPaid1000InAQuarter : undefined;
