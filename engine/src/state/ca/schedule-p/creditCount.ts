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
import { FILM_PROGRAMS } from "../3541/lines.js";
import { caFilmCreditCodesClaimed } from "../3541/resolveInfo.js";
import { caPassiveCreditsClaimed } from "../3801-cr/resolveInfo.js";
import { pteCreditFactKeys } from "../3804-cr/resolveInfo.js";
import { otherStateCreditInputs } from "../schedule-s/resolveInfo.js";

export function moreThanTwoCreditsFallback(inputs: ResolverInputs, files540: boolean) {
  const passive = caPassiveCreditsClaimed(inputs);
  const otherState = otherStateCreditInputs(inputs).map((input) => input.factKey);
  const pte = pteCreditFactKeys(inputs);
  // Each FTB 3541 credit code is one credit: the certificates of a code share one line.
  const film = caFilmCreditCodesClaimed(inputs);
  const count =
    passive.codes.length +
    (otherState.length > 0 ? 1 : 0) +
    (pte.length > 0 ? 1 : 0) +
    film.codes.length;
  return {
    rule: `fallback: Form 540 files (${files540}) with ${count} credit(s) from FTB 3801-CR, Schedule S, FTB 3804-CR and FTB 3541, more than two`,
    value: files540 && count > 2,
    triggeredByFactKeys: [...passive.factKeys, ...otherState, ...pte, ...film.factKeys],
    triggeredByDecisionKeys: ["decisions.scope.must_file_ca_540"],
  };
}

/*
 * "You have credits that are reported in Part III, Section A1, Section A2, or
 * Section C" (::b-who-must-file::b01): FTB 3541's original (223) and new
 * (237) credits offset tax in Section A2 (ca-540-sched-p-inst-2025::sec::credit-table::b01, ::b02).
 */
export function filmSectionA2Fallback(inputs: ResolverInputs, files540: boolean) {
  const film = caFilmCreditCodesClaimed(inputs);
  const sectionA2 = film.codes.filter((code) => SECTION_A2_CODES.includes(code));
  return {
    rule: `fallback: Form 540 files (${files540}) with a Section A2 motion picture credit (${sectionA2.join(", ") || "none"})`,
    value: files540 && sectionA2.length > 0,
    triggeredByFactKeys: film.factKeys,
    triggeredByDecisionKeys: ["decisions.scope.must_file_ca_540"],
  };
}

const SECTION_A2_CODES = FILM_PROGRAMS.filter((program) => program.section === "A2").map(
  (program): string => program.code,
);
