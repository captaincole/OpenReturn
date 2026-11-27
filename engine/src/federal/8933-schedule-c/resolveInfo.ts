import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8933ScheduleCFilingInfo } from "./filingInfo.js";

/*
 * Who files: the operator (or designated operator) of an enhanced oil or gas recovery project at which captured qualified carbon oxide was injected during the year; the operator gives a copy to each owner.
 * The instructions are in the Instructions for Form 8933 (Rev. December 2025, "Schedule C. Enhanced Oil Recovery Operator Certification"), whose sidecar is irs-8933-inst-2025.
 * The form has no rules yet, and the engine has no fact for an enhanced oil recovery project, so no fact turns it on: only the decision does.
 */
export function resolve8933ScheduleCInfo(inputs: ResolverInputs): Form8933ScheduleCFilingInfo {
  return {
    mustFile: {
      "form-8933-schedule-c": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8933_schedule_c",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}
