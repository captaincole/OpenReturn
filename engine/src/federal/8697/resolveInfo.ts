import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8697FilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: a taxpayer with a long-term contract under the look-back method.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8697Info(inputs: ResolverInputs): Form8697FilingInfo {
  return {
    mustFile: {
      "form-8697": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8697",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
