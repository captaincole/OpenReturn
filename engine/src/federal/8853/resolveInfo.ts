import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8853FilingInfo } from "./filingInfo.js";

/*
 * irs-8853-inst-2025::sec::who-must-file::b01: an Archer MSA contribution or distribution, or long-term care insurance payments.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8853Info(inputs: ResolverInputs): Form8853FilingInfo {
  return {
    mustFile: {
      "form-8853": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8853",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
