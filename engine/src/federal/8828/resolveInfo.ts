import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8828FilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: a taxpayer who sold a home that had a federally subsidized mortgage.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8828Info(inputs: ResolverInputs): Form8828FilingInfo {
  return {
    mustFile: {
      "form-8828": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8828",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
