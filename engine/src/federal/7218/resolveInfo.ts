import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form7218FilingInfo } from "./filingInfo.js";

/*
 * Who files: a registered producer who claims the section 45Z credit for clean transportation fuel produced at a qualified facility and sold after 2024, one form for each facility.
 * The instructions are a separate document (Instructions for Form 7218, Rev. December 2025), which is not in the corpus yet.
 * The form has no rules yet, and the engine has no fact for fuel production, so no fact turns it on: only the decision does.
 */
export function resolve7218Info(inputs: ResolverInputs): Form7218FilingInfo {
  return {
    mustFile: {
      "form-7218": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_7218",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
