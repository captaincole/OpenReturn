import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form4972FilingInfo } from "./filingInfo.js";

/*
 * irs-4972-form-2025::sec::general-instructions::b01: a lump-sum distribution for a plan participant born before January 2, 1936.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve4972Info(inputs: ResolverInputs): Form4972FilingInfo {
  return {
    mustFile: {
      "form-4972": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_4972",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
