import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { ScheduleP540NRFilingInfo } from "./filingInfo.js";

/*
 * Who files: a nonresident or part-year resident who owes minimum tax or has credits that the tentative minimum tax limits.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolveScheduleP540NRInfo(inputs: ResolverInputs): ScheduleP540NRFilingInfo {
  return {
    mustFile: {
      "schedule-p-540nr": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_schedule_p_540nr",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
