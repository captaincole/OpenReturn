import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3592FilingInfo } from "./filingInfo.js";

/*
 * Who files: "Use form FTB 3592, College Access Tax Credit, to report the credit amount earned
 * and claimed for the current year and the amount to carryover to future years", and to claim
 * pass-through credits (ca-3592-form-2025, "A Purpose").
 * The instructions are not in the corpus yet, so no block id is cited.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3592Info(inputs: ResolverInputs): Form3592FilingInfo {
  return {
    mustFile: {
      "form-3592": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3592",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
