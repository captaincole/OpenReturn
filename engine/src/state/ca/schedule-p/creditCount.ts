/*
 * "Attach it to Form 540 only if any one of the following apply: ... You have
 * more than two credits" (ca-540-sched-p-inst-2025::sec::b-who-must-file::b01).
 * The credits counted here are the Part III credits the engine takes from
 * facts other than the credit for prior year AMT, which attaches the schedule
 * by itself (Section A2): each California passive credit code (FTB 3801-CR),
 * the other state tax credit (Schedule S, one code for every state) and the
 * PTE elective tax credit (FTB 3804-CR). A credit counts when its facts hold
 * an amount above 0; a passive credit that FTB 3801-CR then allows at 0 still
 * attaches the schedule, which the instructions say to complete in any case.
 */

import type { ResolverInputs } from "../../../resolverInputs.js";
import { caPassiveCreditsClaimed } from "../3801-cr/resolveInfo.js";
import { pteCreditFactKeys } from "../3804-cr/resolveInfo.js";
import { otherStateCreditInputs } from "../schedule-s/resolveInfo.js";

export function moreThanTwoCreditsFallback(inputs: ResolverInputs, files540: boolean) {
  const passive = caPassiveCreditsClaimed(inputs);
  const otherState = otherStateCreditInputs(inputs).map((input) => input.factKey);
  const pte = pteCreditFactKeys(inputs);
  const count = passive.codes.length + (otherState.length > 0 ? 1 : 0) + (pte.length > 0 ? 1 : 0);
  return {
    rule: `fallback: Form 540 files (${files540}) with ${count} credit(s) from FTB 3801-CR, Schedule S and FTB 3804-CR, more than two`,
    value: files540 && count > 2,
    triggeredByFactKeys: [...passive.factKeys, ...otherState, ...pte],
    triggeredByDecisionKeys: ["decisions.scope.must_file_ca_540"],
  };
}
