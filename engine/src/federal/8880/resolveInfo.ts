import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8880FilingInfo } from "./filingInfo.js";

/*
 * irs-8880-form-2025::sec::who-can-take-this-credit::b01: a taxpayer who claims the credit for retirement savings contributions.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8880Info(inputs: ResolverInputs): Form8880FilingInfo {
  return {
    mustFile: {
      "form-8880": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8880",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
