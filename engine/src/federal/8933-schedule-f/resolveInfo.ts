import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8933ScheduleFFilingInfo } from "./filingInfo.js";

/*
 * Who files: the owner of a utilization facility that utilized qualified carbon oxide during the year, one schedule for each facility; the owner gives a copy to each supplier.
 * The instructions are in the Instructions for Form 8933 (Rev. December 2025, "Schedule F. Utilization Certification"), whose sidecar is irs-8933-inst-2025.
 * The form has no rules yet, and the engine has no fact for a utilization facility, so no fact turns it on: only the decision does.
 */
export function resolve8933ScheduleFInfo(inputs: ResolverInputs): Form8933ScheduleFFilingInfo {
  return {
    mustFile: {
      "form-8933-schedule-f": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8933_schedule_f",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
