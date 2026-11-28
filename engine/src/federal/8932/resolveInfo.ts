import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8932FilingInfo } from "./filingInfo.js";

/*
 * Who files: an employer who claims the credit for differential wage payments (section 45P) made to qualified employees; a taxpayer whose only source is a partnership, S corporation, cooperative, estate or trust is not required to file it.
 * The form holds its own instructions (Rev. December 2021), which are not in the corpus yet.
 * The form has no rules yet, and the engine has no fact for differential wage payments, so no fact turns it on: only the decision does.
 */
export function resolve8932Info(inputs: ResolverInputs): Form8932FilingInfo {
  return {
    mustFile: {
      "form-8932": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8932",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
