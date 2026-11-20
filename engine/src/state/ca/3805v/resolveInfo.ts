import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3805VFilingInfo } from "./filingInfo.js";

/*
 * ca-3805v-inst-2025::sec::a-purpose::b01: a taxpayer with a California net operating loss or a carryover of one.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3805VInfo(inputs: ResolverInputs): Form3805VFilingInfo {
  return {
    mustFile: {
      "form-3805v": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3805v",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
