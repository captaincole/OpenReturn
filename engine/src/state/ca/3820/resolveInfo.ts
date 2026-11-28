import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3820FilingInfo } from "./filingInfo.js";

/*
 * Who files: "Qualified taxpayers that obtain a TCR use form FTB 3820, High-Road Cannabis Tax
 * Credit, to calculate and report HRCTC", and owners of a pass-through entity use it to claim
 * the credit passed through (ca-3820-inst-2025::sec::a-purpose).
 * The instructions are not in the corpus yet, so no block id is cited.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3820Info(inputs: ResolverInputs): Form3820FilingInfo {
  return {
    mustFile: {
      "form-3820": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3820",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
