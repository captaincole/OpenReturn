import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form7213FilingInfo } from "./filingInfo.js";

/*
 * Who files: a taxpayer who claims the advanced nuclear power production credit (section 45J) or the zero-emission nuclear power production credit (section 45U), one form for each facility; a taxpayer whose only source is a Schedule K-1 reports the credit on Form 3800 instead.
 * The instructions are a separate document (Instructions for Form 7213, Rev. December 2025, "Who Must File"), which is not in the corpus yet.
 * The form has no rules yet, and the engine has no fact for a nuclear power facility, so no fact turns it on: only the decision does.
 */
export function resolve7213Info(inputs: ResolverInputs): Form7213FilingInfo {
  return {
    mustFile: {
      "form-7213": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_7213",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
