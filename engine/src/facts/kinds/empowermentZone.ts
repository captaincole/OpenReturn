/*
 * Form 8844: one fact per employee of the taxpayer's own business or farm who
 * worked in an empowerment zone in 2025. The credit is "20% of the employer's
 * qualified zone wages (up to $15,000) paid or incurred during the calendar
 * year for services performed by an employee while the employee is a
 * qualified zone employee" (irs-8844-inst-2025::sec::general-instructions::b01).
 * The taxpayer states the wages from the payroll records and answers the
 * qualification questions; the engine applies the tests and the limit
 * (federal/8844/lines.ts).
 *
 * The credit lowers the wage deduction of the business that paid the wages
 * (irs-8844-inst-2025::sec::line-2::b01): Schedule C line 26 or Schedule F
 * line 22 (activitiesOnReturn.ts, farm.ts). A credit from a partnership or an
 * S corporation is not stated here: the K-1 fact holds it.
 */

import { countedWagesOf, creditByEmployer, line1Of, line2Of } from "../../federal/8844/lines.js";

type FactRow = { key: string; value: unknown; category: string };

export interface EmpowermentZoneEmployeeFactValue {
  /* The employee's name, for the taxpayer's records. */
  name: string;
  /* The fact key of the business ("business.<id>") or farm ("farm.<id>") that employs the person. */
  employerKey: string;
  /* The empowerment zone, as the instructions list it ("Fresno, CA"). */
  zone: string;
  /*
   * The employee's principal residence was in the zone, and the employee
   * performed substantially all services for the employer within the zone in
   * the employer's trade or business (irs-8844-inst-2025::sec::empowerment-zones::b02).
   */
  livesAndWorksInZone: boolean;
  /* Owns more than 5% of the capital or profits interest (qualified-zone-employees::b01). */
  fivePercentOwner: boolean;
  /*
   * A relative under section 152(d)(2)(A) through (G), or a dependent under
   * section 152(d)(2)(H), of the taxpayer (qualified-zone-employees::b02).
   */
  relatedToTaxpayer: boolean;
  /*
   * Employed at a golf course, country club, massage parlor, hot tub or suntan
   * facility, racetrack or other gambling facility, or a liquor store; or in
   * farming when the farm assets owned and leased are more than $500,000 at
   * the close of the year (qualified-zone-employees::b01).
   */
  excludedBusiness: boolean;
  /*
   * Employed by the taxpayer for at least 90 days (qualified-zone-employees::b01),
   * counted by the end of the tax year. An employee hired late in the year who
   * is still employed and passes 90 days after December 31 answers false: the
   * default, an open question (federal/8844/QUESTIONS.md item 9).
   */
  employedAtLeast90Days: boolean;
  /*
   * Ended before 90 days: terminated for misconduct under state unemployment
   * law, or disabled before the 90th day (qualified-zone-employees::b03).
   * Absent: neither.
   */
  earlyTermination?: "misconduct" | "disability";
  /*
   * Wages (section 51(c), without the FUTA dollar limit, no tips; section 127
   * educational assistance and youth training included) paid or incurred in
   * calendar year 2025 for services while a qualified zone employee
   * (qualified-zone-employees::b03, ::b04), before the $15,000 limit.
   */
  zoneWages: number;
  /* Wages of this employee used for the work opportunity credit (Form 5884). Absent: none. */
  workOpportunityCreditWages?: number;
}

export interface EmpowermentZoneEmployeeFact {
  key: string;
  value: EmpowermentZoneEmployeeFactValue;
}

const EMPLOYEE_CATEGORY = "self_employment";
const EMPLOYEE_PREFIX = "empowerment_zone_employee.";
const EMPLOYER_PREFIXES = ["business.", "farm."];

export function makeEmpowermentZoneEmployeeFactKey(slug: string): string {
  return `${EMPLOYEE_PREFIX}${slug}`;
}

export function isEmpowermentZoneEmployeeFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === EMPLOYEE_PREFIX && parts[1] !== "";
}

/* Every employee fact, in the order recorded. */
export function getEmpowermentZoneEmployeeFacts(
  facts: ReadonlyArray<FactRow>,
): EmpowermentZoneEmployeeFact[] {
  return facts
    .filter(
      (row) => row.category === EMPLOYEE_CATEGORY && isEmpowermentZoneEmployeeFactKey(row.key),
    )
    .map((row) => ({ key: row.key, value: row.value as EmpowermentZoneEmployeeFactValue }));
}

type EmployerPlace = "on_return" | "spouse_return" | "unknown";

/*
 * Where the employer is: a business or farm fact on this return; a spouse's
 * on a return filed apart (the credit is on the spouse's return); or no such
 * fact.
 */
function employerPlace(facts: ReadonlyArray<FactRow>, key: string, joint: boolean): EmployerPlace {
  if (!EMPLOYER_PREFIXES.some((prefix) => key.startsWith(prefix))) return "unknown";
  const row = facts.find((fact) => fact.category === EMPLOYEE_CATEGORY && fact.key === key);
  if (row === undefined) return "unknown";
  const owner = (row.value as { owner?: string } | null)?.owner;
  return !joint && owner === "spouse" ? "spouse_return" : "on_return";
}

export interface EmpowermentZoneFigures {
  /* The employees of a business or farm on this return. */
  employees: EmpowermentZoneEmployeeFact[];
  /* Employees whose employerKey names no business or farm fact: an engine gap on Form 8844. */
  unknownEmployerKeys: string[];
  line1: number;
  line2: number;
  /* Line 2 split among the businesses and farms that paid the wages, by fact key. */
  creditByEmployer: Map<string, number>;
}

/* Form 8844 lines 1 and 2 for this return, from the employees whose employer is on it. */
export function empowermentZoneFigures(
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
): EmpowermentZoneFigures {
  const all = getEmpowermentZoneEmployeeFacts(facts);
  const placeOf = (fact: EmpowermentZoneEmployeeFact) =>
    employerPlace(facts, fact.value.employerKey, joint);
  const employees = all.filter((fact) => placeOf(fact) === "on_return");
  const wagesByEmployer = new Map<string, number>();
  for (const employee of employees) {
    const key = employee.value.employerKey;
    wagesByEmployer.set(key, (wagesByEmployer.get(key) ?? 0) + countedWagesOf(employee.value));
  }
  const line1 = line1Of(employees.map((employee) => countedWagesOf(employee.value)));
  const line2 = line2Of(line1);
  return {
    employees,
    unknownEmployerKeys: all.filter((fact) => placeOf(fact) === "unknown").map((fact) => fact.key),
    line1,
    line2,
    creditByEmployer: creditByEmployer(line2, wagesByEmployer),
  };
}
