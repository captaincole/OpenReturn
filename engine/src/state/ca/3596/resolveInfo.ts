import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3596FilingInfo } from "./filingInfo.js";

/*
 * Who files: "Paid preparers of California income tax returns or claims for refund involving
 * the California Earned Income Tax Credit (EITC) must meet due diligence requirements"
 * (ca-3596-inst-2025::sec::purpose). The paid preparer completes it, not the taxpayer.
 * The instructions are not in the corpus yet, so no block id is cited.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3596Info(inputs: ResolverInputs): Form3596FilingInfo {
  return {
    mustFile: {
      "form-3596": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3596",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
