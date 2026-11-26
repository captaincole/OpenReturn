import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8958FilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: a married person in a community property state who files a separate return, or a registered domestic partner in Nevada, Washington or California, to show how income, deductions and withholding are split.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8958Info(inputs: ResolverInputs): Form8958FilingInfo {
  return {
    mustFile: {
      "form-8958": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8958",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
