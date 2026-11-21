import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8582CRFilingInfo } from "./filingInfo.js";

/*
 * Who files: a taxpayer with a credit from a passive activity.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8582CRInfo(inputs: ResolverInputs): Form8582CRFilingInfo {
  return {
    mustFile: {
      "form-8582-cr": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8582_cr",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
