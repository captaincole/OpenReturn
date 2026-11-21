import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form6781FilingInfo } from "./filingInfo.js";

/*
 * Who files: a gain or loss on a section 1256 contract or a straddle.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve6781Info(inputs: ResolverInputs): Form6781FilingInfo {
  return {
    mustFile: {
      "form-6781": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_6781",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
