/*
 * Form 8844 arithmetic: who counts as a qualified zone employee, the $15,000
 * limit on each employee's wages, the 20% credit and its share for each
 * business that paid the wages. Pure functions with the 2025 amounts.
 */

import type { EmpowermentZoneEmployeeFactValue } from "../../facts/index.js";
import { atLeast, prorateDollars, roundDollars, sum } from "../../money.js";

/*
 * "The maximum wages that may be taken into account for each employee is
 * limited to $15,000" (irs-8844-inst-2025::sec::specific-instructions::b01).
 */
export const WAGE_LIMIT_PER_EMPLOYEE = 15_000;

/* Line 2: "Multiply line 1 by 20% (0.20)" (irs-8844-face-2025::sec::face-page-1::b01; general-instructions::b01). */
export const CREDIT_RATE = 0.2;

/*
 * A qualified zone employee (irs-8844-inst-2025::sec::empowerment-zones::b02,
 * qualified-zone-employees::b01 to ::b03): lives and works in the zone, is not
 * a 5% owner, a relative or dependent, or employed at an excluded business,
 * and was employed at least 90 days, unless terminated earlier for misconduct
 * or a disability.
 *
 * DECISION (2026-11-27, by the author): when do the 90 days end for an
 * employee who is still employed at year end? Text A: "Any individual
 * employed by the employer for less than 90 days" is not a qualified zone
 * employee (irs-8844-inst-2025::sec::qualified-zone-employees::b01; the same
 * words in usc-26-2025::sec::s1396::d-2, paragraph (C)), with no end date.
 * Text B: "Generally, an individual is not a qualified zone employee unless
 * employed for at least 90 days" (qualified-zone-employees::b03), and the
 * only exceptions are early terminations, which suggests a person still
 * employed counts once the 90 days pass. The engine counts the days by
 * December 31 (the fact's employedAtLeast90Days): the credit year's answer is
 * known when the year closes, and the default claims less. QUESTIONS.md
 * item 9; docs/rule-decisions.md row A103.
 */
export function isQualifiedZoneEmployee(employee: EmpowermentZoneEmployeeFactValue): boolean {
  const ninetyDays = employee.employedAtLeast90Days || employee.earlyTermination !== undefined;
  return (
    employee.livesAndWorksInZone &&
    !employee.fivePercentOwner &&
    !employee.relatedToTaxpayer &&
    !employee.excludedBusiness &&
    ninetyDays
  );
}

/*
 * The limit for one employee: "The $15,000 amount for any employee is reduced
 * by the amount of wages ... that are used in figuring the work opportunity
 * credit (Form 5884)" (irs-8844-inst-2025::sec::specific-instructions::b01).
 */
export function wageLimitOf(workOpportunityCreditWages: number | undefined): number {
  return atLeast(0, WAGE_LIMIT_PER_EMPLOYEE - sum(workOpportunityCreditWages));
}

/*
 * The wages of one employee that line 1 takes, with cents: 0 for an employee
 * who does not qualify. The work opportunity credit wages also leave the zone
 * wages: "The term 'qualified zone wages' shall not include wages taken into
 * account in determining the credit under section 51" (usc-26-2025::sec::s1396::c,
 * paragraph (3)(A)). The instructions state only the lower limit; the statute
 * adds the exclusion, which they do not contradict (QUESTIONS.md item 10).
 * The fact's zoneWages includes them: the default is that the work opportunity
 * wages were paid while the person was a zone employee.
 */
export function countedWagesOf(employee: EmpowermentZoneEmployeeFactValue): number {
  if (!isQualifiedZoneEmployee(employee)) return 0;
  const workOpportunity = sum(employee.workOpportunityCreditWages);
  const zoneWages = atLeast(0, atLeast(0, employee.zoneWages) - workOpportunity);
  return Math.min(zoneWages, wageLimitOf(employee.workOpportunityCreditWages));
}

/* Line 1: the total of the employees' counted wages, rounded once (whole-dollar rule). */
export function line1Of(countedWages: ReadonlyArray<number>): number {
  return roundDollars(sum(...countedWages));
}

/* Line 2: line 1 × 20%. */
export function line2Of(line1: number): number {
  return roundDollars(line1 * CREDIT_RATE);
}

/* Line 4: "Add lines 2 and 3." */
export function line4Of(line2: number, line3: number): number {
  return line2 + line3;
}

/*
 * The line 2 credit of each business that paid the wages, in whole dollars
 * that add to line 2: "you must reduce your deduction for salaries and wages
 * ... by the line 2 credit amount" (irs-8844-inst-2025::sec::line-2::b01), on
 * the schedule that deducts them. The shares follow the counted wages.
 */
export function creditByEmployer(
  line2: number,
  wagesByEmployer: ReadonlyMap<string, number>,
): Map<string, number> {
  const keys = [...wagesByEmployer.keys()];
  const shares = prorateDollars(
    line2,
    keys.map((key) => wagesByEmployer.get(key) ?? 0),
  );
  return new Map(keys.map((key, index) => [key, shares[index]]));
}
