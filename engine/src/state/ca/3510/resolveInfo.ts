import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3510FilingInfo } from "./filingInfo.js";

/*
 * ca-3510-inst-2025::sec::b-who-must-file::b01: a minimum tax credit carryover from 2024, or 2024 minimum tax with deferral items.
 * The engine has no fact for last year's California minimum tax, so no fact turns the form on: only the decision does.
 */
export function resolve3510Info(inputs: ResolverInputs): Form3510FilingInfo {
  return {
    mustFile: {
      "form-3510": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3510",
        fallbacks: [
          {
            rule: "fallback: no fact for last year's California minimum tax or credit carryover",
            value: false,
          },
        ],
      }),
    },
  };
}
