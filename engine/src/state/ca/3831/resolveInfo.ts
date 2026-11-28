import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3831FilingInfo } from "./filingInfo.js";

/*
 * Who files: "Use form FTB 3831, Homeless Hiring Tax Credit, to figure a credit for a qualified
 * taxpayer that hires an eligible individual and receives a tentative credit reservation for
 * that eligible individual" (ca-3831-form-2025, "A Purpose").
 * The instructions are not in the corpus yet, so no block id is cited.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3831Info(inputs: ResolverInputs): Form3831FilingInfo {
  return {
    mustFile: {
      "form-3831": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3831",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
