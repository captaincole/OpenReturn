/*
 * Who files FTB 5805F: a farmer or fisherman on Form 540. "Attach this form
 * to the back of your Form 540 ... even if you do not owe a penalty" (the form
 * face, ca-5805f-face-2025::sec::face-header::b01; also
 * ca-5805f-inst-2025::sec::f-amended-tax-returns::b01). A farmer or fisherman
 * has at least two-thirds of the 2024 or 2025 gross income from farming or
 * fishing (::b-qualifications::b01). FTB 5805 reads the same answer: a farmer
 * or fisherman uses this form instead (ca-5805-inst-2025::sec::g-farmers-and-fishermen::b01).
 */

import { FARMER_OR_FISHERMAN_KEYS, getFarmerGrossIncomeFacts } from "../../../facts/index.js";
import { resolve4835Info } from "../../../federal/4835/resolveInfo.js";
import { resolveScheduleFInfo } from "../../../federal/schedule-f/resolveInfo.js";
import type { MustFileResolution } from "../../../filingInfo.js";
import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import { meetsGrossIncomeTest } from "./lines.js";

export const MUST_FILE_5805F_KEY = "decisions.scope.must_file_5805f";
const MUST_FILE_540_KEY = "decisions.scope.must_file_ca_540";

/* The year facts that pass the two-thirds test (2024 or 2025). */
export function farmerOrFishermanFactKeys(inputs: ResolverInputs): string[] {
  return getFarmerGrossIncomeFacts(inputs.facts)
    .filter(({ value }) =>
      meetsGrossIncomeTest(value.totalGrossIncome, value.farmingOrFishingGrossIncome),
    )
    .map(({ key }) => key);
}

/* Schedule F or Form 4835 files: the return has gross income from farming. */
function farmIncomeOnReturn(inputs: ResolverInputs): boolean {
  return (
    resolveScheduleFInfo(inputs).mustFile?.["schedule-f"]?.value === true ||
    resolve4835Info(inputs).mustFile?.["form-4835"]?.value === true
  );
}

/*
 * The two-thirds answers FTB 5805 waits on: "If you determine that you are not
 * a farmer or fisherman, do not use this form. Instead, use form FTB 5805"
 * (ca-5805f-inst-2025::sec::b-qualifications::b01). With farm income on a Form
 * 540 return and no explicit decision, each year not yet stated waits until a
 * stated year passes the test or both years fail it.
 */
export function farmerTestWaitingKeys(inputs: ResolverInputs): string[] {
  if (typeof inputs.decisionByKey.get(MUST_FILE_5805F_KEY) === "boolean") return [];
  if (inputs.decisionByKey.get(MUST_FILE_540_KEY) !== true) return [];
  if (farmerOrFishermanFactKeys(inputs).length > 0) return [];
  if (!farmIncomeOnReturn(inputs)) return [];
  const stated = new Set(getFarmerGrossIncomeFacts(inputs.facts).map(({ key }) => key));
  return Object.values(FARMER_OR_FISHERMAN_KEYS).filter((key) => !stated.has(key));
}

export function resolve5805FMustFile(inputs: ResolverInputs): MustFileResolution {
  const files540 = inputs.decisionByKey.get(MUST_FILE_540_KEY) === true;
  const passing = farmerOrFishermanFactKeys(inputs);
  return resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_5805F_KEY,
    fallbacks: [
      {
        rule: `fallback: Form 540 files (${files540}) and at least two-thirds of the 2024 or 2025 gross income is from farming or fishing (${passing.length > 0})`,
        value: files540 && passing.length > 0,
        triggeredByFactKeys: passing,
        triggeredByDecisionKeys: [MUST_FILE_540_KEY],
      },
    ],
  });
}
