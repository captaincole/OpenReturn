import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3804CRFilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: an owner of a pass-through entity that paid the elective tax.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3804CRInfo(inputs: ResolverInputs): Form3804CRFilingInfo {
  return {
    mustFile: {
      "form-3804-cr": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3804_cr",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
