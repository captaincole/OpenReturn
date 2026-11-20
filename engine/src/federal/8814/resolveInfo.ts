import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8814FilingInfo } from "./filingInfo.js";

/*
 * irs-8814-inst-2025::sec::general-instructions::b01: parents choose to report a child's interest and dividends on their own return.
 * The engine has no fact for a child's income, so no fact turns the form on: only the decision does.
 */
export function resolve8814Info(inputs: ResolverInputs): Form8814FilingInfo {
  return {
    mustFile: {
      "form-8814": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8814",
        fallbacks: [
          { rule: "fallback: no fact for a child's interest and dividends", value: false },
        ],
      }),
    },
  };
}
