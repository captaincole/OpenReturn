import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form7207FilingInfo } from "./filingInfo.js";

/*
 * Who files: a taxpayer who produces eligible components in the United States and sells them to unrelated persons, one form for each facility (section 45X); a partner, shareholder or beneficiary whose only source is a pass-through entity reports the credit on Form 3800 instead.
 * The instructions are a separate document (Instructions for Form 7207, Rev. December 2025), which is not in the corpus yet.
 * The form has no rules yet, and the engine has no fact for a manufacturing facility, so no fact turns it on: only the decision does.
 */
export function resolve7207Info(inputs: ResolverInputs): Form7207FilingInfo {
  return {
    mustFile: {
      "form-7207": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_7207",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
