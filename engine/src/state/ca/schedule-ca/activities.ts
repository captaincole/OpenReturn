/*
 * Schedule CA (540) amounts from a business or rental: a contractor who is an
 * employee for California (facts/kinds/caEmployeeClassification.ts), and the
 * FTB 3885A depreciation and amortization differences (state/ca/3885a).
 */

import { businessesOnReturn, CA_EMPLOYEE_CLASSIFICATION_KEYS } from "../../../facts/index.js";
import { filingStatusOf } from "../../../filingInfoResolvers.js";
import { sum } from "../../../money.js";
import { missingInputs, num, type ResolverInputs } from "../../../resolverInputs.js";
import { californiaAdjustment } from "../3885a/lines.js";
import { caDepreciationActivities } from "../3885a/resolveInfo.js";

/* ca-3885a-inst-2025::sec::line-8a-and-line-8b::b01: a passive activity's difference goes to FTB 3801. */
export const PASSIVE_GAP =
  "A passive activity's California depreciation difference goes through form FTB 3801 (passive activity loss limitations), which is not modeled.";

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

function adjustmentFor(
  inputs: ResolverInputs,
  kind: "business" | "rental",
): DepreciationAdjustment {
  const activities = caDepreciationActivities(inputs).filter((activity) => activity.kind === kind);
  const totals: DepreciationAdjustment = { subtraction: 0, addition: 0 };
  for (const activity of activities) {
    const adjustment = californiaAdjustment(activity.depreciation);
    if (adjustment === undefined) return { ...totals, waits: true };
    const differs = adjustment.subtraction > 0 || adjustment.addition > 0;
    if (differs && activity.passive === undefined) return { ...totals, waits: true };
    if (differs && activity.passive) return { ...totals, gap: PASSIVE_GAP };
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
  const status = filingStatusOf(inputs);
  const joint = status === undefined || status === "married_filing_jointly";
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
