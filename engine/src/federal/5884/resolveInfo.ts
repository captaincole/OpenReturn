import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form5884FilingInfo } from "./filingInfo.js";

/*
 * Who files: an employer who claims the work opportunity credit for wages paid to employees from targeted groups.
 * The instructions are a separate document (Instructions for Form 5884, Rev. March 2021), which is not in the corpus yet.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve5884Info(inputs: ResolverInputs): Form5884FilingInfo {
  return {
    mustFile: {
      "form-5884": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_5884",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
