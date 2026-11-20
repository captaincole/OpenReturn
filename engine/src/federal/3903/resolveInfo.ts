import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form3903FilingInfo } from "./filingInfo.js";

/*
 * irs-3903-inst-2025::sec::purpose-of-form::b01: a member of the Armed Forces on active duty who moves on a permanent change of station.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3903Info(inputs: ResolverInputs): Form3903FilingInfo {
  return {
    mustFile: {
      "form-3903": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3903",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
