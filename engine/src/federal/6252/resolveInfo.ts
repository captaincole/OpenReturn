import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form6252FilingInfo } from "./filingInfo.js";

/*
 * irs-6252-form-2025::sec::purpose-of-form::b01: income from an installment sale.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve6252Info(inputs: ResolverInputs): Form6252FilingInfo {
  return {
    mustFile: {
      "form-6252": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_6252",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
