import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3503FilingInfo } from "./filingInfo.js";

/*
 * Who files: "Use form FTB 3503, Natural Heritage Preservation Credit, to figure the amount of
 * the credit. Also, use this form to claim pass-through credits" (ca-3503-form-2025, "A
 * Purpose").
 * The instructions are not in the corpus yet, so no block id is cited.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3503Info(inputs: ResolverInputs): Form3503FilingInfo {
  return {
    mustFile: {
      "form-3503": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3503",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
