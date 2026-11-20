import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3805ZFilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: a taxpayer with an enterprise zone credit carryover or deduction.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3805ZInfo(inputs: ResolverInputs): Form3805ZFilingInfo {
  return {
    mustFile: {
      "form-3805z": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3805z",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
