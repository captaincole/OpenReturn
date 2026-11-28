import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { ScheduleRCaFilingInfo } from "./filingInfo.js";

/*
 * Who files: "This schedule is used by all taxpayers who are required to apportion business
 * income"; individuals have their own instructions in General Information B
 * (ca-100-sched-r-inst-2025::sec::general-information).
 * The instructions are not in the corpus yet, so no block id is cited.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolveScheduleRCaInfo(inputs: ResolverInputs): ScheduleRCaFilingInfo {
  return {
    mustFile: {
      "schedule-r-ca": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_schedule_r_ca",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
