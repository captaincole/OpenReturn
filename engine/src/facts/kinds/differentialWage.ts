/*
 * Form 8932: one fact per employee of the taxpayer's own business or farm who
 * received differential wage payments in 2025, and one answer for the return.
 *
 * A differential wage payment is made "to a qualified employee for any period
 * during which the employee is performing service in the uniformed services
 * of the United States while on active duty for a period of more than 30
 * days" and "represents all or a portion of the wages the employee would have
 * received from the employer" (irs-8932-form-2025::sec::differential-wage-payment::b01).
 * The taxpayer states the payments of the year from the payroll records (the
 * employer reports them on the employee's Form W-2, box 1). No official form
 * holds them per employee, so the fact is a stated answer. An employee the
 * taxpayer does not claim the credit for has no fact: the facts are the claim.
 *
 * A credit from a partnership or S corporation is a K-1 box (code AV), not
 * this fact.
 *
 * The employer deducts the wages less the credit: "you must reduce your
 * deduction for salaries and wages by the amount on line 2, even if you cannot
 * take the full credit this year" (irs-8932-form-2025::sec::line-2::b01).
 * wageCreditsByBusiness is the Schedule C entry of the credits that lower a
 * deduction (activitiesOnReturn.ts), and differentialWageCreditByActivity the
 * Schedule F one (farm.ts).
 */

import { line2ByActivity, lines1To2, type EmployeePayments } from "../../federal/8932/lines.js";
import { sum } from "../../money.js";
import { statedWageCreditsByBusiness } from "./generalBusinessCredit.js";

type FactRow = { key: string; value: unknown; category: string };

export interface DifferentialWageEmployeeFactValue extends EmployeePayments {
  /* The employee's name, for the taxpayer's records; no line prints it. */
  name: string;
  /* The fact key of the business ("business.<id>") or farm ("farm.<id>") that pays the wages. */
  activityKey: string;
}

export interface DifferentialWageEmployeeFact {
  key: string;
  value: DifferentialWageEmployeeFactValue;
}

const EMPLOYEE_CATEGORY = "self_employment";
const EMPLOYEE_PREFIX = "differential_wage_employee.";

/* The Form 3800 Part III line 1w source form, as a stated credit names it. */
export const DIFFERENTIAL_WAGE_SOURCE_FORM = "8932";

export const DIFFERENTIAL_WAGE_CREDIT_KEYS = {
  /*
   * Asked once the return has an employee fact: is the taxpayer under a final
   * order, judgment or other process of a United States district court under
   * 38 U.S.C. 4323 for a violation of chapter 43 of title 38 (the employment
   * and reemployment rights of members of the uniformed services) in 2025,
   * 2024 or 2023? "No credit will be allowed to a taxpayer for: Any tax year in
   * which the taxpayer is under a final order ... and The 2 succeeding tax
   * years" (irs-8932-form-2025::sec::disallowance-for-failure-to-comply-with::b01).
   */
  underReemploymentOrder: "differential_wage_credit.under_reemployment_order",
} as const;

export function makeDifferentialWageEmployeeFactKey(slug: string): string {
  return `${EMPLOYEE_PREFIX}${slug}`;
}

