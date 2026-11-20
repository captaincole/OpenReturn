import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8936FilingInfo } from "./filingInfo.js";

/*
 * irs-8936-inst-2025::sec::general-instructions::b01: a taxpayer who claims a clean vehicle credit.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8936Info(inputs: ResolverInputs): Form8936FilingInfo {
  return {
    mustFile: {
      "form-8936": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8936",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
