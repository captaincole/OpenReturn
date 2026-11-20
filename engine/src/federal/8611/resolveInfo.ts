import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8611FilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: an owner of a low-income housing building whose qualified basis decreased.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8611Info(inputs: ResolverInputs): Form8611FilingInfo {
  return {
    mustFile: {
      "form-8611": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8611",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
