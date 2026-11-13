/*
 * irs-1040-inst-2025::sec::use-the-social-security-benefits::b01: "You made
 * contributions to a traditional IRA for 2025 and you or your spouse were
 * covered by a retirement plan at work or through self-employment. Instead,
 * use the worksheets in Pub. 590-A to see if any of your social security
 * benefits are taxable and to figure your IRA deduction." The engine does not
 * have those worksheets (Pub. 590-A, Appendix B), so Schedule 1 line 20 and
 * Form 1040 line 6b are unsupported then.
 */

import {
  ADJUSTMENT_KEYS,
  isSocialSecurityFactKey,
  readTraditionalIraFact,
  type W2FactValue,
} from "../../facts/index.js";
import { factsInCategory, num, type ResolverInputs } from "../../resolverInputs.js";

export const PUB_590A_GAP =
  "Social Security benefits with a traditional IRA contribution and a retirement plan: Pub. 590-A, Appendix B figures both the IRA deduction and the taxable benefits, and it is not modeled.";

export function needsPub590AWorksheets(inputs: ResolverInputs): boolean {
  const hasBenefits = factsInCategory(inputs, "retirement").some((row) =>
    isSocialSecurityFactKey(row.key),
  );
  const contributed = (["taxpayer", "spouse"] as const).some(
    (owner) => (readTraditionalIraFact(inputs.factByKey, owner)?.contributions ?? 0) > 0,
  );
  const covered =
    factsInCategory(inputs, "wages").some(
      (row) => (row.value as W2FactValue)?.box13?.retirementPlan === true,
    ) || (num(inputs, ADJUSTMENT_KEYS.selfEmployedPlanDeduction) ?? 0) > 0;
  return hasBenefits && contributed && covered;
}
