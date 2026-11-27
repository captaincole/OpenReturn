import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form7210FilingInfo } from "./filingInfo.js";

/*
 * Who files: a taxpayer who claims the section 45V credit for clean hydrogen produced at a qualified facility, one form for each facility; a taxpayer whose only source is a partnership or S corporation reports the credit on Form 3800 instead.
 * The instructions are a separate document (2025 Instructions for Form 7210), which is not in the corpus yet.
 * The form has no rules yet, and the engine has no fact for a hydrogen production facility, so no fact turns it on: only the decision does.
 */
export function resolve7210Info(inputs: ResolverInputs): Form7210FilingInfo {
  return {
    mustFile: {
      "form-7210": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_7210",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
