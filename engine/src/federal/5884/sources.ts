/*
 * Form 5884's credit as Form 3800 sources: "All others, stop here and report
 * this amount on Form 3800, Part III, line 4b" (irs-5884-face-2025::sec::face-page-1::b02).
 *
 * Line 4 is line 2 (the taxpayer's own employees) plus line 3 (the K-1s). The
 * K-1 credits already are Form 3800 sources of their own (3800/sources.ts),
 * with the entity's EIN in column (c) and their own passive answer, so this
 * adds line 2 only, and Part III line 4b totals line 4.
 *
 * Line 2 is column (e) when the taxpayer materially participates in the
 * business or farm (Schedule C line G, Schedule F line E), else column (d),
 * limited by Form 8582-CR: "Column (e) ... the amount of your current-year
 * credit that is not subject to the passive activity limitation of section 469
 * because of your material participation in the trade or business"
 * (irs-3800-inst-2025::sec::transferees-of-eligible-credits-under-section::b05).
 * The employees of the activities with material participation make one source;
 * each passive activity makes its own, for Form 8582-CR Worksheet 4.
 */

import { getGeneralBusinessCreditFacts } from "../../facts/index.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { gap, isGap } from "../3800/cells.js";
import type { CurrentCredit } from "../3800/credits.js";
import type { CreditSource } from "../3800/filingInfo.js";
import { employeesOnReturn, type EmployeeOnReturn } from "./employees.js";
import { lines1To2 } from "./lines.js";
import { resolve5884Info } from "./resolveInfo.js";

const PART_III_LINE = "4b";

const STATED_TWICE_GAP =
  "A work opportunity credit is stated as a Form 3800 line 4b amount with no pass-through entity, and Form 5884 figures one from the employee facts: the engine cannot tell whether they are the same credit.";

const isPassive = (employee: EmployeeOnReturn) =>
  employee.activity.materiallyParticipated === false;

function sourceOf(credit: CurrentCredit): CreditSource {
  return { credit };
}

/* The passive activities' sources, one for each activity with an amount. */
function passiveSources(employees: EmployeeOnReturn[]): CreditSource[] {
  const activities = [...new Set(employees.filter(isPassive).map((each) => each.activity.key))];
  return activities.flatMap((key) => {
    const own = employees.filter((each) => each.activity.key === key);
    const amount = lines1To2(own.map((each) => each.value)).line2;
    if (amount === 0) return [];
    const activity = { name: own[0].activity.name, rentalRealEstate: false };
    return [sourceOf({ line: PART_III_LINE, key, amount, passive: true, activity })];
  });
}

/*
 * Line 2 as Form 3800 sources, and the answers they wait on (the material
 * participation of each employer). None while Form 5884 does not file.
 */
export function workOpportunitySources(inputs: ResolverInputs): {
  sources: CreditSource[];
  missing: string[];
} {
  const info = resolve5884Info(inputs);
  const lines = info.workOpportunity?.lines;
  if (info.mustFile?.["form-5884"]?.value !== true || lines === undefined) {
    return { sources: [], missing: [] };
  }
  const { employees, unplacedKeys } = employeesOnReturn(inputs);
  const nonpassiveEmployees = employees.filter((each) => !isPassive(each));
  // The source's key is a fact it came from: the first employer with material participation.
  const key = nonpassiveEmployees[0]?.activity.key ?? unplacedKeys[0] ?? employees[0]?.key ?? "";
  const own = (amount: CurrentCredit["amount"]) => [
    sourceOf({ line: PART_III_LINE, key, amount, passive: false }),
  ];
  if (isGap(lines)) return { sources: own(lines), missing: [] };
  const statedTwice = getGeneralBusinessCreditFacts(inputs.facts).some(
    ({ value }) => value.line === PART_III_LINE && value.passThroughEin === undefined,
  );
  if (statedTwice && lines.line2 > 0) return { sources: own(gap(STATED_TWICE_GAP)), missing: [] };
  const waiting = employees.filter((each) => each.activity.materiallyParticipated === undefined);
  const nonpassive = lines1To2(nonpassiveEmployees.map((each) => each.value)).line2;
  return {
    sources: [...(nonpassive > 0 ? own(nonpassive) : []), ...passiveSources(employees)],
    missing: [...new Set(waiting.map((each) => each.activity.key))],
  };
}
