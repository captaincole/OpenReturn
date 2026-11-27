/*
 * The targeted group employees on this return, each with the business or farm
 * that pays the wages. Form 5884 lines 1a to 2, the Form 3800 sources and the
 * wage reduction all read the same employees.
 */

import {
  businessesOnReturn,
  farmsOnReturn,
  readWorkOpportunityEmployees,
  type WorkOpportunityEmployeeFact,
} from "../../facts/index.js";
import { filingStatusOf, type ResolverInputs } from "../../resolverInputs.js";

/* The business or farm that employs the worker. */
export interface EmployerActivity {
  key: string;
  /* The activity's name, as Form 8582-CR lists a passive activity. */
  name: string;
  /* Schedule C line G or Schedule F line E; undefined while not answered. */
  materiallyParticipated?: boolean;
}

export interface EmployeeOnReturn extends WorkOpportunityEmployeeFact {
  activity: EmployerActivity;
}

export interface EmployeesOnReturn {
  employees: EmployeeOnReturn[];
  /* Employee facts whose activity is not a Schedule C business or Schedule F farm of the return. */
  unplacedKeys: string[];
  malformedKeys: string[];
}

/* The return's businesses and farms by fact key, and the keys of a spouse's that are on the spouse's return. */
function employerActivities(inputs: ResolverInputs) {
  const status = filingStatusOf(inputs);
  const joint = status === undefined || status === "married_filing_jointly";
  const businesses = businessesOnReturn(inputs.facts, joint);
  const farms = farmsOnReturn(inputs.facts, joint);
  const activities = new Map<string, EmployerActivity>([
    ...businesses.businesses.map(({ key, value }): [string, EmployerActivity] => [
      key,
      {
        key,
        name: value.name ?? value.activity,
        materiallyParticipated: value.materiallyParticipated,
      },
    ]),
    ...farms.farms.map(({ key, value }): [string, EmployerActivity] => [
      key,
      { key, name: value.activity, materiallyParticipated: value.materiallyParticipated },
    ]),
  ]);
  return { activities, offReturn: new Set([...businesses.spouseKeys, ...farms.spouseKeys]) };
}

/*
 * The employees of the return's own businesses and farms. A spouse's business
 * on a separate return takes its employees with it. An employee of any other
 * activity (a rental, a farm rental, a key with no fact) is unplaced: the
 * instructions reduce the wages on the schedule that deducts them (line-2::b01),
 * and the engine reduces only Schedule C line 26 and Schedule F line 22.
 */
export function employeesOnReturn(inputs: ResolverInputs): EmployeesOnReturn {
  const { employees, malformedKeys } = readWorkOpportunityEmployees(inputs.facts);
  const { activities, offReturn } = employerActivities(inputs);
  const onReturn = employees.filter((employee) => !offReturn.has(employee.value.activityKey));
  return {
    employees: onReturn.flatMap((employee) => {
      const activity = activities.get(employee.value.activityKey);
      return activity ? [{ ...employee, activity }] : [];
    }),
    unplacedKeys: onReturn
      .filter((employee) => !activities.has(employee.value.activityKey))
      .map((employee) => employee.key),
    malformedKeys,
  };
}
