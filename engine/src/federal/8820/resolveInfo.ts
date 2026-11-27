import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8820FilingInfo } from "./filingInfo.js";

/*
 * Who files: a taxpayer who claims the orphan drug credit, 25% of qualified clinical testing expenses (section 45C), or elects the reduced credit; a taxpayer whose only source is a partnership or S corporation reports it on Form 3800 instead.
 * The form holds its own instructions (Rev. September 2018), which are not in the corpus yet.
 * The form has no rules yet, and the engine has no fact for clinical testing expenses, so no fact turns it on: only the decision does.
 */
export function resolve8820Info(inputs: ResolverInputs): Form8820FilingInfo {
  return {
    mustFile: {
      "form-8820": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8820",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
