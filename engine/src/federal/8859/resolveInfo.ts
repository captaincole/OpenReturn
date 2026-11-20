import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8859FilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: a taxpayer with a carryforward of the District of Columbia first-time homebuyer credit.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8859Info(inputs: ResolverInputs): Form8859FilingInfo {
  return {
    mustFile: {
      "form-8859": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8859",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
