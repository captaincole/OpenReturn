import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8834FilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: a taxpayer with a qualified electric vehicle passive activity credit from a prior year.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8834Info(inputs: ResolverInputs): Form8834FilingInfo {
  return {
    mustFile: {
      "form-8834": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8834",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
