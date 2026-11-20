import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { ScheduleFFilingInfo } from "./filingInfo.js";

/*
 * irs-1040sf-inst-2025::sec::general-instructions::b01: a farmer reports farm income and expenses.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolveScheduleFInfo(inputs: ResolverInputs): ScheduleFFilingInfo {
  return {
    mustFile: {
      "schedule-f": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_schedule_f",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
