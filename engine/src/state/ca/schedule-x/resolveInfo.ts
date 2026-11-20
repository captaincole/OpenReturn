import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { ScheduleXFilingInfo } from "./filingInfo.js";

/*
 * ca-540-sched-x-inst-2025::sec::purpose::b01: the reasons for an amended California return.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolveScheduleXInfo(inputs: ResolverInputs): ScheduleXFilingInfo {
  return {
    mustFile: {
      "schedule-x": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_schedule_x",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
