import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3506FilingInfo } from "./filingInfo.js";

/*
 * ca-3506-inst-2025::sec::a-purpose::b01: a taxpayer who claims the California credit for child and dependent care expenses.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3506Info(inputs: ResolverInputs): Form3506FilingInfo {
  return {
    mustFile: {
      "form-3506": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3506",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
