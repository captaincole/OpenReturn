import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { ScheduleD540NRFilingInfo } from "./filingInfo.js";

/*
 * Who files: a nonresident or part-year resident whose California capital gain or loss differs from the federal amount.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolveScheduleD540NRInfo(inputs: ResolverInputs): ScheduleD540NRFilingInfo {
  return {
    mustFile: {
      "schedule-d-540nr": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_schedule_d_540nr",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
