import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form7211FilingInfo } from "./filingInfo.js";

/*
 * Who files: a taxpayer who owns and operates a qualified facility and claims the section 45Y clean electricity production credit, one form for each facility; a taxpayer whose only source is a pass-through entity reports the credit on Form 3800 instead.
 * The instructions are a separate document (Instructions for Form 7211, Rev. December 2025), which is not in the corpus yet.
 * The form has no rules yet, and the engine has no fact for an electricity facility, so no fact turns it on: only the decision does.
 */
export function resolve7211Info(inputs: ResolverInputs): Form7211FilingInfo {
  return {
    mustFile: {
      "form-7211": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_7211",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
