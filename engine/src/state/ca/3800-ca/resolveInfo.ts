import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3800CaFilingInfo } from "./filingInfo.js";

/*
 * ca-3800-inst-2025::sec::purpose::b01: a child with investment income above the yearly limit who must file a California return.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3800CaInfo(inputs: ResolverInputs): Form3800CaFilingInfo {
  return {
    mustFile: {
      "form-3800-ca": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3800_ca",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
