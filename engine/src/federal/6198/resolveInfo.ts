import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form6198FilingInfo } from "./filingInfo.js";

/*
 * irs-6198-inst-2025::sec::who-must-file::b01: a loss from an at-risk activity when some of the investment is not at risk.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve6198Info(inputs: ResolverInputs): Form6198FilingInfo {
  return {
    mustFile: {
      "form-6198": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_6198",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
