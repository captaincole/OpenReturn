import {
  EIC_KEYS,
  businessesOnReturn,
  getDependentFacts,
  type DependentFact,
} from "../../facts/index.js";
import { filingStatusOf } from "../../filingInfoResolvers.js";
import {
  missingInputs,
  resolveMustFile,
  sumW2Box,
  text,
  type ResolverInputs,
} from "../../resolverInputs.js";
import type { ScheduleEICFilingInfo } from "./filingInfo.js";
import { eicIncomeLimit } from "./limits.js";
import { isEicQualifyingChild } from "./qualifyingChild.js";

/* Resolvers see no tax year; Schedule 8812 pins its age rules to 2025 the same way. */
const TAX_YEAR = 2025;

/*
 * irs-1040-inst-2025::sec::what-is-the-eic::b01: "If you have at least one child
 * who meets the conditions to be your qualifying child for purposes of claiming
 * the EIC, complete and attach Schedule EIC." The schedule files when a
 * dependent passes isEicQualifyingChild and the EIC is still possible:
 * - W-2 wages under the Step 1 limit for that many children
 *   (irs-1040-inst-2025::sec::all-filers::b01). Earned income is at least the
 *   wages unless a business has a loss, so a return with a business is not
 *   gated. AGI and investment income (Step 2) are form lines, not facts: the
 *   1040's line 27a applies them.
 * - No answer rules the taxpayer out: a nonresident alien who does not file
 *   jointly (irs-1040-inst-2025::sec::no-continue-3::b01), a qualifying child
 *   of another person (irs-1040-inst-2025::sec::yes-continue-no-stop-10::b01),
 *   or an IRS notice that bars the credit.
 * The answers are asked only once the schedule can file. A dependent whose
 * answers are not all in is asked by Schedule 8812 and counts here when they are.
 */
export function resolveScheduleEICInfo(inputs: ResolverInputs): ScheduleEICFilingInfo {
  const taxpayerDob = text(inputs, "identity.dob");
  const children: DependentFact[] = getDependentFacts(inputs.facts).filter(
    (fact) => isEicQualifyingChild(fact.dependent, taxpayerDob, TAX_YEAR) === true,
  );
  const status = filingStatusOf(inputs);
  const joint = status === "married_filing_jointly";
  const hasBusiness = businessesOnReturn(inputs.facts, joint).businesses.length > 0;
  const withSsn = children.filter((child) => child.dependent.ssn !== undefined).length;
  const underLimit = hasBusiness || sumW2Box(inputs, "box1") < eicIncomeLimit(withSsn, joint);
  const possible = children.length > 0 && underLimit;
  const answer = (key: string) => inputs.factByKey.get(key) as boolean | undefined;
  const answers = {
    [EIC_KEYS.nonresidentAlien]: answer(EIC_KEYS.nonresidentAlien),
    [EIC_KEYS.qualifyingChildOfAnother]: answer(EIC_KEYS.qualifyingChildOfAnother),
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
