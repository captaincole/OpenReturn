import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3554FilingInfo } from "./filingInfo.js";

/*
 * Who files: "Use form FTB 3554, New Employment Credit, to figure a credit for a qualified
 * taxpayer that hires a qualified full-time employee, pays or incurs qualified wages
 * attributable to work performed by that employee, and receives a TCR for that employee"
 * (ca-3554-booklet-2025::sec::purpose).
 * The instructions are not in the corpus yet, so no block id is cited.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3554Info(inputs: ResolverInputs): Form3554FilingInfo {
  return {
    mustFile: {
      "form-3554": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3554",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
