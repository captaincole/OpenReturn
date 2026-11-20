import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8815FilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: a taxpayer who cashed series EE or I savings bonds and paid qualified higher education expenses.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8815Info(inputs: ResolverInputs): Form8815FilingInfo {
  return {
    mustFile: {
      "form-8815": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8815",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
