import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8933ScheduleDFilingInfo } from "./filingInfo.js";

/*
 * Who files: the operator or owner of the geological disposal site or enhanced oil recovery project who reports a recapture event of the carbon oxide sequestration credit.
 * The instructions are in the Instructions for Form 8933 (Rev. December 2025, "Schedule D. Recapture Certification"), whose sidecar is irs-8933-inst-2025.
 * The form has no rules yet, and the engine has no fact for a recapture event, so no fact turns it on: only the decision does.
 */
export function resolve8933ScheduleDInfo(inputs: ResolverInputs): Form8933ScheduleDFilingInfo {
  return {
    mustFile: {
      "form-8933-schedule-d": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8933_schedule_d",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
