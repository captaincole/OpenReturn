import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form4255FilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: a taxpayer who must recapture a credit or pay an excessive payment.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve4255Info(inputs: ResolverInputs): Form4255FilingInfo {
  return {
    mustFile: {
      "form-4255": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_4255",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
