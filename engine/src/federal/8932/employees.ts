/*
 * The employees with differential wage payments on this return, each with the
 * business or farm that pays the wages. Form 8932 lines 1 and 2, the Form 3800
 * sources and the wage reduction all read the same employees
 * (facts/kinds/differentialWage.ts).
 */

import {
  businessesOnReturn,
  differentialWageEmployeesOnReturn,
  farmsOnReturn,
  statedBusinessesOnReturn,
  type DifferentialWageEmployeeFact,
} from "../../facts/index.js";
import { filingStatusOf, type ResolverInputs } from "../../resolverInputs.js";

/* The business or farm that employs the worker. */
export interface EmployerActivity {
  key: string;
  /* The activity's name, as Form 8582-CR lists a passive activity. */
  name: string;
  /* Schedule C line G or Schedule F line E; undefined while not answered. */
  materiallyParticipated?: boolean;
  /* Schedule C line 26 or Schedule F line 22 as stated, before any credit lowers it. */
  statedWages?: number;
}

export interface EmployeeOnReturn extends DifferentialWageEmployeeFact {
  activity: EmployerActivity;
}

export interface EmployeesOnReturn {
  employees: EmployeeOnReturn[];
  /* Employee facts whose activity is not a Schedule C business or Schedule F farm of the return. */
  unplacedKeys: string[];
  malformedKeys: string[];
}

/* A spouse's business is on the return unless the spouses file separately. */
export const isJointForActivities = (inputs: ResolverInputs) => {
  const status = filingStatusOf(inputs);
  return status === undefined || status === "married_filing_jointly";
};

/* The return's businesses and farms by fact key. */
function employerActivities(inputs: ResolverInputs): Map<string, EmployerActivity> {
  const joint = isJointForActivities(inputs);
  const stated = new Map(
    statedBusinessesOnReturn(inputs.facts, joint).businesses.map(({ key, value }) => [
      key,
      value.expenses?.wages,
    ]),
  );
  return new Map<string, EmployerActivity>([
    ...businessesOnReturn(inputs.facts, joint).businesses.map(
      ({ key, value }): [string, EmployerActivity] => [
        key,
        {
          key,
          name: value.name ?? value.activity,
          materiallyParticipated: value.materiallyParticipated,
          statedWages: stated.get(key),
        },
      ],
    ),
    ...farmsOnReturn(inputs.facts, joint).farms.map(
      ({ key, value }): [string, EmployerActivity] => [
        key,
        {
          key,
          name: value.activity,
          materiallyParticipated: value.materiallyParticipated,
          statedWages: value.expenses?.laborHired,
        },
      ],
    ),
  ]);
}

/*
 * The employees of the return's own businesses and farms. A spouse's business
 * on a separate return takes its employees with it. An employee of any other
 * activity (a rental, a farm rental, a key with no fact) is unplaced: the
 * credit lowers "your deduction for salaries and wages"
 * (irs-8932-form-2025::sec::line-2::b01) on the schedule that deducts them, and
 * the engine lowers only Schedule C line 26 and Schedule F line 22.
 */
export function employeesOnReturn(inputs: ResolverInputs): EmployeesOnReturn {
  const { employees, malformedKeys } = differentialWageEmployeesOnReturn(
    inputs.facts,
    isJointForActivities(inputs),
  );
  const activities = employerActivities(inputs);
  return {
    employees: employees.flatMap((employee) => {
      const activity = activities.get(employee.value.activityKey);
      return activity ? [{ ...employee, activity }] : [];
    }),
    unplacedKeys: employees
      .filter((employee) => !activities.has(employee.value.activityKey))
      .map((employee) => employee.key),
    malformedKeys,
  };
}
