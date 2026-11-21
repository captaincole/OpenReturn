import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3805EFilingInfo } from "./filingInfo.js";

/*
 * Who files: income from an installment sale, when the California amount differs from the federal amount.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3805EInfo(inputs: ResolverInputs): Form3805EFilingInfo {
  return {
    mustFile: {
      "form-3805e": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3805e",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
