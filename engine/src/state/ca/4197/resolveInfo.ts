import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form4197FilingInfo } from "./filingInfo.js";

/*
 * Who files: "Use form FTB 4197 to report the total amount of deductions, credits, exclusions,
 * exemptions and other information related to certain trade or business activity for the
 * taxable year, as applicable" (ca-4197-inst-2025, "Purpose").
 * The instructions are not in the corpus yet, so no block id is cited.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve4197Info(inputs: ResolverInputs): Form4197FilingInfo {
  return {
    mustFile: {
      "form-4197": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_4197",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
