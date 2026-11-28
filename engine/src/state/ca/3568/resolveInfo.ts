import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3568FilingInfo } from "./filingInfo.js";

/*
 * Who files: "Use form FTB 3568 to provide alternative identifying information to meet the
 * identification number requirement for claiming the California dependent exemption credit" for
 * a dependent who is ineligible for an SSN and for a federal ITIN (ca-3568-inst-2025,
 * "Purpose").
 * The instructions are not in the corpus yet, so no block id is cited.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3568Info(inputs: ResolverInputs): Form3568FilingInfo {
  return {
    mustFile: {
      "form-3568": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3568",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
