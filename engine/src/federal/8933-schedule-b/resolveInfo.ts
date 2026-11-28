import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8933ScheduleBFilingInfo } from "./filingInfo.js";

/*
 * Who files: the operator (or designated operator) of a geological disposal site at which captured qualified carbon oxide was injected during the year, not for enhanced oil or natural gas recovery; the operator gives a copy to each owner.
 * The instructions are in the Instructions for Form 8933 (Rev. December 2025, "Schedule B. Disposal Operator Certification"), whose sidecar is irs-8933-inst-2025.
 * The form has no rules yet, and the engine has no fact for a disposal site, so no fact turns it on: only the decision does.
 */
export function resolve8933ScheduleBInfo(inputs: ResolverInputs): Form8933ScheduleBFilingInfo {
  return {
    mustFile: {
      "form-8933-schedule-b": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8933_schedule_b",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
