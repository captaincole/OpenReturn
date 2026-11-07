import { AMT_KEYS } from "../../../facts/index.js";
import { num, resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { SchedulePFilingInfo } from "./filingInfo.js";

/*
 * ca-540-sched-p-inst-2025::sec::b-who-must-file::b01: complete Schedule P (540)
 * to see if AMT applies; attach it when AMT is owed, when there are more than two
 * credits, or when there are adjustments on Part I lines 4 or 7–13 with AMTI over
 * the exemption. The engine completes the schedule when a stated preference
 * exists (the incentive stock option spread, line 10) or the return itemizes (the
 * Part I add-backs then come from Schedule CA): line 26 says whether AMT is owed.
 * A filer with neither has no adjustment the engine knows, so the schedule is not
 * completed; the other preferences (depreciation, passive activities, K-1 items)
 * have no facts yet. The 540 instructions' Box C (CA AGI over the exemption
 * phase-out start, ca-540-inst-2025::sec::box-c::b01) is left out: with the
 * standard deduction and no adjustment, AMTI equals CA AGI and 7% of it less the
 * exemption never exceeds the regular tax, and Part III credits are not modeled.
 */
export function resolveSchedulePInfo(inputs: ResolverInputs): SchedulePFilingInfo {
  const isoExerciseSpread = num(inputs, AMT_KEYS.isoExerciseSpread);
  const itemizes = inputs.decisionByKey.get("decisions.itemize_vs_standard") === "itemized";
  const files540 = inputs.decisionByKey.get("decisions.scope.must_file_ca_540") === true;
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_p",
    fallbacks: [
      {
        rule: `fallback: Form 540 files (${files540}) with an ISO spread of $${isoExerciseSpread ?? 0} or itemized deductions (${itemizes})`,
        value: files540 && ((isoExerciseSpread ?? 0) > 0 || itemizes),
        triggeredByFactKeys: [AMT_KEYS.isoExerciseSpread],
        triggeredByDecisionKeys: [
          "decisions.scope.must_file_ca_540",
          "decisions.itemize_vs_standard",
        ],
      },
    ],
  });
  return {
    mustFile: { "schedule-p": resolution },
    isoExerciseSpread,
  };
}
