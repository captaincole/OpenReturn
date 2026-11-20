import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8912FilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: a holder of tax credit bonds.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8912Info(inputs: ResolverInputs): Form8912FilingInfo {
  return {
    mustFile: {
      "form-8912": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8912",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
