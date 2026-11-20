import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8938FilingInfo } from "./filingInfo.js";

/*
 * irs-8938-inst-2025::sec::who-must-file::b01: a specified person with specified foreign financial assets above the reporting threshold.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8938Info(inputs: ResolverInputs): Form8938FilingInfo {
  return {
    mustFile: {
      "form-8938": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8938",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
