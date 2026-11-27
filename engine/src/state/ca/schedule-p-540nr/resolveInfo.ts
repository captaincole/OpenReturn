import { CA_AMT_CALIFORNIA_KEYS } from "../../../facts/index.js";
import { resolveIsoSpread } from "../../../isoSpread.js";
import {
  missingInputs,
  num,
  resolveMustFile,
  type ResolverInputs,
} from "../../../resolverInputs.js";
import { asFullYearResident } from "../540nr/californiaForms.js";
import { files540NR } from "../540nr/mustFile.js";
import { resolveSchedulePInfo } from "../schedule-p/resolveInfo.js";
import type { ScheduleP540NRFilingInfo } from "./filingInfo.js";

export const MUST_FILE_SCHEDULE_P_540NR_KEY = "decisions.scope.must_file_schedule_p_540nr";
const RESIDENT_KEY = "decisions.scope.must_file_schedule_p";

/*
 * Schedule P (540) on the same answers, as a full-year resident would file
 * it. Its own decision is left out: on this return only the Form 540NR key
 * decides, and the resident's tests (facts) run as they are.
 */
function residentScheduleP(inputs: ResolverInputs) {
  const resident = asFullYearResident(inputs);
  const decisionByKey = new Map(resident.decisionByKey);
  decisionByKey.delete(RESIDENT_KEY);
  return resolveSchedulePInfo({ ...resident, decisionByKey });
}

/*
 * Who files: "Complete Schedule P (540NR) to see if AMT applies to you.
 * Attach it to your Form 540NR only if" there is AMT, more than two credits, a
 * credit of Section A1, A2 or C, or adjustments on Part I lines 4 or 7 to 13l
 * with AMTI over the exemption (ca-540nr-sched-p-inst-2025::sec::b-who-must-file::b01).
 * These are Schedule P (540)'s tests (ca-540-sched-p-inst-2025::sec::b-who-must-file::b01),
 * so the schedule files when Form 540NR files and Schedule P (540) would file
 * for the same answers on a Form 540: an ISO exercise or itemized deductions
 * (line 45 then says whether AMT is owed), a credit for prior year AMT, a
 * Section A1 or A2 credit, or more than two credits (schedule-p/resolveInfo.ts).
 * The explicit decision decides first.
 *
 * Line 29d needs the California part of the ISO spread (CA_AMT_CALIFORNIA_KEYS):
 * a missing answer while Part I line 10 holds a spread, never 0.
 */
export function resolveScheduleP540NRInfo(inputs: ResolverInputs): ScheduleP540NRFilingInfo {
  const resident = residentScheduleP(inputs);
  const residentResolution = resident.mustFile?.["schedule-p"];
  const filesNR = files540NR(inputs);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_SCHEDULE_P_540NR_KEY,
    fallbacks: [
      {
        rule: `fallback: Form 540NR files (${filesNR}) and Schedule P (540) would file on the same answers (${residentResolution?.derivation?.rule ?? "no"})`,
        value: filesNR && residentResolution?.value === true,
        triggeredByFactKeys: residentResolution?.derivation?.triggeredByFactKeys ?? [],
        triggeredByDecisionKeys: [
          "decisions.scope.must_file_540nr",
          ...(residentResolution?.derivation?.triggeredByDecisionKeys ?? []),
        ],
      },
    ],
  });
  const files = resolution.value === true;
  const iso = resolveIsoSpread(inputs);
  const isoCaliforniaSpread = num(inputs, CA_AMT_CALIFORNIA_KEYS.isoExerciseSpread);
  const asksIsoCaliforniaPart = files && !iso.soldInYear && (iso.spread ?? 0) > 0;
  return {
    mustFile: { "schedule-p-540nr": resolution },
    missingInputs: {
      "schedule-p-540nr": files
        ? [
            ...(resident.missingInputs?.["schedule-p"] ?? []),
            ...(asksIsoCaliforniaPart
              ? missingInputs({ [CA_AMT_CALIFORNIA_KEYS.isoExerciseSpread]: isoCaliforniaSpread })
              : []),
          ]
        : [],
    },
    isoCaliforniaSpread,
  };
}
