import { readBusinessFacts } from "../../facts/index.js";
import { missingInputs, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { ScheduleCFilingInfo } from "./filingInfo.js";

const MUST_FILE_KEY = "decisions.scope.must_file_schedule_c";

/*
 * irs-1040sc-inst-2025::sec::small-business-and-self-employed-sb-se-tax-center-do::b02:
 * Schedule C reports a business operated as a sole proprietor. A business fact
 * whose amounts are not numbers leaves the question open, so Cade asks again.
 * Statutory employees, qualified joint ventures and Form 1099 amounts reported
 * without a business fact have no facts yet.
 */
export function resolveScheduleCInfo(inputs: ResolverInputs): ScheduleCFilingInfo {
  const { businesses, malformedKeys } = readBusinessFacts(inputs.facts);
  const open = malformedKeys.length > 0 && !inputs.decisionByKey.has(MUST_FILE_KEY);
  return {
    mustFile: {
      "schedule-c": open
        ? resolveMustFile(inputs.decisionByKey, { explicitKey: MUST_FILE_KEY })
        : resolveMustFile(inputs.decisionByKey, {
            explicitKey: MUST_FILE_KEY,
            fallbacks: [
              {
                rule: "fallback: a sole-proprietor business fact",
                value: businesses.length > 0,
                triggeredByFactKeys: businesses.map((business) => business.key),
              },
            ],
          }),
    },
    missingInputs: {
      "schedule-c": missingInputs(Object.fromEntries(malformedKeys.map((key) => [key, undefined]))),
    },
    businesses: businesses.map((business) => business.value),
  };
}
