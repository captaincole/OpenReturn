import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form2210FilingInfo } from "./filingInfo.js";

/*
 * irs-2210-inst-2025::sec::who-must-file-form-2210::b01: file when box B, C or D in Part II applies; otherwise the IRS figures the penalty.
 * The engine has no fact for last year's tax or the dates of the payments, so no fact turns the form on: only the decision does.
 */
export function resolve2210Info(inputs: ResolverInputs): Form2210FilingInfo {
  return {
    mustFile: {
      "form-2210": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_2210",
        fallbacks: [
          { rule: "fallback: no fact for last year's tax or the Part II boxes", value: false },
        ],
      }),
    },
  };
}
