import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8933FilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: a taxpayer who claims the carbon oxide sequestration credit.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8933Info(inputs: ResolverInputs): Form8933FilingInfo {
  return {
    mustFile: {
      "form-8933": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8933",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
