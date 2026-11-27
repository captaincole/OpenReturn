import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { ScheduleJFilingInfo } from "./filingInfo.js";

/*
 * Who files: an individual with income from farming or fishing who elects to figure the 2025 income tax by averaging all or part of that income over the 3 base years (irs-1040sj-inst-2025::sec::what-s-new::b01, under General Instructions).
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolveScheduleJInfo(inputs: ResolverInputs): ScheduleJFilingInfo {
  return {
    mustFile: {
      "schedule-j": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_schedule_j",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
