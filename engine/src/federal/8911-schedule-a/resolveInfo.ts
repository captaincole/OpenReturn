import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8911ScheduleAFilingInfo } from "./filingInfo.js";

/*
 * Who files: a taxpayer who files Form 8911, with a separate Schedule A for each item of qualified alternative fuel vehicle refueling property placed in service during the tax year.
 * The instructions are in the Instructions for Form 8911 (Rev. December 2025), whose sidecar is irs-8911-inst-2025.
 * The form has no rules yet, and the schedule has no rules of its own, and Form 8911's resolver does not turn it on, so no fact turns it on: only the decision does.
 */
export function resolve8911ScheduleAInfo(inputs: ResolverInputs): Form8911ScheduleAFilingInfo {
  return {
    mustFile: {
      "form-8911-schedule-a": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8911_schedule_a",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
