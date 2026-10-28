import {
  HOUSEHOLD_EMPLOYMENT_KEYS,
  isHouseholdEmployeeFactKey,
  type HouseholdEmployeeFactValue,
} from "../../facts/index.js";
import {
  factsInCategory,
  missingInputs,
  resolveMustFile,
  type ResolverInputs,
} from "../../resolverInputs.js";
import type { HouseholdEmployee, ScheduleHFilingInfo } from "./filingInfo.js";
import { paysLineA } from "./lines.js";

export function resolveScheduleHInfo(inputs: ResolverInputs): ScheduleHFilingInfo {
  const rows = factsInCategory(inputs, "household_employment").filter((row) =>
    isHouseholdEmployeeFactKey(row.key),
  );
  const values = rows.map((row) => row.value as HouseholdEmployeeFactValue);
  const employees = values.map(toEmployee);
  const paidKey = HOUSEHOLD_EMPLOYMENT_KEYS.paid1000InAQuarter;
  const paid = inputs.factByKey.get(paidKey);
  const paid1000 = typeof paid === "boolean" ? paid : undefined;
  const factKeys = rows.map((row) => row.key);
  const r = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_h",
    fallbacks: [
      {
        rule: "fallback: a household employee was paid $2,800 or more (line A) or had federal income tax withheld (line B)",
        value: employees.some((e) => paysLineA(e) || e.federalTaxWithheld > 0),
        triggeredByFactKeys: factKeys,
      },
      {
        rule: "fallback: $1,000 or more in cash wages in a calendar quarter (line C)",
        value: paid1000 === true,
        triggeredByFactKeys: [paidKey],
      },
    ],
  });
  return {
    mustFile: { "schedule-h": r },
    missingInputs: {
      "schedule-h": missingInputs(rows.length > 0 ? { [paidKey]: paid1000 } : {}),
    },
    householdEmployees: employees.length > 0 ? employees : undefined,
    householdEmployerEin: values.find((v) => v.employerEin)?.employerEin,
    householdPaid1000InAQuarter: paid1000,
  };
}

function toEmployee(v: HouseholdEmployeeFactValue): HouseholdEmployee {
  return {
    name: v.employeeName,
    socialSecurityWages: v.box3 ?? 0,
    medicareWages: v.box5 ?? 0,
    federalTaxWithheld: v.box2 ?? 0,
  };
}
