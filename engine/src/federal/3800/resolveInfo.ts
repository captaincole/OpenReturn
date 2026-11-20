import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form3800FilingInfo } from "./filingInfo.js";

/*
 * irs-3800-inst-2025::sec::who-must-file::b01: a taxpayer who claims a general business credit, or carries one back or forward.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3800Info(inputs: ResolverInputs): Form3800FilingInfo {
  return {
    mustFile: {
      "form-3800": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3800",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