export function isDifferentialWageEmployeeFactKey(key: string): boolean {
  const slug = key.slice(EMPLOYEE_PREFIX.length);
  return key.startsWith(EMPLOYEE_PREFIX) && slug !== "" && !slug.includes(".");
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

function isEmployee(value: unknown): value is DifferentialWageEmployeeFactValue {
  if (!isRecord(value)) return false;
  return (
    typeof value.name === "string" &&
    typeof value.activityKey === "string" &&
    typeof value.differentialWagePayments === "number" &&
    Number.isFinite(value.differentialWagePayments) &&
    value.differentialWagePayments >= 0 &&
    typeof value.employedPrior91Days === "boolean"
  );
}

/* Each employee fact whose fields check, in the order recorded; a malformed one is listed. */
export function readDifferentialWageEmployees(facts: ReadonlyArray<FactRow>): {
  employees: DifferentialWageEmployeeFact[];
  malformedKeys: string[];
} {
  const rows = facts.filter(
    (row) => row.category === EMPLOYEE_CATEGORY && isDifferentialWageEmployeeFactKey(row.key),
  );
  return {
    employees: rows
      .filter((row) => isEmployee(row.value))
      .map((row) => ({ key: row.key, value: row.value as DifferentialWageEmployeeFactValue })),
    malformedKeys: rows.filter((row) => !isEmployee(row.value)).map((row) => row.key),
  };
}

/* The answer about a final order; undefined while not answered. */
export function underReemploymentOrderOf(facts: ReadonlyArray<FactRow>): boolean | undefined {
  const value = facts.find(
    (row) => row.key === DIFFERENTIAL_WAGE_CREDIT_KEYS.underReemploymentOrder,
  )?.value;
  return typeof value === "boolean" ? value : undefined;
}

/*
 * The activity is a spouse's on a separate return: a business or farm fact
 * whose owner is the spouse. Its employees go with it to the spouse's return.
 */
const isOffReturn = (facts: ReadonlyArray<FactRow>, joint: boolean, activityKey: string) => {
  if (joint) return false;
  const value = facts.find((row) => row.key === activityKey)?.value;
  return isRecord(value) && value.owner === "spouse";
};

/* The employees on this return: every employee fact but those of a spouse's activity on a separate return. */
export function differentialWageEmployeesOnReturn(
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
): { employees: DifferentialWageEmployeeFact[]; malformedKeys: string[] } {
  const { employees, malformedKeys } = readDifferentialWageEmployees(facts);
  return {
    employees: employees.filter(({ value }) => !isOffReturn(facts, joint, value.activityKey)),
    malformedKeys,
  };
}

/* Form 8932 lines 1 and 2 of the return's own employees, or the answers they wait on. */
export type DifferentialWageCredit =
  | { waitingOn: string[] }
  | {
      /* No credit is allowed (a final order): lines 1 and 2 stay blank and nothing lowers a deduction. */
      disallowed: boolean;
      line1: number;
      line2: number;
      /* Line 2 by the activity that paid the wages; empty when disallowed. */
      byActivity: Map<string, number>;
    };

/* Undefined with no employee fact on the return. */
export function differentialWageCreditOf(
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
): DifferentialWageCredit | undefined {
  const { employees, malformedKeys } = differentialWageEmployeesOnReturn(facts, joint);
  if (employees.length === 0 && malformedKeys.length === 0) return undefined;
  if (malformedKeys.length > 0) return { waitingOn: malformedKeys };
  const order = underReemploymentOrderOf(facts);
  if (order === undefined) {
    return { waitingOn: [DIFFERENTIAL_WAGE_CREDIT_KEYS.underReemploymentOrder] };
  }
  const values = employees.map(({ value }) => value);
  const { line1, line2 } = lines1To2(values);
  if (order) return { disallowed: true, line1, line2, byActivity: new Map() };
  return { disallowed: false, line1, line2, byActivity: line2ByActivity(values) };
}

/* Line 2 by activity, for the wage deductions it lowers; empty while the form waits or the credit is disallowed. */
export function differentialWageCreditByActivity(
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
): ReadonlyMap<string, number> {
  const credit = differentialWageCreditOf(facts, joint);
  return credit === undefined || "waitingOn" in credit ? new Map() : credit.byActivity;
}

/*
 * The wage credits of each Schedule C business, one entry of the credits that
 * lower a deduction (activitiesOnReturn.ts): the stated Form 8994 credits, and
 * Form 8932 line 2 by business. With an employee fact on the return (well
 * formed or not), Form 8932 figures the credit, and a stated Form 8932 credit
 * lowers nothing: it is a named gap on Form 3800 line 1w
 * (federal/8932/form3800.ts), so no dollar is taken twice. Without one, a
 * stated Form 8932 credit lowers its business's wages as before.
 */
export function wageCreditsByBusiness(
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
): Map<string, number> {
  const figured = differentialWageCreditOf(facts, joint) !== undefined;
  const out = statedWageCreditsByBusiness(facts, figured ? [DIFFERENTIAL_WAGE_SOURCE_FORM] : []);
  for (const [key, amount] of differentialWageCreditByActivity(facts, joint)) {
    if (amount > 0) out.set(key, sum(out.get(key), amount));
  }
  return out;
}
