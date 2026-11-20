import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8978FilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: a partner who received a Form 8986 after a partnership audit adjustment.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8978Info(inputs: ResolverInputs): Form8978FilingInfo {
  return {
    mustFile: {
      "form-8978": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8978",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
