import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { ScheduleSFilingInfo } from "./filingInfo.js";

/*
 * ca-540-sched-s-inst-2025::sec::a-purpose::b01: a credit for net income tax paid to another state on income California also taxes.
 * The engine has no fact for tax paid to another state, so no fact turns the form on: only the decision does.
 */
export function resolveScheduleSInfo(inputs: ResolverInputs): ScheduleSFilingInfo {
  return {
    mustFile: {
      "schedule-s": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_schedule_s",
        fallbacks: [
          { rule: "fallback: no fact for income tax paid to another state", value: false },
        ],
      }),
    },
  };
}
