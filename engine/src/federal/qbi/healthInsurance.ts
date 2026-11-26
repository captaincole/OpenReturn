/*
 * QBI takes off "the self-employment health insurance deduction" of a trade
 * or business (irs-8995a-inst-2025::sec::determining-your-qbi-deduction::b15).
 * qbi/lines.ts subtracts a Schedule C or F plan's Form 7206 line 14 from its
 * business. Here, the businesses whose deduction the engine cannot know.
 */

import { k1FormOfKey } from "../../facts/index.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { resolve7206Info } from "../7206/resolveInfo.js";
import type { QbiBusiness } from "./filingInfo.js";

export const S_CORPORATION_PLAN_QBI =
  "A health plan is established under an S corporation: the QBI instructions take the self-employed health insurance deduction off the business it belongs to (irs-8995a-inst-2025::sec::determining-your-qbi-deduction::b15), and they do not say how a shareholder takes it off the QBI an S corporation's section 199A statement gives.";

const PLAN_GAP_QBI = (reason: string) =>
  `The QBI takes off this business's self-employed health insurance deduction, which the engine cannot figure: ${reason}`;

/* A business with a plan whose Form 7206 is a gap, and every S corporation statement next to an S corporation plan. */
export function withHealthPlanGaps(
  inputs: ResolverInputs,
  businesses: QbiBusiness[],
): QbiBusiness[] {
  const plans = resolve7206Info(inputs).form7206Plans ?? [];
  if (plans.length === 0) return businesses;
  const sCorporationPlan = plans.some((plan) => plan.kind === "s_corporation");
  return businesses.map((business) => {
    if (business.qbiGap) return business;
    const gap = plans.find((plan) => plan.businessKey === business.factKey && plan.gap)?.gap;
    if (gap) return { ...business, qbiGap: PLAN_GAP_QBI(gap) };
    const sCorporation =
      business.kind === "passThrough" && k1FormOfKey(business.factKey) === "1120-S";
    return sCorporationPlan && sCorporation
      ? { ...business, qbiGap: S_CORPORATION_PLAN_QBI }
      : business;
  });
}
