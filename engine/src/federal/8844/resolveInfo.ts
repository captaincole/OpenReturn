import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8844FilingInfo } from "./filingInfo.js";

/*
 * Who files: an employer who claims the empowerment zone employment credit for wages paid to employees who live and work in an empowerment zone.
 * The instructions are a separate document (Instructions for Form 8844, Rev. December 2021), which is not in the corpus yet.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8844Info(inputs: ResolverInputs): Form8844FilingInfo {
  return {
    mustFile: {
      "form-8844": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8844",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
