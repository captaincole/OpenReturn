import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form461FilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: a noncorporate taxpayer with a net business loss above the yearly limit.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve461Info(inputs: ResolverInputs): Form461FilingInfo {
  return {
    mustFile: {
      "form-461": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_461",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
