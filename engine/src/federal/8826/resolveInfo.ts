import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8826FilingInfo } from "./filingInfo.js";

/*
 * Who files: an eligible small business that claims the disabled access credit for expenditures that make the business accessible to persons with disabilities.
 * The form holds its own instructions, which are not in the corpus yet.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8826Info(inputs: ResolverInputs): Form8826FilingInfo {
  return {
    mustFile: {
      "form-8826": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8826",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
