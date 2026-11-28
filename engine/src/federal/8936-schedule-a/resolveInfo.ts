import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8936ScheduleAFilingInfo } from "./filingInfo.js";

/*
 * Who files: a taxpayer who files Form 8936, with a separate Schedule A for each clean vehicle placed in service during the tax year.
 * The instructions are in the 2025 Instructions for Form 8936 and Schedule A (Form 8936), whose sidecar is irs-8936-inst-2025.
 * The form has no rules yet, and the schedule has no rules of its own, and Form 8936's resolver does not turn it on, so no fact turns it on: only the decision does.
 */
export function resolve8936ScheduleAInfo(inputs: ResolverInputs): Form8936ScheduleAFilingInfo {
  return {
    mustFile: {
      "form-8936-schedule-a": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8936_schedule_a",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
