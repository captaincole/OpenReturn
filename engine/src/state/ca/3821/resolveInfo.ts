import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3821FilingInfo } from "./filingInfo.js";

/*
 * Who files: "Use form FTB 3821, Cannabis Equity Tax Credit, to calculate and report allowable
 * credit for a qualified taxpayer", and to claim the pass-through credit
 * (ca-3821-inst-2025::sec::a-purpose).
 * The instructions are not in the corpus yet, so no block id is cited.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3821Info(inputs: ResolverInputs): Form3821FilingInfo {
  return {
    mustFile: {
      "form-3821": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3821",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
