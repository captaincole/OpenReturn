import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3807FilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: a taxpayer with a local agency military base recovery area credit carryover or deduction.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3807Info(inputs: ResolverInputs): Form3807FilingInfo {
  return {
    mustFile: {
      "form-3807": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3807",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
