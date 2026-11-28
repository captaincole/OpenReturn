import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3521FilingInfo } from "./filingInfo.js";

/*
 * Who files: "Use form FTB 3521, Low-Income Housing Credit, if you are an owner of a
 * residential rental project providing low-income housing in California", or to claim the
 * credit passed through to you (ca-3521-inst-2025::sec::a-purpose).
 * The instructions are not in the corpus yet, so no block id is cited.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3521Info(inputs: ResolverInputs): Form3521FilingInfo {
  return {
    mustFile: {
      "form-3521": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3521",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
