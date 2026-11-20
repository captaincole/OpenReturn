import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8801FilingInfo } from "./filingInfo.js";

/*
 * irs-8801-inst-2025::sec::who-should-file::b01: a 2024 minimum tax liability with deferral items, or a credit carryforward to 2025.
 * The engine has no fact for last year's minimum tax, so no fact turns the form on: only the decision does.
 */
export function resolve8801Info(inputs: ResolverInputs): Form8801FilingInfo {
  return {
    mustFile: {
      "form-8801": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8801",
        fallbacks: [
          {
            rule: "fallback: no fact for last year's minimum tax or credit carryforward",
            value: false,
          },
        ],
      }),
    },
  };
}
