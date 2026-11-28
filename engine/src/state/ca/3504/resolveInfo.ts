import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3504FilingInfo } from "./filingInfo.js";

/*
 * Who files: "Use form FTB 3504, Enrolled Tribal Member Certification, to declare you reside
 * within California Indian country and you meet the tribal income exemption requirements. This
 * form is optional" (ca-3504-inst-2025::sec::a-purpose).
 * The instructions are not in the corpus yet, so no block id is cited.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3504Info(inputs: ResolverInputs): Form3504FilingInfo {
  return {
    mustFile: {
      "form-3504": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3504",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
