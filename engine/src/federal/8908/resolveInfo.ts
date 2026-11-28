import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8908FilingInfo } from "./filingInfo.js";

/*
 * Who files: an eligible contractor who claims the energy efficient home credit (section 45L) for a qualified new energy efficient home acquired by another person during the tax year for use as a residence.
 * The instructions are a separate document (Instructions for Form 8908, Rev. December 2025, "Purpose of Form"), which is not in the corpus yet.
 * The form has no rules yet, and the engine has no fact for a home sold as a contractor, so no fact turns it on: only the decision does.
 */
export function resolve8908Info(inputs: ResolverInputs): Form8908FilingInfo {
  return {
    mustFile: {
      "form-8908": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8908",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
