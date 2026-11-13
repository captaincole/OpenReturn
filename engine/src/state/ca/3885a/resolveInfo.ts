import type { RentalFactValue } from "../../../facts/index.js";
import { depreciationActivities } from "../../../federal/4562/resolveInfo.js";
import { selfRentalState } from "../../../federal/rentals/passive.js";
import { netIncomeOrLoss } from "../../../federal/schedule-e/lines.js";
import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3885AActivity, Form3885AFilingInfo } from "./filingInfo.js";
import { form3885AFigures, mustFile3885A } from "./lines.js";

const MUST_FILE_KEY = "decisions.scope.must_file_3885a";

/*
 * ca-3885a-inst-2025::sec::line-1::b01: a passive activity is a trade or business
 * the owner did not materially participate in, and California does not conform
 * to the federal rule that a real estate professional's rental is not passive.
 * So a rental is passive, except a self-rental with net income, which is
 * nonpassive (federal/rentals/passive.ts selfRentalState); a royalty follows its
 * royaltyActivity answer.
 */
function rentalPassive(property: RentalFactValue): boolean | undefined {
  if (property.propertyType === "royalties") {
    return property.royaltyActivity === undefined
      ? undefined
      : property.royaltyActivity === "passive";
  }
  const selfRental = selfRentalState(property, netIncomeOrLoss(property));
  if (selfRental === undefined) return undefined;
  return selfRental !== "recharacterized";
}

/* Every business and rental of this return with depreciation answers (Form 4562's list), with line 1. */
export function caDepreciationActivities(inputs: ResolverInputs): Form3885AActivity[] {
  return depreciationActivities(inputs).map((activity) => ({
    ...activity,
    passive:
      activity.kind === "rental"
        ? rentalPassive(activity.rental)
        : activity.business.materiallyParticipated === undefined
          ? undefined
          : !activity.business.materiallyParticipated,
  }));
}

/*
 * ca-3885a-inst-2025::sec::a-purpose::b01: use the form only when California
 * and federal depreciation or amortization differ; one form for each activity
 * with a difference (::specific-line-instructions::b01). The return files it
 * with Form 540. An activity whose figures the engine cannot compute (lines.ts
 * gaps) files too, when it has 2025 assets: the special allowance alone makes a
 * difference, and its lines say why they are blank.
 */
export function resolve3885AInfo(inputs: ResolverInputs): Form3885AFilingInfo {
  const files540 = inputs.decisionByKey.get("decisions.scope.must_file_ca_540") === true;
  const activities = files540
    ? caDepreciationActivities(inputs).filter(
        (activity) =>
          mustFile3885A(activity.depreciation) ||
          (form3885AFigures(activity.depreciation).gap !== undefined &&
            (activity.depreciation.assets?.length ?? 0) > 0),
      )
    : [];
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: Form 540 files (${files540}) and ${activities.length} business or rental has a California depreciation or amortization difference`,
        value: activities.length > 0,
        triggeredByFactKeys: activities.map((activity) => activity.factKey),
        triggeredByDecisionKeys: ["decisions.scope.must_file_ca_540"],
      },
    ],
  });
  return {
    mustFile: { "form-3885a": resolution },
    missingInputs: { "form-3885a": [] },
    form3885aActivities: activities,
  };
}
