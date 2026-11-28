/*
 * Form 8932 (Rev. December 2021), lines 1 to 4: pure arithmetic. The rate and
 * the limit are the statute's (section 45P(a), (b)(1)) and do not change by
 * year. The payments keep their cents while adding, and each line rounds once
 * (CLAUDE.md, whole-dollar rounding).
 */

import { atLeast, prorateDollars, roundDollars, sum } from "../../money.js";

/* Line 2: "Multiply line 1 by 20% (0.20)" (irs-8932-form-2025::sec::face-page-1::b01). */
export const CREDIT_RATE = 0.2;

/*
 * "Eligible differential wage payments are the total differential wage
 * payments paid to the employee for the tax year, up to $20,000"
 * (irs-8932-form-2025::sec::purpose-of-form::b01); line 1: "Do not include
 * more than $20,000 of payments for any employee" (specific-instructions::b01).
 */
export const PAYMENTS_LIMIT_PER_EMPLOYEE = 20_000;

/* One employee's differential wage payments of the year, as the employee fact states them. */
export interface EmployeePayments {
  /* The differential wage payments paid to the employee during 2025, before the $20,000 limit. */
  differentialWagePayments: number;
  /*
   * "A qualified employee is a person who has been an employee for the 91-day
   * period immediately preceding the period for which any differential wage
   * payment is made" (irs-8932-form-2025::sec::qualified-employee::b01).
   */
  employedPrior91Days: boolean;
}

/* The eligible payments of one employee: none for an employee who is not qualified, else at most $20,000. */
export function eligiblePaymentsOf(employee: EmployeePayments): number {
  if (!employee.employedPrior91Days) return 0;
  return Math.min(atLeast(0, employee.differentialWagePayments), PAYMENTS_LIMIT_PER_EMPLOYEE);
}

/* Line 1: "Enter the total amount of eligible differential wage payments made to qualified employees during the tax year" (specific-instructions::b01). */
export function line1Of(employees: ReadonlyArray<EmployeePayments>): number {
  return roundDollars(sum(...employees.map(eligiblePaymentsOf)));
}

/* Line 2: line 1 at 20%. */
export function line2Of(line1: number): number {
  return roundDollars(line1 * CREDIT_RATE);
}

/* Line 4: "Add lines 2 and 3" (face-page-1::b01); blank while both are blank. */
export function line4Of(line2: number | undefined, line3: number | undefined): number | undefined {
  return line2 === undefined && line3 === undefined ? undefined : sum(line2, line3);
}

export interface Lines1To2 {
  line1: number;
  line2: number;
}

export function lines1To2(employees: ReadonlyArray<EmployeePayments>): Lines1To2 {
  const line1 = line1Of(employees);
  return { line1, line2: line2Of(line1) };
}

/*
 * Line 2 split over the activities that paid the wages, in proportion to each
 * one's eligible payments, so the parts add up to line 2 exactly: "you must
 * reduce your deduction for salaries and wages by the amount on line 2"
 * (irs-8932-form-2025::sec::line-2::b01), each activity on the schedule that
 * deducts its wages. In the order the activities first appear.
 */
export function line2ByActivity(
  employees: ReadonlyArray<EmployeePayments & { activityKey: string }>,
): Map<string, number> {
  const keys = [...new Set(employees.map((each) => each.activityKey))];
  const shares = keys.map((key) =>
    sum(...employees.filter((each) => each.activityKey === key).map(eligiblePaymentsOf)),
  );
  const parts = prorateDollars(lines1To2(employees).line2, shares);
  return new Map(keys.map((key, index) => [key, parts[index]]));
}
