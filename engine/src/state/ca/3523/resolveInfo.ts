import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3523FilingInfo } from "./filingInfo.js";

/*
 * Who files: "Use form FTB 3523 to compute and claim the research credit for increasing the
 * research activities of a trade or business", and to claim pass-through research credits
 * (ca-3523-inst-2025::sec::a-purpose).
 * The instructions are not in the corpus yet, so no block id is cited.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3523Info(inputs: ResolverInputs): Form3523FilingInfo {
  return {
    mustFile: {
      "form-3523": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3523",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
