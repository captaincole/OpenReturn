import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8874FilingInfo } from "./filingInfo.js";

/*
 * Who files: a taxpayer who claims the new markets credit (section 45D) for a qualified equity investment in a qualified community development entity; a taxpayer that is not a partnership or S corporation and whose only source is a pass-through entity reports the credit on Form 3800 instead.
 * The form holds its own instructions (Rev. November 2021), which are not in the corpus yet.
 * The form has no rules yet, and the engine has no fact for a qualified equity investment, so no fact turns it on: only the decision does.
 */
export function resolve8874Info(inputs: ResolverInputs): Form8874FilingInfo {
  return {
    mustFile: {
      "form-8874": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8874",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
