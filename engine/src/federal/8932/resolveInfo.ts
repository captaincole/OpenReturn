import {
  DIFFERENTIAL_WAGE_CREDIT_KEYS,
  DIFFERENTIAL_WAGE_SOURCE_FORM,
  differentialWageCreditOf,
  getGeneralBusinessCreditFacts,
  underReemploymentOrderOf,
} from "../../facts/index.js";
import { roundDollars, sumOrBlank } from "../../money.js";
import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { unsupported, type Unsupported } from "../../types.js";
import { k1EntitiesWithRoute } from "../passThrough/receipts.js";
import { employeesOnReturn, isJointForActivities, type EmployeeOnReturn } from "./employees.js";
import type { Form8932FilingInfo, Form8932Lines } from "./filingInfo.js";

const MUST_FILE_KEY = "decisions.scope.must_file_8932";
/* Form 3800 Part III line 1w (3800/rows.ts). */
export const PART_III_LINE = "1w";
/* The K-1 detail of a partnership's box 15 code AV and an S corporation's box 13 code AV (passThrough box tables). */
export const K1_DIFFERENTIAL_WAGE_DETAIL = "differential_wage";

export const UNPLACED_GAP =
  "An employee with differential wage payments works for an activity that is not a Schedule C business or Schedule F farm of this return, and the wage deduction that the credit reduces (irs-8932-form-2025::sec::line-2::b01) is on a schedule the engine does not reduce.";
const K1_AMOUNT_GAP =
  "A Schedule K-1 credit for employer differential wage payments (code AV) has no amount, so line 3 is not known.";

/*
 * "Generally, you must reduce your deduction for salaries and wages by the
 * amount on line 2 ... If you capitalized any costs on which you figured the
 * credit, reduce the amount capitalized by the credit attributable to these
 * costs" (irs-8932-form-2025::sec::line-2::b01). An activity that states less
 * wages than its part of line 2 holds them elsewhere (cost of goods sold, a
 * capitalized cost), which the engine does not reduce.
 */
const wagesGap = (name: string, part: number) =>
  `The wages that ${name} deducts (Schedule C line 26 or Schedule F line 22) are less than its part of Form 8932 line 2 ($${part}), so the rest of the reduction belongs on wages held elsewhere, such as costs capitalized (irs-8932-form-2025::sec::line-2::b01), which the engine does not reduce.`;

/*
 * Line 3: "Enter total credits for employer differential wage payments from:
 * Schedule K-1 (Form 1065) ... box 15 (code P); Schedule K-1 (Form 1120-S) ...
 * box 13 (code P); Schedule K-1 (Form 1041) ... box 13 (code Q); or Form
 * 1099-PATR ... box 12, or other notice of credit allocation"
 * (irs-8932-form-2025::sec::line-3::b01). The 2025 K-1s use code AV
 * (irs-1065k1-inst-2025::sec::box-15-credits::b11; QUESTIONS.md). The
 * partnership and S corporation boxes come from the K-1 facts; any other
 * notice is a stated Form 3800 line 1w credit that names its pass-through
 * entity (passThroughEin). Each rounds before the add, the rule of Form 8846
 * line 5 and Form 8820 line 3 (docs/rule-decisions.md A96), so line 4 equals
 * Form 3800 line 1w. Blank with none.
 */
export function passThroughCredits(inputs: ResolverInputs): number | Unsupported | undefined {
  const k1 = k1EntitiesWithRoute(inputs, "form_3800").filter(
    ({ item }) => item.detail === K1_DIFFERENTIAL_WAGE_DETAIL,
  );
  if (k1.some(({ item }) => item.amount === undefined)) return unsupported(K1_AMOUNT_GAP);
  const stated = getGeneralBusinessCreditFacts(inputs.facts).filter(
    ({ value }) =>
      value.line === PART_III_LINE &&
      value.sourceForm === DIFFERENTIAL_WAGE_SOURCE_FORM &&
      value.passThroughEin !== undefined,
  );
  return sumOrBlank(
    ...k1.map(({ item }) => roundDollars(item.amount)),
    ...stated.map(({ value }) => roundDollars(value.amount)),
  );
}

/* The first activity whose stated wages cannot take its part of line 2; undefined when all can. */
function wagesShortfall(employees: EmployeeOnReturn[], byActivity: ReadonlyMap<string, number>) {
  const activities = new Map(employees.map(({ activity }) => [activity.key, activity]));
  for (const [key, part] of byActivity) {
    const activity = activities.get(key);
    if (activity !== undefined && part > (activity.statedWages ?? 0)) {
      return wagesGap(activity.name, part);
    }
  }
  return undefined;
}

/* Lines 1 to 3 from the facts. */
export function form8932LinesOf(inputs: ResolverInputs): Form8932Lines {
  const { employees, unplacedKeys } = employeesOnReturn(inputs);
  const line3 = passThroughCredits(inputs);
  if (unplacedKeys.length > 0) return { lines: unsupported(UNPLACED_GAP), line3 };
  const credit = differentialWageCreditOf(inputs.facts, isJointForActivities(inputs));
  if (credit === undefined || "waitingOn" in credit || credit.disallowed) {
    return { lines: undefined, line3 };
  }
  const shortfall = wagesShortfall(employees, credit.byActivity);
  if (shortfall !== undefined) return { lines: unsupported(shortfall), line3 };
  return { lines: { line1: credit.line1, line2: credit.line2 }, line3 };
}

/*
 * Who files: "Use Form 8932 to claim the credit for eligible differential wage
 * payments made to qualified employees" (irs-8932-form-2025::sec::purpose-of-form::b01).
 * An employee fact of the taxpayer's own business or farm files it. "All other
 * taxpayers are not required to complete or file this form if their only
 * source for this credit is a partnership, S corporation, cooperative,
 * estate, or trust. Instead, they can report this credit directly on Form
 * 3800" (same block), so a K-1 alone does not. Under a final order "No credit
 * will be allowed" (disallowance-for-failure-to-comply-with::b01), so the
 * form does not file. The form leaves the return when line 4 is 0
 * (filesOnlyWithAmountOn, bindings.ts). The explicit decision still wins.
 */
export function resolve8932Info(inputs: ResolverInputs): Form8932FilingInfo {
  const { employees, unplacedKeys, malformedKeys } = employeesOnReturn(inputs);
  // A malformed employee fact files the form too, so its key is asked again.
  const keys = [...employees.map((employee) => employee.key), ...unplacedKeys, ...malformedKeys];
  const order = underReemploymentOrderOf(inputs.facts);
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: ${keys.length} employee fact(s) with differential wage payments of the taxpayer's own business or farm, and no final order that disallows the credit`,
        value: keys.length > 0 && order !== true,
        triggeredByFactKeys: keys,
      },
    ],
  });
  const files = mustFile.value === true;
  const unanswered =
    keys.length > 0 && order === undefined
      ? [DIFFERENTIAL_WAGE_CREDIT_KEYS.underReemploymentOrder]
      : [];
  return {
    mustFile: { "form-8932": mustFile },
    missingInputs: { "form-8932": files ? [...malformedKeys, ...unanswered] : [] },
    differentialWage: files ? form8932LinesOf(inputs) : undefined,
  };
}
