/*
 * Form 5884: one fact per targeted group employee of the taxpayer's own
 * business or farm. The state workforce agency certified the employee as a
 * member of a targeted group (irs-5884-inst-2025::sec::how-to-claim-the-credit::b01);
 * the taxpayer states the group, the hours and the wages from the payroll
 * records. An employee the taxpayer does not claim the credit for has no fact:
 * the facts are the claim ("You can claim or elect not to claim the work
 * opportunity credit", general-instructions::b01).
 *
 * The wages are qualified wages: FUTA wages without the $7,000 wage base, and
 * none of the wages the instructions exclude (qualified-wages::b01 to ::b03).
 * A credit from a partnership or S corporation is a K-1 box, not this fact.
 *
 * The employer deducts the wages less the credit (section 280C(a); line-2::b01).
 * workOpportunityCreditByActivity gives each activity's credit, and
 * businessesOnReturn and farmsOnReturn take it off the activity's wages.
 */

import {
  LONG_TERM_FAMILY_ASSISTANCE,
  TARGETED_GROUPS,
  lines1To2,
  type EmployeeWages,
  type TargetedGroup,
} from "../../federal/5884/lines.js";

type FactRow = { key: string; value: unknown; category: string };

export type { TargetedGroup };

export interface WorkOpportunityEmployeeFactValue extends EmployeeWages {
  /* The employee's name, for the taxpayer's records; no line prints it. */
  name: string;
  /* The fact key of the business ("business.<id>") or farm ("farm.<id>") that pays the wages. */
  activityKey: string;
}

export interface WorkOpportunityEmployeeFact {
  key: string;
  value: WorkOpportunityEmployeeFactValue;
}

const EMPLOYEE_CATEGORY = "self_employment";
const EMPLOYEE_PREFIX = "work_opportunity_employee.";

export function makeWorkOpportunityEmployeeFactKey(slug: string): string {
  return `${EMPLOYEE_PREFIX}${slug}`;
}

export function isWorkOpportunityEmployeeFactKey(key: string): boolean {
  const slug = key.slice(EMPLOYEE_PREFIX.length);
  return key.startsWith(EMPLOYEE_PREFIX) && slug !== "" && !slug.includes(".");
}

const isAmount = (value: unknown): boolean =>
  value === undefined || (typeof value === "number" && Number.isFinite(value) && value >= 0);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/* Second-year wages belong to a long-term family assistance recipient only (line 1c). */
const secondYearAllowed = (fields: Record<string, unknown>) =>
  fields.targetedGroup === LONG_TERM_FAMILY_ASSISTANCE ||
  (fields.secondYearWages === undefined && fields.secondYearWagesEarlierYears === undefined);

function isEmployee(value: unknown): value is WorkOpportunityEmployeeFactValue {
  if (!isRecord(value)) return false;
  return (
    typeof value.name === "string" &&
    typeof value.activityKey === "string" &&
    TARGETED_GROUPS.includes(value.targetedGroup as TargetedGroup) &&
    typeof value.hoursWorked === "number" &&
    isAmount(value.hoursWorked) &&
    isAmount(value.firstYearWages) &&
    isAmount(value.firstYearWagesEarlierYears) &&
    isAmount(value.secondYearWages) &&
    isAmount(value.secondYearWagesEarlierYears) &&
    secondYearAllowed(value)
  );
}

/* Each employee fact whose fields check, in the order recorded; a malformed one is listed. */
export function readWorkOpportunityEmployees(facts: ReadonlyArray<FactRow>): {
  employees: WorkOpportunityEmployeeFact[];
  malformedKeys: string[];
} {
  const rows = facts.filter(
    (row) => row.category === EMPLOYEE_CATEGORY && isWorkOpportunityEmployeeFactKey(row.key),
  );
  return {
    employees: rows
      .filter((row) => isEmployee(row.value))
      .map((row) => ({ key: row.key, value: row.value as WorkOpportunityEmployeeFactValue })),
    malformedKeys: rows.filter((row) => !isEmployee(row.value)).map((row) => row.key),
  };
}

/*
 * Each activity's work opportunity credit: Form 5884 lines 1a to 2 for its own
 * employees. "In general, you must reduce your deduction for salaries and
 * wages by the amount on line 2. This is required even if you can't take the
 * full credit this year" (irs-5884-inst-2025::sec::line-2::b01), so it is the
 * credit before any limit.
 */
export function workOpportunityCreditByActivity(
  facts: ReadonlyArray<FactRow>,
): Map<string, number> {
  const byActivity = new Map<string, EmployeeWages[]>();
  for (const { value } of readWorkOpportunityEmployees(facts).employees) {
    byActivity.set(value.activityKey, [...(byActivity.get(value.activityKey) ?? []), value]);
  }
  return new Map(
    [...byActivity].map(([activityKey, employees]) => [activityKey, lines1To2(employees).line2]),
  );
}
