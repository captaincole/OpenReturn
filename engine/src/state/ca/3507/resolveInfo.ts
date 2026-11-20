import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3507FilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: an employer who claims the prison inmate labor credit.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3507Info(inputs: ResolverInputs): Form3507FilingInfo {
  return {
    mustFile: {
      "form-3507": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3507",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
