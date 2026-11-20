import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8863FilingInfo } from "./filingInfo.js";

/*
 * irs-8863-inst-2025::sec::who-can-claim-an-education-credit::b01: a taxpayer who claims an education credit.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8863Info(inputs: ResolverInputs): Form8863FilingInfo {
  return {
    mustFile: {
      "form-8863": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8863",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
