import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form4136FilingInfo } from "./filingInfo.js";

/*
 * irs-4136-inst-2025::sec::general-instructions::b01: a taxpayer who claims a credit for federal tax paid on fuels.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve4136Info(inputs: ResolverInputs): Form4136FilingInfo {
  return {
    mustFile: {
      "form-4136": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_4136",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
