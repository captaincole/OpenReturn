import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8941FilingInfo } from "./filingInfo.js";

/*
 * Who files: an eligible small employer who claims the credit for small employer health insurance premiums (section 45R), for a 2-consecutive-tax-year credit period.
 * The instructions are a separate document (2025 Instructions for Form 8941, "Purpose of Form"), which is not in the corpus yet.
 * The form has no rules yet, and the engine has no fact for employer health insurance premiums, so no fact turns it on: only the decision does.
 */
export function resolve8941Info(inputs: ResolverInputs): Form8941FilingInfo {
  return {
    mustFile: {
      "form-8941": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8941",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
