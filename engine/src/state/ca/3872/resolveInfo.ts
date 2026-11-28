import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3872FilingInfo } from "./filingInfo.js";

/*
 * Who files: "Use form FTB 3872 to request an additional relief period for postponement of
 * certain tax related deadlines from the FTB" (ca-3872-inst-2025::sec::a-purpose).
 * The instructions are not in the corpus yet, so no block id is cited.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3872Info(inputs: ResolverInputs): Form3872FilingInfo {
  return {
    mustFile: {
      "form-3872": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3872",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
