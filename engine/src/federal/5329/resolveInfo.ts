import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form5329FilingInfo } from "./filingInfo.js";

/*
 * irs-5329-inst-2025::sec::who-must-file::b01: additional tax on an early distribution, an excess contribution or a missed required distribution.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve5329Info(inputs: ResolverInputs): Form5329FilingInfo {
  return {
    mustFile: {
      "form-5329": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_5329",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
