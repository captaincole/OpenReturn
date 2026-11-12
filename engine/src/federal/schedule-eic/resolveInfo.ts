import { EIC_KEYS } from "../../facts/index.js";
import { filingStatusOf } from "../../filingInfoResolvers.js";
import { missingInputs, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { ScheduleEICFilingInfo } from "./filingInfo.js";
import { eicMayApply } from "./possible.js";
import { eicQualifyingChildren } from "./qualifyingChild.js";

/*
 * irs-1040-inst-2025::sec::what-is-the-eic::b01: "If you have at least one child
 * who meets the conditions to be your qualifying child for purposes of claiming
 * the EIC, complete and attach Schedule EIC." The schedule files when a
 * dependent passes isEicQualifyingChild and the EIC is still possible:
 * - The facts do not show Step 1, Step 2 or Step 5 stopping the credit for
 *   the children with valid SSNs (eicMayApply, the same test the line 27a
 *   questions use): AGI, investment income and earned income are bounded
 *   from facts, and line 27a applies the lines themselves.
 * - No answer rules the taxpayer out: a nonresident alien who does not file
 *   jointly (irs-1040-inst-2025::sec::no-continue-3::b01), a qualifying child
 *   of another person (irs-1040-inst-2025::sec::yes-continue-no-stop-10::b01),
 *   which a joint return is not asked (irs-1040-inst-2025::sec::step-2-2::b03),
 *   or an IRS notice that bars the credit.
 * The answers are asked only once the schedule can file. A dependent whose
 * answers are not all in is asked by Schedule 8812 or line 27a (eicQuestions)
 * and counts here when they are.
 */
export function resolveScheduleEICInfo(inputs: ResolverInputs): ScheduleEICFilingInfo {
  const status = filingStatusOf(inputs);
  const joint = status === "married_filing_jointly";
  const { children, withSsn } = eicQualifyingChildren(inputs);
  const possible = children.length > 0 && eicMayApply(inputs, withSsn.length);
  const answer = (key: string) => inputs.factByKey.get(key) as boolean | undefined;
  const answers = {
    [EIC_KEYS.nonresidentAlien]: answer(EIC_KEYS.nonresidentAlien),
    // Step 3, question 2: a joint return skips questions 3–6.
    ...(joint
      ? {}
      : { [EIC_KEYS.qualifyingChildOfAnother]: answer(EIC_KEYS.qualifyingChildOfAnother) }),
    [EIC_KEYS.deniedInEarlierYear]: answer(EIC_KEYS.deniedInEarlierYear),
    [EIC_KEYS.barredByIrs]: answer(EIC_KEYS.barredByIrs),
  };
  const ruledOut =
    (answers[EIC_KEYS.nonresidentAlien] === true && !joint) ||
    answers[EIC_KEYS.qualifyingChildOfAnother] === true ||
    answers[EIC_KEYS.barredByIrs] === true;
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_eic",
    fallbacks: [
      {
        rule: `fallback: ${children.length} qualifying child(ren) for the EIC, wages under the limit, no answer that rules the EIC out`,
        value: possible && !ruledOut,
        triggeredByFactKeys: children.map((child) => child.sourceFact.key),
      },
    ],
  });
  return {
    mustFile: { "schedule-eic": resolution },
    missingInputs: { "schedule-eic": possible ? missingInputs(answers) : [] },
    eicQualifyingChildren: children,
  };
}
