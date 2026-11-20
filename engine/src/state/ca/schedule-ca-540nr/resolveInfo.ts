import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { ScheduleCa540NRFilingInfo } from "./filingInfo.js";

/*
 * ca-540nr-sched-ca-inst-2025::sec::purpose::b01: the schedule gives California taxable income for Form 540NR.
 * It follows Form 540NR, which no rule turns on yet, so no fact turns the form on: only the decision does.
 */
export function resolveScheduleCa540NRInfo(inputs: ResolverInputs): ScheduleCa540NRFilingInfo {
  return {
    mustFile: {
      "schedule-ca-540nr": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_schedule_ca_540nr",
        fallbacks: [
          { rule: "fallback: follows Form 540NR, which no rule turns on yet", value: false },
        ],
      }),
    },
  };
}
