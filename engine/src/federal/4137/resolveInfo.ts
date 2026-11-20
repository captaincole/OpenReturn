import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form4137FilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: an employee with tips not reported to the employer.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve4137Info(inputs: ResolverInputs): Form4137FilingInfo {
  return {
    mustFile: {
      "form-4137": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_4137",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
