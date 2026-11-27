import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form6478FilingInfo } from "./filingInfo.js";

/*
 * Who files: a producer of second generation biofuel who claims the section 40 biofuel producer credit; a partner, shareholder or beneficiary whose only source is a pass-through entity reports it on Form 3800 instead.
 * The instructions are a separate document (Instructions for Form 6478, Rev. October 2023), which is not in the corpus yet. They allow the credit only for fuel sold or used before 2025.
 * The form has no rules yet, and the engine has no fact for biofuel production, so no fact turns it on: only the decision does.
 */
export function resolve6478Info(inputs: ResolverInputs): Form6478FilingInfo {
  return {
    mustFile: {
      "form-6478": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_6478",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
