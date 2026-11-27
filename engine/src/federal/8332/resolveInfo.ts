import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8332FilingInfo } from "./filingInfo.js";

/*
 * Who files: the noncustodial parent who claims a child's dependency benefits attaches this form, signed by the custodial parent; the custodial parent uses Part III to revoke a release.
 * The form holds its own instructions, which are not in the corpus yet.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8332Info(inputs: ResolverInputs): Form8332FilingInfo {
  return {
    mustFile: {
      "form-8332": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8332",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
