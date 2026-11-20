import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form5870AFilingInfo } from "./filingInfo.js";

/*
 * ca-5870a-inst-2025::sec::purpose::b01: a beneficiary of a trust who received an accumulation distribution.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve5870AInfo(inputs: ResolverInputs): Form5870AFilingInfo {
  return {
    mustFile: {
      "form-5870a": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_5870a",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
