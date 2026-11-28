import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8896FilingInfo } from "./filingInfo.js";

/*
 * Who files: a qualified small business refiner who claims the low sulfur diesel fuel production credit (section 45H); a taxpayer whose only source is a partnership, S corporation or cooperative is not required to file it.
 * The form holds its own instructions (Rev. December 2019), which are not in the corpus yet.
 * The form has no rules yet, and the engine has no fact for low sulfur diesel fuel production, so no fact turns it on: only the decision does.
 */
export function resolve8896Info(inputs: ResolverInputs): Form8896FilingInfo {
  return {
    mustFile: {
      "form-8896": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8896",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
