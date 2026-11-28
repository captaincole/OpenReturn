import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3808FilingInfo } from "./filingInfo.js";

/*
 * Who files: "Taxpayers operating or investing within a former MEA may claim a hiring credit
 * carryover" (ca-3808-booklet-2025::sec::purpose).
 * The instructions are not in the corpus yet, so no block id is cited.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3808Info(inputs: ResolverInputs): Form3808FilingInfo {
  return {
    mustFile: {
      "form-3808": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3808",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
