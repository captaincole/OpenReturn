import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8933ScheduleEFilingInfo } from "./filingInfo.js";

/*
 * Who files: the owner of a capture facility that supplied qualified carbon oxide to another person and elects under section 45Q(f)(3)(B) to allow the credit to that person, one election for each facility.
 * The instructions are in the Instructions for Form 8933 (Rev. December 2025, "Schedule E, Election Certification"), whose sidecar is irs-8933-inst-2025.
 * The form has no rules yet, and the engine has no fact for a carbon capture facility, so no fact turns it on: only the decision does.
 */
export function resolve8933ScheduleEInfo(inputs: ResolverInputs): Form8933ScheduleEFilingInfo {
  return {
    mustFile: {
      "form-8933-schedule-e": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8933_schedule_e",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
