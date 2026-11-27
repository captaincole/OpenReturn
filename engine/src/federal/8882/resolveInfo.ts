import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8882FilingInfo } from "./filingInfo.js";

/*
 * Who files: an employer who claims the credit for qualified childcare facility and resource and referral expenditures.
 * The form holds its own instructions, which are not in the corpus yet.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8882Info(inputs: ResolverInputs): Form8882FilingInfo {
  return {
    mustFile: {
      "form-8882": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8882",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
