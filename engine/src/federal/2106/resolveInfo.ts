import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form2106FilingInfo } from "./filingInfo.js";

/*
 * irs-2106-inst-2025::sec::general-instructions::b01: reservists, performing artists, fee-basis officials and employees with impairment-related work expenses.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve2106Info(inputs: ResolverInputs): Form2106FilingInfo {
  return {
    mustFile: {
      "form-2106": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_2106",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
