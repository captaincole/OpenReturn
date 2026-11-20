import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8911FilingInfo } from "./filingInfo.js";

/*
 * irs-8911-inst-2025::sec::general-instructions::b01: a taxpayer who placed alternative fuel vehicle refueling property in service.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8911Info(inputs: ResolverInputs): Form8911FilingInfo {
  return {
    mustFile: {
      "form-8911": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8911",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
