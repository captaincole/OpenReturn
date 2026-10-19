/*
 * Schedule H line rules: which of lines A–C are answered, and which
 * parts of the form apply. bindings.ts reads these to fill the lines.
 */

import type { HouseholdEmployee, ScheduleHFilingInfo } from "./filingInfo.js";
import { paysLineA } from "./resolveInfo.js";

/* Line 5: wages over this amount to one employee need Additional Medicare Tax withholding. */
export const ADDITIONAL_MEDICARE_WITHHOLDING_THRESHOLD = 200000;

type Info = ScheduleHFilingInfo;

/* The employees whose wages go on lines 1, 3, and 5 (line A is Yes for them). */
export const lineAEmployees = (info: Info): HouseholdEmployee[] =>
  (info.householdEmployees ?? []).filter(paysLineA);

export const lineA = (info: Info): boolean | undefined =>
  info.householdEmployees ? lineAEmployees(info).length > 0 : undefined;

/* Line B is answered only when line A is No. */
export const lineB = (info: Info): boolean | undefined =>
  lineA(info) === false
    ? (info.householdEmployees ?? []).some((e) => e.federalTaxWithheld > 0)
    : undefined;

/* Line C is answered only when lines A and B are both No. */
export const lineC = (info: Info): boolean | undefined =>
  lineB(info) === false ? info.householdPaid1000InAQuarter : undefined;

/* Part I (lines 1–6) applies when line A is Yes; lines 7–9 also when line B is Yes. */
export const partI = (info: Info): boolean => lineA(info) === true;
export const lines7to9 = (info: Info): boolean => lineA(info) === true || lineB(info) === true;
