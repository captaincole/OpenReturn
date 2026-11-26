import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8379FilingInfo } from "./filingInfo.js";

/*
 * Who files: a spouse on a joint return whose share of the refund was, or will be, applied to the other spouse's past-due debt (irs-8379-inst-2025::sec::are-you-an-injured-spouse::b01).
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8379Info(inputs: ResolverInputs): Form8379FilingInfo {
  return {
    mustFile: {
      "form-8379": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8379",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
