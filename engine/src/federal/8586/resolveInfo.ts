import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8586FilingInfo } from "./filingInfo.js";

/*
 * Who files: an owner of a qualified low-income building who claims the low-income housing credit, with a Form 8609-A for each building.
 * The form holds its own instructions, which are not in the corpus yet.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8586Info(inputs: ResolverInputs): Form8586FilingInfo {
  return {
    mustFile: {
      "form-8586": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8586",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
