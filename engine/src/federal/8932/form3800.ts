/*
 * Form 8932's credit as Form 3800 sources: "All others, stop here and report
 * this amount on Form 3800, Part III, line 1w" (irs-8932-form-2025::sec::face-page-1::b01).
 *
 * Line 4 is line 2 (the taxpayer's own employees) plus line 3 (the K-1s and
 * other notices). The line 3 credits already are Form 3800 sources of their
 * own (3800/sources.ts), with the entity's EIN in column (c) and their own
 * passive answer, so this adds line 2 only, and Part III line 1w totals line 4.
 *
 * Line 2 is column (e) when the taxpayer materially participates in the
 * business or farm (Schedule C line G, Schedule F line E), else column (d),
 * limited by Form 8582-CR (irs-3800-inst-2025::sec::transferees-of-eligible-credits-under-section::b05),
 * as Form 5884 does (5884/sources.ts). The activities with material
 * participation make one source; each passive activity makes its own.
 */

import {
  DIFFERENTIAL_WAGE_SOURCE_FORM,
  differentialWageCreditByActivity,
  getGeneralBusinessCreditFacts,
} from "../../facts/index.js";
import { sum } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { gap, isGap, type Cell } from "../3800/cells.js";
import type { CreditSource } from "../3800/filingInfo.js";
import { employeesOnReturn, isJointForActivities, type EmployerActivity } from "./employees.js";
import { PART_III_LINE, resolve8932Info } from "./resolveInfo.js";

const STATED_TWICE_GAP =
  "A Form 8932 credit of the taxpayer's own employees is stated as a Form 3800 line 1w amount, and Form 8932 figures one from the employee facts: the engine cannot tell whether they are the same credit, so the stated one lowers no wages.";

/*
 * The decision decisions.scope.must_file_8932 = false takes Form 8932 off the
 * return, but the wages are reduced from the employee facts alone (the facts
 * layer reads no decision). The deduction goes down "by the amount on line 2"
 * (irs-8932-form-2025::sec::line-2::b01): with no form, nothing is claimed and
 * nothing reduces the deduction. Until the two agree, line 1w is a gap, so the
 * return never loses the deduction and the credit together.
 */
const DECISION_CONFLICT_GAP = (key: string) =>
  `The decision decisions.scope.must_file_8932 is false, but the employee fact ${key} claims the credit for employer differential wage payments, and the wages of its business or farm are reduced by it (irs-8932-form-2025::sec::line-2::b01). To not claim the credit, remove the employee facts; to claim it, remove the decision.`;

const source = (key: string, amount: Cell, activity?: EmployerActivity): CreditSource => ({
  credit: {
    line: PART_III_LINE,
    key,
    amount,
    passive: activity !== undefined,
    activity: activity && { name: activity.name, rentalRealEstate: false },
  },
});

const none = { sources: [] as CreditSource[], missing: [] as string[] };

/*
 * Line 2 as Form 3800 sources, and the answers they wait on (the material
 * participation of each employer). None while Form 8932 does not file, and
 * a gap while the decision and the reduction disagree.
 */
export function differentialWageSourcesOf(inputs: ResolverInputs): {
  sources: CreditSource[];
  missing: string[];
} {
  const info = resolve8932Info(inputs);
  const { employees, unplacedKeys } = employeesOnReturn(inputs);
  const firstKey = employees[0]?.key ?? unplacedKeys[0] ?? "";
  if (info.mustFile?.["form-8932"]?.value !== true) {
    const byActivity = differentialWageCreditByActivity(inputs.facts, isJointForActivities(inputs));
    const reduced = sum(...byActivity.values()) > 0;
    return reduced
      ? { sources: [source(firstKey, gap(DECISION_CONFLICT_GAP(firstKey)))], missing: [] }
      : none;
  }
  const lines = info.differentialWage?.lines;
  if (lines === undefined) return none;
  if (isGap(lines)) return { sources: [source(firstKey, lines)], missing: [] };
  const statedTwice = getGeneralBusinessCreditFacts(inputs.facts).some(
    ({ value }) =>
      value.sourceForm === DIFFERENTIAL_WAGE_SOURCE_FORM && value.passThroughEin === undefined,
  );
  if (statedTwice) return { sources: [source(firstKey, gap(STATED_TWICE_GAP))], missing: [] };
  return placedSources(inputs, employees);
}

/* The nonpassive activities' part of line 2 as one source, and each passive activity's as its own. */
function placedSources(
  inputs: ResolverInputs,
  employees: ReturnType<typeof employeesOnReturn>["employees"],
) {
  const byActivity = differentialWageCreditByActivity(inputs.facts, isJointForActivities(inputs));
  const activities = [
    ...new Map(employees.map(({ activity }) => [activity.key, activity])).values(),
  ];
  const waiting = activities.filter((each) => each.materiallyParticipated === undefined);
  if (waiting.length > 0) return { sources: [], missing: waiting.map((each) => each.key) };
  const nonpassive = activities.filter((each) => each.materiallyParticipated === true);
  const nonpassiveAmount = sum(...nonpassive.map((each) => byActivity.get(each.key)));
  const own = nonpassiveAmount > 0 ? [source(nonpassive[0].key, nonpassiveAmount)] : [];
  const passive = activities
    .filter((each) => each.materiallyParticipated === false && (byActivity.get(each.key) ?? 0) > 0)
    .map((each) => source(each.key, byActivity.get(each.key) ?? 0, each));
  return { sources: [...own, ...passive], missing: [] };
}
