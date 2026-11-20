import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form4563FilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: a bona fide resident of American Samoa who excludes income from there.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve4563Info(inputs: ResolverInputs): Form4563FilingInfo {
  return {
    mustFile: {
      "form-4563": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_4563",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
