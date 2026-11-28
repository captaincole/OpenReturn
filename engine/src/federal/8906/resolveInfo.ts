import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8906FilingInfo } from "./filingInfo.js";

/*
 * Who files: a taxpayer who claims the distilled spirits credit (section 5011); partnerships and S corporations must file it, and a taxpayer whose only source is a partnership or S corporation can report the credit on Form 3800 instead.
 * The form holds its own instructions (2025), which are not in the corpus yet.
 * The form has no rules yet, and the engine has no fact for cases of distilled spirits, so no fact turns it on: only the decision does.
 */
export function resolve8906Info(inputs: ResolverInputs): Form8906FilingInfo {
  return {
    mustFile: {
      "form-8906": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8906",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
