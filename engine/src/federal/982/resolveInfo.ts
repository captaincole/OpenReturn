import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form982FilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: a taxpayer who excludes a canceled debt from income, or a corporation that makes a section 1082 basis adjustment.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve982Info(inputs: ResolverInputs): Form982FilingInfo {
  return {
    mustFile: {
      "form-982": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_982",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
