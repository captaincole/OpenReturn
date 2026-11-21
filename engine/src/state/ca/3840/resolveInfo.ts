import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3840FilingInfo } from "./filingInfo.js";

/*
 * Who files: a like-kind exchange of California property for property in another state.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3840Info(inputs: ResolverInputs): Form3840FilingInfo {
  return {
    mustFile: {
      "form-3840": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3840",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
