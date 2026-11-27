import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8864FilingInfo } from "./filingInfo.js";

/*
 * Who files: an eligible small agri-biodiesel producer who claims the section 40A credit; a taxpayer whose only source is a pass-through entity reports the credit on Form 3800 instead.
 * The instructions are a separate document (Instructions for Form 8864, Rev. December 2025), which is not in the corpus yet.
 * The form has no rules yet, and the engine has no fact for biodiesel production, so no fact turns it on: only the decision does.
 */
export function resolve8864Info(inputs: ResolverInputs): Form8864FilingInfo {
  return {
    mustFile: {
      "form-8864": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8864",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
