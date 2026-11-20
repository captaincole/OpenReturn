import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3913FilingInfo } from "./filingInfo.js";

/*
 * ca-3913-inst-2025::sec::a-purpose::b01: a taxpayer who moved for work and deducts moving expenses on the California return.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3913Info(inputs: ResolverInputs): Form3913FilingInfo {
  return {
    mustFile: {
      "form-3913": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3913",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
