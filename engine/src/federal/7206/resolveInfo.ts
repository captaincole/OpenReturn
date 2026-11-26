import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form7206FilingInfo } from "./filingInfo.js";

/*
 * Who files: a self-employed person, partner or more-than-2% S corporation shareholder who deducts health insurance on Schedule 1, line 17 (irs-7206-inst-2025::sec::general-instructions::b01).
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve7206Info(inputs: ResolverInputs): Form7206FilingInfo {
  return {
    mustFile: {
      "form-7206": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_7206",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
