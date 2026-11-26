import {
  FUEL_TAX_REGISTRATION_NUMBERS_KEY,
  getFuelRegistrationNumbers,
  getFuelTaxActivityFacts,
  type FuelTaxActivityFact,
} from "../../facts/index.js";
import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form4136FilingInfo } from "./filingInfo.js";
import { form4136Of, type Form4136Result, type LinkedBusiness } from "./form.js";

/* Lines C to E from the Schedule C business or Schedule F farm fact the activity names. */
function linkedBusiness(inputs: ResolverInputs): LinkedBusiness {
  return (key) => {
    const value = inputs.factByKey.get(key) as
      { name?: string; ein?: string; code?: string } | undefined;
    return { name: value?.name, ein: value?.ein, code: value?.code };
  };
}

const hasClaim = (activity: FuelTaxActivityFact) =>
  (activity.value.claims ?? []).some((claim) => claim.gallons > 0);

/*
 * The answers a filed form waits for: the registration number of a claimed
 * line 6, 7, 8, 13 or 15 (irs-4136-inst-2025::sec::information-for-claims-on-lines-6-8::b01),
 * and the Part I code and equipment of the activity that Part I describes
 * (irs-4136-inst-2025::sec::specific-instructions::b01): Cade records the
 * activity fact again with them.
 */
function missingAnswers(result: Form4136Result): string[] {
  const missing: string[] = [];
  if (result.missingRegistration) missing.push(FUEL_TAX_REGISTRATION_NUMBERS_KEY);
  const partI = result.partI;
  if (partI !== undefined && (partI.code === undefined || partI.equipment === undefined)) {
    missing.push(partI.activityKey);
  }
  return missing;
}

/*
 * Who files: a taxpayer who claims the credit for federal tax paid on fuels
 * (irs-4136-inst-2025::sec::general-instructions::b01): an activity fact with a
 * claim of more than 0 gallons. Line A: with no qualifying business activity
 * and no home use of kerosene, "don't complete Form 4136"
 * (irs-4136-inst-2025::sec::specific-instructions::b01). The explicit decision
 * still wins.
 */
export function resolve4136Info(inputs: ResolverInputs): Form4136FilingInfo {
  const activities = getFuelTaxActivityFacts(inputs.facts);
  const claiming = activities.filter(hasClaim);
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_4136",
    fallbacks: [
      {
        rule: `fallback: ${claiming.length} fuel tax activity(ies) with a claim`,
        value: claiming.length > 0,
        triggeredByFactKeys: claiming.map((activity) => activity.key),
      },
    ],
  });
  const filed = { mustFile: { "form-4136": mustFile } };
  if (mustFile.value !== true) return filed;
  const registration = getFuelRegistrationNumbers(inputs.facts) ?? {};
  const result = form4136Of(activities, registration, linkedBusiness(inputs));
  if (typeof result === "string") return { ...filed, form4136Gap: result };
  return {
    ...filed,
    missingInputs: { "form-4136": missingAnswers(result) },
    form4136: result,
  };
}
