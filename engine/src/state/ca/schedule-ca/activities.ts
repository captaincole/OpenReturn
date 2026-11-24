/*
 * Schedule CA (540) amounts from a business or rental: a contractor who is an
 * employee for California (facts/kinds/caEmployeeClassification.ts), and the
 * FTB 3885A depreciation and amortization differences (state/ca/3885a).
 */

import { businessesOnReturn, CA_EMPLOYEE_CLASSIFICATION_KEYS } from "../../../facts/index.js";
import { spousePropertiesOnReturn } from "../../../federal/rentals/passive.js";
import { sum } from "../../../money.js";
import {
  filingStatusOf,
  missingInputs,
  num,
  type ResolverInputs,
} from "../../../resolverInputs.js";
import { form3801Scope } from "../3801/formScope.js";
import type { Form3885AActivity } from "../3885a/filingInfo.js";
import { californiaAdjustment, form3885AFigures } from "../3885a/lines.js";
import { caDepreciationActivities } from "../3885a/resolveInfo.js";

/*
 * ca-3885a-inst-2025::sec::line-8a-and-line-8b::b01: a passive activity's
 * difference goes to FTB 3801. A business that is also reclassified for
 * California (worker status) adds its stated loss and its FTB 3885A difference
 * both; the taxpayer's stated amounts are taken to leave depreciation out.
 * A passive business's difference is a gap: FTB 3801 does not model a passive
 * business. A rental's goes through FTB 3801 when the rental needs that form
 * (a passive loss or carryover, state/ca/3801/formScope.ts): line 5 then takes
 * FTB 3801's Schedule E adjustment. A passive rental with only gains uses FTB
 * 3885A alone (ca-540-sched-ca-inst-2025::sec::line-5-rental-real-estate-royalties-partnerships-s-corporations-trusts-etc::b02).
 */
export const PASSIVE_GAP =
  "A passive activity's California depreciation difference goes through form FTB 3801 (passive activity loss limitations), which is not modeled.";
export const RENTAL_WITHOUT_3801_GAP =
  "A passive rental with a loss or a prior year unallowed loss figures its Schedule CA line 5 amount on FTB 3801, and FTB 3801 is not filed (decisions.scope.must_file_3801 is false).";

/* The column B and C amounts for Schedule CA line 3 (businesses) or line 5 (rentals). */
export interface DepreciationAdjustment {
  subtraction: number;
  addition: number;
  /* Why the engine does not figure it; undefined when it does or while it waits. */
  gap?: string;
  /* An activity's figures wait for an answer. */
  waits?: boolean;
}

export interface CaEmployeeAmounts {
  grossIncome?: number;
  netProfit?: number;
  netLoss?: number;
  selfEmploymentTaxDeduction?: number;
  selfEmployedHealthInsurance?: number;
}

/* Whether a rental needs FTB 3801 for its line 5 amount; undefined while that is unknown. */
type Needs3801 = (factKey: string) => boolean | undefined;

/* FTB 3801's scope is figured only when a rental's difference asks for it. */
function rentalNeeds3801(inputs: ResolverInputs): Needs3801 {
  let found: ReturnType<typeof form3801Scope> | undefined;
  return (factKey) => {
    const scope = (found ??= form3801Scope(inputs));
    if (scope.triggeredBy.includes(factKey)) return true;
    return scope.undecidedPropertyKeys.includes(factKey) ? undefined : false;
  };
}

/* The activity's passive answer as line 3 or 5 reads it. */
function passiveForLine(activity: Form3885AActivity, needs3801: Needs3801) {
  return activity.kind === "rental" ? needs3801(activity.factKey) : activity.passive;
}

function adjustmentFor(
  inputs: ResolverInputs,
  kind: "business" | "rental",
): DepreciationAdjustment {
  const activities = caDepreciationActivities(inputs).filter((activity) => activity.kind === kind);
  const needs3801 = kind === "rental" ? rentalNeeds3801(inputs) : () => undefined;
  const totals: DepreciationAdjustment = { subtraction: 0, addition: 0 };
  for (const activity of activities) {
    const gap = form3885AFigures(activity.depreciation).gap;
    if (gap) return { ...totals, gap };
    const adjustment = californiaAdjustment(activity.depreciation);
    if (adjustment === undefined) return { ...totals, waits: true };
    const differs = adjustment.subtraction > 0 || adjustment.addition > 0;
    const passive = differs ? passiveForLine(activity, needs3801) : undefined;
    if (differs && passive === undefined) return { ...totals, waits: true };
    if (differs && passive) {
      return { ...totals, gap: kind === "rental" ? RENTAL_WITHOUT_3801_GAP : PASSIVE_GAP };
    }
    totals.subtraction = sum(totals.subtraction, adjustment.subtraction);
    totals.addition = sum(totals.addition, adjustment.addition);
  }
  return totals;
}

/*
 * The worker-status answers are asked of a California filer with a business
 * (ca-540-sched-ca-inst-2025::sec::general-information::b19); the amounts once
 * the answer is yes.
 */
export function resolveActivityAdjustments(inputs: ResolverInputs) {
  const keys = CA_EMPLOYEE_CLASSIFICATION_KEYS;
  const files540 = inputs.decisionByKey.get("decisions.scope.must_file_ca_540") === true;
  const joint = spousePropertiesOnReturn(filingStatusOf(inputs));
  const hasBusiness = businessesOnReturn(inputs.facts, joint).businesses.length > 0;
  const classified = inputs.factByKey.get(keys.classifiedAsEmployee) as boolean | undefined;
  const amounts: CaEmployeeAmounts | undefined =
    classified === true
      ? {
          grossIncome: num(inputs, keys.grossIncome),
          netProfit: num(inputs, keys.netProfit),
          netLoss: num(inputs, keys.netLoss),
          selfEmploymentTaxDeduction: num(inputs, keys.selfEmploymentTaxDeduction),
          selfEmployedHealthInsurance: num(inputs, keys.selfEmployedHealthInsurance),
        }
      : undefined;
  const asked = files540 && hasBusiness;
  return {
    caEmployeeAmounts: amounts,
    businessDepreciationAdjustment: adjustmentFor(inputs, "business"),
    rentalDepreciationAdjustment: adjustmentFor(inputs, "rental"),
    activityMissingInputs: asked
      ? missingInputs({
          [keys.classifiedAsEmployee]: classified,
          ...(classified
            ? {
                [keys.grossIncome]: amounts?.grossIncome,
                [keys.netProfit]: amounts?.netProfit,
                [keys.netLoss]: amounts?.netLoss,
                [keys.selfEmploymentTaxDeduction]: amounts?.selfEmploymentTaxDeduction,
                [keys.selfEmployedHealthInsurance]: amounts?.selfEmployedHealthInsurance,
              }
            : {}),
        })
      : [],
  };
}
