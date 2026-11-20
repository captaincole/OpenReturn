import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8396FilingInfo } from "./filingInfo.js";

/*
 * irs-8396-form-2025::sec::who-can-claim-the-credit::b01: a holder of a mortgage credit certificate from a state or local government.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8396Info(inputs: ResolverInputs): Form8396FilingInfo {
  return {
    mustFile: {
      "form-8396": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8396",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
