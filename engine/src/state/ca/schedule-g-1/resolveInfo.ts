import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { ScheduleG1FilingInfo } from "./filingInfo.js";

/*
 * The instructions for this form are not in Canon yet. Who files: a lump-sum distribution for a plan participant born before January 2, 1936.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolveScheduleG1Info(inputs: ResolverInputs): ScheduleG1FilingInfo {
  return {
    mustFile: {
      "schedule-g-1": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_schedule_g_1",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
