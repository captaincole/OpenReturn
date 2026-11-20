import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3853FilingInfo } from "./filingInfo.js";

/*
 * ca-3853-inst-2025::sec::who-must-file::b01: a household member had no health coverage for a month, or claims a coverage exemption.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3853Info(inputs: ResolverInputs): Form3853FilingInfo {
  return {
    mustFile: {
      "form-3853": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3853",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
