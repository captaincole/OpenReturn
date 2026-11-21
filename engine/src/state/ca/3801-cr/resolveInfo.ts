import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3801CRFilingInfo } from "./filingInfo.js";

/*
 * Who files: a taxpayer with a California credit from a passive activity.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3801CRInfo(inputs: ResolverInputs): Form3801CRFilingInfo {
  return {
    mustFile: {
      "form-3801-cr": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3801_cr",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
