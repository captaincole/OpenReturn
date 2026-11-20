import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8992FilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: a U.S. shareholder of a controlled foreign corporation with global intangible low-taxed income.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8992Info(inputs: ResolverInputs): Form8992FilingInfo {
  return {
    mustFile: {
      "form-8992": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8992",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
