import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3461FilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: a noncorporate taxpayer with a net business loss above the yearly limit.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3461Info(inputs: ResolverInputs): Form3461FilingInfo {
  return {
    mustFile: {
      "form-3461": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3461",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
