import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8915FFilingInfo } from "./filingInfo.js";

/*
 * irs-8915f-inst-2025::sec::who-must-file::b01: a qualified disaster distribution from a retirement plan, or its repayment.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8915FInfo(inputs: ResolverInputs): Form8915FFilingInfo {
  return {
    mustFile: {
      "form-8915-f": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8915_f",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
