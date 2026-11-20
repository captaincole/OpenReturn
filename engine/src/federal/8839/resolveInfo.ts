import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8839FilingInfo } from "./filingInfo.js";

/*
 * irs-8839-inst-2025::sec::general-instructions::b01: a taxpayer with qualified adoption expenses or employer adoption benefits.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8839Info(inputs: ResolverInputs): Form8839FilingInfo {
  return {
    mustFile: {
      "form-8839": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8839",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
