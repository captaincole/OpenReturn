import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form2555FilingInfo } from "./filingInfo.js";

/*
 * irs-2555-inst-2025::sec::purpose-of-form::b01: a taxpayer who claims the foreign earned income exclusion or the housing exclusion or deduction.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve2555Info(inputs: ResolverInputs): Form2555FilingInfo {
  return {
    mustFile: {
      "form-2555": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_2555",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
