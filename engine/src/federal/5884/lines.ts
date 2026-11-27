/*
 * Form 5884 (Rev. March 2021), lines 1a to 4: pure arithmetic. The rates and
 * the wage limits are the statute's and do not change by year. The rates are
 * printed on the form (irs-5884-face-2025::sec::face-page-1::b01); the limits
 * and the hour rules are in the instructions (irs-5884-inst-2025).
 */

import { atLeast, roundDollars, sum } from "../../money.js";

/* "The amount of qualified wages for any employee is zero if: The employee didn't work for you for at least 120 hours" (qualified-wages::b01). */
export const MINIMUM_HOURS = 120;
/* Line 1b: "employees who worked for you at least 400 hours" (face-page-1::b01). */
export const FULL_RATE_HOURS = 400;

/* Line 1a: "× 25% (0.25)"; line 1b: "× 40% (0.40)"; line 1c: "× 50% (0.50)" (face-page-1::b01). */
export const SHORT_SERVICE_RATE = 0.25;
export const FULL_RATE = 0.4;
export const SECOND_YEAR_RATE = 0.5;

export const LONG_TERM_FAMILY_ASSISTANCE = "long_term_family_assistance";

/*
 * The qualified first-year wages that may be taken into account for one
 * employee, by the targeted group the state workforce agency certified
 * (irs-5884-inst-2025::sec::lines-1a-1b-and-1c::b01 to ::b04; the groups are
 * listed in how-to-claim-the-credit::b02, ::b03):
 * - a long-term family assistance recipient: $10,000 (b01);
 * - a qualified veteran: $6,000 with SNAP for 3 months of the 15 before the
 *   hiring date, or unemployed at least 4 weeks but less than 6 months;
 *   $12,000 with a service-connected disability, hired within 1 year of
 *   discharge; $14,000 unemployed at least 6 months; $24,000 with a
 *   service-connected disability and unemployed at least 6 months (b02);
 * - a summer youth employee: $3,000 (b02);
 * - "a member of any other targeted group is $6,000" (b04).
 */
export const FIRST_YEAR_WAGE_LIMITS = {
  [LONG_TERM_FAMILY_ASSISTANCE]: 10_000,
  tanf: 6_000,
  veteran_snap: 6_000,
  veteran_unemployed_4_weeks: 6_000,
  veteran_disabled_recent_discharge: 12_000,
  veteran_unemployed_6_months: 14_000,
  veteran_disabled_unemployed_6_months: 24_000,
  ex_felon: 6_000,
  designated_community_resident: 6_000,
  vocational_rehabilitation: 6_000,
  summer_youth: 3_000,
  snap: 6_000,
  ssi: 6_000,
  long_term_unemployment: 6_000,
} as const;

export type TargetedGroup = keyof typeof FIRST_YEAR_WAGE_LIMITS;

export const TARGETED_GROUPS = Object.keys(FIRST_YEAR_WAGE_LIMITS) as TargetedGroup[];

/* "qualified second-year wages that may be taken into account for any employee certified as a long-term family assistance recipient is limited to $10,000 per year" (lines-1a-1b-and-1c::b01). */
export const SECOND_YEAR_WAGE_LIMIT = 10_000;

/* One targeted group employee's wages and hours, as the employee fact states them. */
export interface EmployeeWages {
  targetedGroup: TargetedGroup;
  /* Hours of service the employee performed for the employer, counted to the end of 2025. */
  hoursWorked: number;
  /* Qualified first-year wages paid or incurred in 2025 (the 1-year period from the first day of work). */
  firstYearWages?: number;
  /* Qualified first-year wages of the same 1-year period that an earlier return already took into account. */
  firstYearWagesEarlierYears?: number;
  /* Long-term family assistance recipients only: qualified second-year wages paid or incurred in 2025. */
  secondYearWages?: number;
  /* Qualified second-year wages of the same period that an earlier return already took into account. */
  secondYearWagesEarlierYears?: number;
}

/* The wages of the year, up to what the limit leaves after the earlier years. */
function withinLimit(
  wages: number | undefined,
  earlier: number | undefined,
  limit: number,
): number {
  return Math.min(atLeast(0, wages ?? 0), atLeast(0, limit - (earlier ?? 0)));
}

/* The qualified first-year wages taken into account for the employee this year. */
export function qualifiedFirstYearWages(employee: EmployeeWages): number {
  if (employee.hoursWorked < MINIMUM_HOURS) return 0;
  const limit = FIRST_YEAR_WAGE_LIMITS[employee.targetedGroup];
  return withinLimit(employee.firstYearWages, employee.firstYearWagesEarlierYears, limit);
}

/* The qualified second-year wages taken into account: long-term family assistance recipients only (line 1c). */
export function qualifiedSecondYearWages(employee: EmployeeWages): number {
  if (employee.targetedGroup !== LONG_TERM_FAMILY_ASSISTANCE) return 0;
  if (employee.hoursWorked < MINIMUM_HOURS) return 0;
  return withinLimit(
    employee.secondYearWages,
    employee.secondYearWagesEarlierYears,
    SECOND_YEAR_WAGE_LIMIT,
  );
}

/* Line 1b for 400 hours or more, line 1a for 120 to 399 (face-page-1::b01). */
export const firstYearLineOf = (employee: EmployeeWages): "1a" | "1b" =>
  employee.hoursWorked >= FULL_RATE_HOURS ? "1b" : "1a";

/* One of lines 1a to 1c: the wages in the entry space and the credit in the right column. */
export interface RateLine {
  wages: number;
  credit: number;
}

/*
 * The wages total keeps its cents and rounds once; the credit is the rounded
 * total times the rate, rounded (CLAUDE.md, whole-dollar rounding). Blank when
 * no wages are taken into account on the line.
 */
export function rateLineOf(wages: number[], rate: number): RateLine | undefined {
  const total = roundDollars(sum(...wages));
  if (total <= 0) return undefined;
  return { wages: total, credit: roundDollars(total * rate) };
}

export interface Lines1To2 {
  line1a?: RateLine;
  line1b?: RateLine;
  line1c?: RateLine;
  /* "Add lines 1a, 1b, and 1c": 0 when they are blank. */
  line2: number;
}

/* Lines 1a to 2 for a set of employees (all of the return's, or one activity's). */
export function lines1To2(employees: ReadonlyArray<EmployeeWages>): Lines1To2 {
  const firstYear = (line: "1a" | "1b") =>
    employees.filter((employee) => firstYearLineOf(employee) === line).map(qualifiedFirstYearWages);
  const line1a = rateLineOf(firstYear("1a"), SHORT_SERVICE_RATE);
  const line1b = rateLineOf(firstYear("1b"), FULL_RATE);
  const line1c = rateLineOf(employees.map(qualifiedSecondYearWages), SECOND_YEAR_RATE);
  const line2 = sum(line1a?.credit, line1b?.credit, line1c?.credit);
  return { line1a, line1b, line1c, line2 };
}

/* Line 4: "Add lines 2 and 3" (face-page-1::b02); line 3 blank counts 0. */
export const line4Of = (line2: number, line3: number | undefined): number => line2 + (line3 ?? 0);
