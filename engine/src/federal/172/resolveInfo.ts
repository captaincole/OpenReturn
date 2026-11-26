import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form172FilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: an individual, estate or trust with a net operating loss for the year, to figure the loss and its carryover.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve172Info(inputs: ResolverInputs): Form172FilingInfo {
  return {
    mustFile: {
      "form-172": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_172",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
