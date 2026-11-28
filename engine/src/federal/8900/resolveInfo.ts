import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8900FilingInfo } from "./filingInfo.js";

/*
 * Who files: an eligible taxpayer who claims the railroad track maintenance credit (section 45G), and an assignor of miles of eligible railroad track; a taxpayer whose only source is a partnership or S corporation is not required to file it.
 * The instructions are a separate document (Instructions for Form 8900, Rev. December 2023, "Who Must File"), which is not in the corpus yet.
 * The form has no rules yet, and the engine has no fact for railroad track maintenance expenditures, so no fact turns it on: only the decision does.
 */
export function resolve8900Info(inputs: ResolverInputs): Form8900FilingInfo {
  return {
    mustFile: {
      "form-8900": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8900",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
