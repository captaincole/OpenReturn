import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8994FilingInfo } from "./filingInfo.js";

/*
 * Who files: an eligible employer who claims the employer credit for paid family and medical leave (section 45S), on wages paid to a qualifying employee on family and medical leave.
 * The instructions are a separate document (Instructions for Form 8994, Rev. December 2024, "Purpose of Form"), which is not in the corpus yet.
 * The form has no rules yet, and the engine has no fact for paid family and medical leave, so no fact turns it on: only the decision does.
 */
export function resolve8994Info(inputs: ResolverInputs): Form8994FilingInfo {
  return {
    mustFile: {
      "form-8994": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8994",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
