import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form4797FilingInfo } from "./filingInfo.js";

/*
 * irs-4797-inst-2025::sec::general-instructions::b01: a sale or exchange of business property, or recapture of depreciation.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve4797Info(inputs: ResolverInputs): Form4797FilingInfo {
  return {
    mustFile: {
      "form-4797": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_4797",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
