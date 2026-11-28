import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3531FilingInfo } from "./filingInfo.js";

/*
 * Who files: "Use form FTB 3531, California Competes Tax Credit, to report the credit amount
 * for the current year, the amount to carryover to future years, and any amount recaptured",
 * and to claim pass-through credits (ca-3531-inst-2025::sec::a-purpose).
 * The instructions are not in the corpus yet, so no block id is cited.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3531Info(inputs: ResolverInputs): Form3531FilingInfo {
  return {
    mustFile: {
      "form-3531": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3531",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
