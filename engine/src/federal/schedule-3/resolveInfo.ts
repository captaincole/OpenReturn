import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { resolve2441Info } from "../2441/resolveInfo.js";
import { resolve5695Info } from "../5695/resolveInfo.js";
import { resolveScheduleRInfo } from "../schedule-r/resolveInfo.js";
import type { Schedule3FilingInfo } from "./filingInfo.js";

export function resolveSchedule3Info(inputs: ResolverInputs): Schedule3FilingInfo {
  const form5695 = resolve5695Info(inputs).mustFile?.["form-5695"]?.value === true;
  const form2441 = resolve2441Info(inputs).mustFile?.["form-2441"]?.value === true;
  const scheduleR = resolveScheduleRInfo(inputs).mustFile?.["schedule-r"]?.value === true;
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_3",
    fallbacks: [
      { rule: "fallback: Form 5695 (line 5b) is required", value: form5695 },
      { rule: "fallback: Form 2441 (line 2) is required", value: form2441 },
      { rule: "fallback: Schedule R (line 6d) is required", value: scheduleR },
    ],
  });
  return { mustFile: { "schedule-3": resolution } };
}
