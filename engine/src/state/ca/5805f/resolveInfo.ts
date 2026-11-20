import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form5805FFilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: a farmer or fisherman who underpaid estimated tax.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve5805FInfo(inputs: ResolverInputs): Form5805FFilingInfo {
  return {
    mustFile: {
      "form-5805f": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_5805f",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
