import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form540TwoEZFilingInfo } from "./filingInfo.js";

/*
 * Who files: A full-year resident whose income, filing status and deductions fit the booklet's
 * table may file Form 540 2EZ instead of Form 540
 * (ca-540-2ez-booklet-2025::sec::qualifying-to-use-form-540-2ez). The engine files Form 540;
 * Form 540 2EZ files only on its decision.
 * The instructions are not in the corpus yet, so no block id is cited.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve540TwoEZInfo(inputs: ResolverInputs): Form540TwoEZFilingInfo {
  return {
    mustFile: {
      "form-540-2ez": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_540_2ez",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
