import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { resolve5695Info } from "../5695/resolveInfo.js";
import type { Schedule3FilingInfo } from "./filingInfo.js";

export function resolveSchedule3Info(inputs: ResolverInputs): Schedule3FilingInfo {
  const form5695 = resolve5695Info(inputs).mustFile?.["form-5695"]?.value === true;
  const r = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_3",
    fallbacks: [{ rule: "fallback: Form 5695 (line 5b) is required", value: form5695 }],
  });
  return { mustFile: { "schedule-3": r } };
}
