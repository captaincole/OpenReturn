import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form5471FilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: a U.S. person who is an officer, director or shareholder of certain foreign corporations.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve5471Info(inputs: ResolverInputs): Form5471FilingInfo {
  return {
    mustFile: {
      "form-5471": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_5471",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
