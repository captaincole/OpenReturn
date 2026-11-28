import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3870FilingInfo } from "./filingInfo.js";

/*
 * Who files: "Use this form to make an irrevocable election to receive an annual refundable
 * credit for business credits disallowed due to the current $5,000,000 credit limitation"
 * (ca-3870-inst-2025::sec::a-purpose).
 * The instructions are not in the corpus yet, so no block id is cited.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3870Info(inputs: ResolverInputs): Form3870FilingInfo {
  return {
    mustFile: {
      "form-3870": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3870",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
