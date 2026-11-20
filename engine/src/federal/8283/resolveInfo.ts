import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8283FilingInfo } from "./filingInfo.js";

/*
 * irs-8283-inst-2025::sec::who-must-file::b01: a deduction of more than $500 for a noncash gift, or for a group of similar items.
 * The engine has no fact for each noncash gift (the property, its dates and its value), so no fact turns the form on: only the decision does.
 */
export function resolve8283Info(inputs: ResolverInputs): Form8283FilingInfo {
  return {
    mustFile: {
      "form-8283": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8283",
        fallbacks: [{ rule: "fallback: no fact for each noncash gift", value: false }],
      }),
    },
  };
}
