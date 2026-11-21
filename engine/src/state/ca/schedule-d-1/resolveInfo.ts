import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { ScheduleD1FilingInfo } from "./filingInfo.js";

/*
 * Who files: a sale of business property, when the California amount differs from the federal amount.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolveScheduleD1Info(inputs: ResolverInputs): ScheduleD1FilingInfo {
  return {
    mustFile: {
      "schedule-d-1": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_schedule_d_1",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
