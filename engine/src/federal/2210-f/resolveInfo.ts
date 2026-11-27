import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form2210FFilingInfo } from "./filingInfo.js";

/*
 * Who files: a farmer or fisher with an underpayment of estimated tax who checks box A (a waiver request) or box B (a joint return for 2024 or 2025 but not both, and line 10 smaller than line 7). The form says: "File Form 2210-F only if one or both of the boxes in Part I apply to you."
 * The Instructions for Form 2210-F are not in the corpus yet.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve2210FInfo(inputs: ResolverInputs): Form2210FFilingInfo {
  return {
    mustFile: {
      "form-2210-f": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_2210_f",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
