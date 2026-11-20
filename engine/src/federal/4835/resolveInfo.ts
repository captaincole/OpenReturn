import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form4835FilingInfo } from "./filingInfo.js";

/*
 * irs-4835-inst-2025::sec::purpose-of-form::b01: a landowner with farm rental income based on crops or livestock who did not materially participate.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve4835Info(inputs: ResolverInputs): Form4835FilingInfo {
  return {
    mustFile: {
      "form-4835": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_4835",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
