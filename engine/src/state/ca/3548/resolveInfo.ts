import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3548FilingInfo } from "./filingInfo.js";

/*
 * Who files: "Eligible small businesses use form FTB 3548, Disabled Access Credit for Eligible
 * Small Businesses, to figure a credit for expenditures to provide access to disabled
 * individuals" (ca-3548-form-2025, "A Purpose").
 * The instructions are not in the corpus yet, so no block id is cited.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3548Info(inputs: ResolverInputs): Form3548FilingInfo {
  return {
    mustFile: {
      "form-3548": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3548",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
