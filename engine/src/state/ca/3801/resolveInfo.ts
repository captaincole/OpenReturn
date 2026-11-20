import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3801FilingInfo } from "./filingInfo.js";

/*
 * ca-3801-inst-2025::sec::b-who-must-file::b01: losses from passive activities, unless the only one is a rental real estate loss that the special allowance covers in full.
 * The engine does not figure California passive losses apart from the federal ones, so no fact turns the form on: only the decision does.
 */
export function resolve3801Info(inputs: ResolverInputs): Form3801FilingInfo {
  return {
    mustFile: {
      "form-3801": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3801",
        fallbacks: [
          { rule: "fallback: no rule yet for California passive activity losses", value: false },
        ],
      }),
    },
  };
}
