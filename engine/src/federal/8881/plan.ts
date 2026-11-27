/*
 * The plan fact on this return, with the business or farm that sponsors it.
 * Form 8881's own lines, the Form 3800 sources and the must-file rule all
 * read the same placed plan.
 */

import {
  businessesOnReturn,
  farmsOnReturn,
  readSmallEmployerPlans,
  type SmallEmployerPlanFact,
} from "../../facts/index.js";
import { filingStatusOf, type ResolverInputs } from "../../resolverInputs.js";
import { unsupported, type Unsupported } from "../../types.js";
import {
  line9Of,
  ownCredits,
  part3Of,
  section1Of,
  section2Of,
  type OwnPlanLines,
} from "./lines.js";

/* The business or farm that sponsors the plan. */
export interface PlanActivity {
  key: string;
  /* The activity's name, as Form 8582-CR lists a passive activity. */
  name: string;
  /* Schedule C line G or Schedule F line E; undefined while not answered. */
  materiallyParticipated?: boolean;
}

export interface PlacedPlan extends SmallEmployerPlanFact {
  activity: PlanActivity;
}

export interface PlanOnReturn {
  plan?: PlacedPlan;
  /* A plan fact whose activity is not a Schedule C business or Schedule F farm of the return. */
  unplacedKeys: string[];
  malformedKeys: string[];
}

export const UNPLACED_GAP =
  "The retirement plan's sponsor is not a Schedule C business or Schedule F farm of this return, and the deductions that lines 5 and 6g reduce (irs-8881-inst-2025::sec::no-deduction-allowed-for-credit-amount::b01) are on a schedule the engine does not reduce.";

/* The return's businesses and farms by fact key, and the keys of a spouse's on the spouse's return. */
function sponsors(inputs: ResolverInputs) {
  const status = filingStatusOf(inputs);
  const joint = status === undefined || status === "married_filing_jointly";
  const businesses = businessesOnReturn(inputs.facts, joint);
  const farms = farmsOnReturn(inputs.facts, joint);
  const activities = new Map<string, PlanActivity>([
    ...businesses.businesses.map(({ key, value }): [string, PlanActivity] => [
      key,
      {
        key,
        name: value.name ?? value.activity,
        materiallyParticipated: value.materiallyParticipated,
      },
    ]),
    ...farms.farms.map(({ key, value }): [string, PlanActivity] => [
      key,
      { key, name: value.activity, materiallyParticipated: value.materiallyParticipated },
    ]),
  ]);
  return { activities, offReturn: new Set([...businesses.spouseKeys, ...farms.spouseKeys]) };
}

/* The plan of the return's own business or farm. A spouse's business on a separate return takes its plan with it. */
export function planOnReturn(inputs: ResolverInputs): PlanOnReturn {
  const { plans, malformedKeys } = readSmallEmployerPlans(inputs.facts);
  const { activities, offReturn } = sponsors(inputs);
  const onReturn = plans.filter((plan) => !offReturn.has(plan.value.activityKey));
  const placed = onReturn.flatMap((plan) => {
    const activity = activities.get(plan.value.activityKey);
    return activity ? [{ ...plan, activity }] : [];
  });
  return {
    plan: placed[0],
    unplacedKeys: onReturn
      .filter((plan) => !activities.has(plan.value.activityKey))
      .map((plan) => plan.key),
    malformedKeys,
  };
}

/* The plan's own lines (lines.ts), from its fact. */
export function ownLinesOf(plan: SmallEmployerPlanFact): OwnPlanLines {
  const { startupCosts, contributions, precedingYearEmployees } = plan.value;
  const employees = precedingYearEmployees ?? 0;
  return {
    section1: startupCosts ? section1Of(startupCosts) : undefined,
    section2: contributions
      ? section2Of({ ...contributions, precedingYearEmployees: employees })
      : undefined,
    line9: line9Of(plan.value.autoEnrollmentCreditYear),
    part3: part3Of(plan.value.militarySpouses ?? [], employees),
  };
}

/* The return's own plan lines: undefined with no plan (or while its fact is malformed), a gap when it cannot be placed. */
export function ownPlanLines(on: PlanOnReturn): OwnPlanLines | Unsupported | undefined {
  if (on.unplacedKeys.length > 0) return unsupported(UNPLACED_GAP);
  return on.plan ? ownLinesOf(on.plan) : undefined;
}

/* True when the plan's own lines give a credit in any part. */
export function hasOwnCredit(lines: OwnPlanLines): boolean {
  const credits = ownCredits(lines);
  return credits.partI > 0 || credits.partII > 0 || credits.partIII > 0;
}
