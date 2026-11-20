import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8888FilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: a taxpayer who wants the refund deposited to two or three accounts.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8888Info(inputs: ResolverInputs): Form8888FilingInfo {
  return {
    mustFile: {
      "form-8888": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8888",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
