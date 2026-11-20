import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3541FilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: a holder of a California motion picture and television production credit.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3541Info(inputs: ResolverInputs): Form3541FilingInfo {
  return {
    mustFile: {
      "form-3541": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3541",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
