import { EIC_KEYS, SPOUSE_KEYS, getDependentFacts, type DependentFact } from "../../facts/index.js";
import { filingStatusOf } from "../../filingInfoResolvers.js";
import { missingInputs, resolveMustFile, text, type ResolverInputs } from "../../resolverInputs.js";
import { earnedIncomeMayBeUnderLimit } from "./eicAnswers.js";
import type { ScheduleEICFilingInfo } from "./filingInfo.js";
import { isEicQualifyingChild } from "./qualifyingChild.js";

/* Resolvers see no tax year; Schedule 8812 pins its age rules to 2025 the same way. */
const TAX_YEAR = 2025;

/*
 * irs-1040-inst-2025::sec::what-is-the-eic::b01: "If you have at least one child
 * who meets the conditions to be your qualifying child for purposes of claiming
 * the EIC, complete and attach Schedule EIC." The schedule files when a
 * dependent passes isEicQualifyingChild and the EIC is still possible:
 * - Earned income can be under the Step 1 limit for that many children
 *   (irs-1040-inst-2025::sec::all-filers::b01): W-2 wages under it, or a
 *   business that may have a loss (earnedIncomeMayBeUnderLimit). AGI and
 *   investment income (Step 2) are form lines, not facts: the 1040's line 27a
 *   applies them.
 * - No answer rules the taxpayer out: a nonresident alien who does not file
 *   jointly (irs-1040-inst-2025::sec::no-continue-3::b01), a qualifying child
 *   of another person (irs-1040-inst-2025::sec::yes-continue-no-stop-10::b01),
 *   which a joint return is not asked (irs-1040-inst-2025::sec::step-2-2::b03),
 *   or an IRS notice that bars the credit.
 * The answers are asked only once the schedule can file. A dependent whose
 * answers are not all in is asked by Schedule 8812 and counts here when they are.
 */
export function resolveScheduleEICInfo(inputs: ResolverInputs): ScheduleEICFilingInfo {
  const status = filingStatusOf(inputs);
  const joint = status === "married_filing_jointly";
  const filerDobs = [
    text(inputs, "identity.dob"),
    ...(joint ? [text(inputs, SPOUSE_KEYS.dob)] : []),
  ];
  const children: DependentFact[] = getDependentFacts(inputs.facts).filter(
    (fact) => isEicQualifyingChild(fact.dependent, filerDobs, TAX_YEAR) === true,
  );
  const withSsn = children.filter((child) => child.dependent.ssn !== undefined).length;
  const possible = children.length > 0 && earnedIncomeMayBeUnderLimit(inputs, withSsn, joint);
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
