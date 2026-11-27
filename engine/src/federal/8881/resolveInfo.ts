import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8881FilingInfo } from "./filingInfo.js";

/*
 * Who files: an eligible small employer who claims the credit for the startup costs of a new retirement plan, for an auto-enrollment feature, or for military spouse participation.
 * The instructions are a separate document (Instructions for Form 8881, Rev. December 2025), which is not in the corpus yet.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8881Info(inputs: ResolverInputs): Form8881FilingInfo {
  return {
    mustFile: {
      "form-8881": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8881",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
