import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form965AFilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: a person with net 965 tax liability paid in installments or deferred.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve965AInfo(inputs: ResolverInputs): Form965AFilingInfo {
  return {
    mustFile: {
      "form-965-a": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_965_a",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
