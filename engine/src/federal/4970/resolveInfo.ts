import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form4970FilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: a beneficiary of a trust who received an accumulation distribution.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve4970Info(inputs: ResolverInputs): Form4970FilingInfo {
  return {
    mustFile: {
      "form-4970": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_4970",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
