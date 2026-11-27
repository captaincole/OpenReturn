import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8933ScheduleAFilingInfo } from "./filingInfo.js";

/*
 * Who files: an owner (or one of the owners) of the geological disposal site or the enhanced oil recovery project at which captured qualified carbon oxide was injected during the year.
 * The instructions are in the Instructions for Form 8933 (Rev. December 2025, "Schedule A. Disposal or Enhanced Oil Recovery Owner Certification"), whose sidecar is irs-8933-inst-2025.
 * The form has no rules yet, and the engine has no fact for a disposal site or an enhanced oil recovery project, so no fact turns it on: only the decision does.
 */
export function resolve8933ScheduleAInfo(inputs: ResolverInputs): Form8933ScheduleAFilingInfo {
  return {
    mustFile: {
      "form-8933-schedule-a": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8933_schedule_a",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
