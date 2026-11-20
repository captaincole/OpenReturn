import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8615FilingInfo } from "./filingInfo.js";

/*
 * irs-8615-inst-2025::sec::who-must-file::b01: a child with unearned income above the yearly limit who must file a return.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8615Info(inputs: ResolverInputs): Form8615FilingInfo {
  return {
    mustFile: {
      "form-8615": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8615",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
