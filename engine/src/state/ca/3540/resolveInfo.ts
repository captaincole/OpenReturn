import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3540FilingInfo } from "./filingInfo.js";

/*
 * Who files: "Use form FTB 3540, Credit Carryover and Recapture Summary, Part I, Credit
 * Carryover, to figure a prior year credit carryover of one or more repealed credits that no
 * longer have separate credit forms" (ca-3540-inst-2025, "Purpose").
 * The instructions are not in the corpus yet, so no block id is cited.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3540Info(inputs: ResolverInputs): Form3540FilingInfo {
  return {
    mustFile: {
      "form-3540": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3540",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
