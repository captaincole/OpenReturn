import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8835FilingInfo } from "./filingInfo.js";

/*
 * Who files: a taxpayer who claims the section 45 credit for electricity produced from renewable resources at a qualified facility used in a trade or business, one form for each facility; a taxpayer whose only source is a pass-through entity reports the credit on Form 3800 instead.
 * The instructions are a separate document (2025 Instructions for Form 8835), which is not in the corpus yet.
 * The form has no rules yet, and the engine has no fact for an electricity facility, so no fact turns it on: only the decision does.
 */
export function resolve8835Info(inputs: ResolverInputs): Form8835FilingInfo {
  return {
    mustFile: {
      "form-8835": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8835",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
