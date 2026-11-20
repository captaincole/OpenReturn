import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8919FilingInfo } from "./filingInfo.js";

/*
 * irs-8919-form-2025::sec::general-instructions::b01: an employee whose firm treated them as an independent contractor and withheld no social security or Medicare tax.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8919Info(inputs: ResolverInputs): Form8919FilingInfo {
  return {
    mustFile: {
      "form-8919": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8919",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
