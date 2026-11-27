import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8862FilingInfo } from "./filingInfo.js";

/*
 * Who files: a taxpayer whose EIC (after 1996) or CTC, ACTC, ODC or AOTC (after 2015) was reduced or disallowed for a reason other than a math or clerical error, and who now meets the requirements and claims that credit (irs-8862-inst-2025::sec::general-instructions::b01).
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8862Info(inputs: ResolverInputs): Form8862FilingInfo {
  return {
    mustFile: {
      "form-8862": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8862",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
