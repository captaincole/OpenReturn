import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form1116FilingInfo } from "./filingInfo.js";

/*
 * irs-1116-inst-2025::sec::purpose-of-form::b01: file to claim the foreign tax credit when the small-amount election does not apply.
 * The engine does not total foreign tax paid or check the election yet, so no fact turns the form on: only the decision does.
 */
export function resolve1116Info(inputs: ResolverInputs): Form1116FilingInfo {
  return {
    mustFile: {
      "form-1116": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_1116",
        fallbacks: [
          {
            rule: "fallback: no rule yet for foreign tax paid above the election limit",
            value: false,
          },
        ],
      }),
    },
  };
}
