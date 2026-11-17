import { hasDistributionCode, type RetirementDistributionFactValue } from "../../facts/index.js";

/*
 * Code Q is not taxable. Codes J and T take the taxable part from Form 8606
 * Part III (rothTaxable in resolveInfo.ts), so box 2a is not used here. Code Y, a qualified
 * charitable distribution, is not modeled (1040 inst., lines 4a/4b, Exception 3).
 */
export function rowTaxable(distribution: RetirementDistributionFactValue): number | undefined {
  if (distribution.box7.includes("Q")) return 0;
  if (hasDistributionCode(distribution, ["J", "T", "Y"])) return undefined;
  if (distribution.box2a === undefined && distribution.box2b?.taxableAmountNotDetermined === true)
    return undefined;
  return distribution.box2a ?? distribution.box1;
}
