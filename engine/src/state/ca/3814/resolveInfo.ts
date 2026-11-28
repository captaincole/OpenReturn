import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3814FilingInfo } from "./filingInfo.js";

/*
 * Who files: "Use form FTB 3814, New Donated Fresh Fruits or Vegetables Credit, to figure and
 * claim the amount of tax credit allowed for the donation of fresh fruits, vegetables, or other
 * qualified donation items made by a qualified taxpayer to a food bank located in California"
 * (ca-3814-inst-2025, "Purpose").
 * The instructions are not in the corpus yet, so no block id is cited.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3814Info(inputs: ResolverInputs): Form3814FilingInfo {
  return {
    mustFile: {
      "form-3814": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3814",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
