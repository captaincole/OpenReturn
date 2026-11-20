import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8621FilingInfo } from "./filingInfo.js";

/*
 * irs-8621-inst-2025::sec::general-instructions::b01: a shareholder of a passive foreign investment company.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8621Info(inputs: ResolverInputs): Form8621FilingInfo {
  return {
    mustFile: {
      "form-8621": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8621",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
