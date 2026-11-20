import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3803FilingInfo } from "./filingInfo.js";

/*
 * ca-3803-inst-2025::sec::c-how-to-make-the-election::b01: parents choose to report a child's interest and dividends on their California return.
 * The engine has no fact for a child's income, so no fact turns the form on: only the decision does.
 */
export function resolve3803Info(inputs: ResolverInputs): Form3803FilingInfo {
  return {
    mustFile: {
      "form-3803": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3803",
        fallbacks: [
          { rule: "fallback: no fact for a child's interest and dividends", value: false },
        ],
      }),
    },
  };
}
