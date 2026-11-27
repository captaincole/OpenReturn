import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8609AFilingInfo } from "./filingInfo.js";

/*
 * Who files: an owner of a building with a low-income housing credit allocation files one for each building, every year of the compliance period, with Form 8586.
 * The instructions are a separate document (Instructions for Form 8609-A, Rev. December 2025), which is not in the corpus yet.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8609AInfo(inputs: ResolverInputs): Form8609AFilingInfo {
  return {
    mustFile: {
      "form-8609-a": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8609_a",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
