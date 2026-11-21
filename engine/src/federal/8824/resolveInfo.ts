import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8824FilingInfo } from "./filingInfo.js";

/*
 * Who files: a like-kind exchange of real property.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8824Info(inputs: ResolverInputs): Form8824FilingInfo {
  return {
    mustFile: {
      "form-8824": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8824",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
