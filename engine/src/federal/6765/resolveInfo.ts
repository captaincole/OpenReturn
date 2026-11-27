import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form6765FilingInfo } from "./filingInfo.js";

/*
 * Who files: a taxpayer who claims the credit for increasing research activities, or a qualified small business that elects to take part of it as a payroll tax credit.
 * The instructions are a separate document (Instructions for Form 6765, Rev. December 2025), which is not in the corpus yet.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve6765Info(inputs: ResolverInputs): Form6765FilingInfo {
  return {
    mustFile: {
      "form-6765": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_6765",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
