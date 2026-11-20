import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3809FilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: a taxpayer with a targeted tax area credit carryover or deduction.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3809Info(inputs: ResolverInputs): Form3809FilingInfo {
  return {
    mustFile: {
      "form-3809": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3809",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
