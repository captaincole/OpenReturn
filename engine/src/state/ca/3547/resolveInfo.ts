import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3547FilingInfo } from "./filingInfo.js";

/*
 * Who files: "Use form FTB 3547, Donated Agricultural Products Transportation Credit, to figure
 * the amount of credit allowed for the transportation of agricultural products donated to
 * nonprofit charitable organizations" (ca-3547-form-2025, "A Purpose").
 * The instructions are not in the corpus yet, so no block id is cited.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3547Info(inputs: ResolverInputs): Form3547FilingInfo {
  return {
    mustFile: {
      "form-3547": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3547",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
