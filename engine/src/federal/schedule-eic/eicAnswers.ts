/*
 * What Form 1040 line 27a reads from facts: the EIC answers (eic.* keys), the
 * qualifying-child counts, and whether the filer is self-employed (Step 5,
 * question 2). eicQuestions lists the answers to ask, only while the EIC is
 * still possible, so a filer over the income limit is never asked.
 */

import {
  EIC_KEYS,
  SPOUSE_KEYS,
  businessesOnReturn,
  isW2FactKey,
  type W2FactValue,
} from "../../facts/index.js";
import { filingStatusOf } from "../../filingInfoResolvers.js";
import { factsInCategory, sumW2Box, text, type ResolverInputs } from "../../resolverInputs.js";
import { netProfit } from "../schedule-c/lines.js";
import { noChildEicAge, type EicAnswers } from "./credit.js";
import { eicIncomeLimit } from "./limits.js";
import { eicQualifyingChildren } from "./qualifyingChild.js";

export interface EicLineInfo extends EicAnswers {
  /** A business on the return: Step 5, question 2 sends the filer to Worksheet B. */
  selfEmployed: boolean;
  /** A W-2 with box 13 "Statutory employee" checked: Worksheet B Part 3, not modeled. */
  statutoryEmployee: boolean;
  /** The dependent facts whose qualifying-child test waits on an answer. */
  openDependentKeys: string[];
}

/** Line 27a's slot, filled by the 1040 resolver; Schedule 8812 line 24 reads it too. */
export interface EicLineSlot {
  earnedIncomeCredit?: EicLineInfo;
}

const answer = (inputs: ResolverInputs, key: string) =>
  inputs.factByKey.get(key) as boolean | undefined;

export function resolveEicLineInfo(inputs: ResolverInputs): EicLineInfo {
  const joint = filingStatusOf(inputs) === "married_filing_jointly";
  const { children, withSsn, open, childrenOpen } = eicQualifyingChildren(inputs);
  const w2s = factsInCategory(inputs, "wages")
    .filter((row) => isW2FactKey(row.key))
    .map((row) => row.value as W2FactValue);
  return {
    qualifyingChildren: children.length,
    childrenWithSsn: withSsn.length,
    childrenOpen,
    nonresidentAlien: answer(inputs, EIC_KEYS.nonresidentAlien),
    qualifyingChildOfAnother: answer(inputs, EIC_KEYS.qualifyingChildOfAnother),
    mainHomeInUs: answer(inputs, EIC_KEYS.mainHomeInUs),
    claimableAsDependent: answer(inputs, EIC_KEYS.claimableAsDependent),
    deniedInEarlierYear: answer(inputs, EIC_KEYS.deniedInEarlierYear),
    barredByIrs: answer(inputs, EIC_KEYS.barredByIrs),
    // Living apart all year covers the last 6 months; the 1040 then skips that question.
    livedApartLastSixMonths:
      answer(inputs, SPOUSE_KEYS.livedApartAllYear) === true
        ? true
        : answer(inputs, SPOUSE_KEYS.livedApartLastSixMonths),
    legallySeparatedApartAtYearEnd: answer(inputs, SPOUSE_KEYS.legallySeparatedApartAtYearEnd),
    selfEmployed: businessesOnReturn(inputs.facts, joint).businesses.length > 0,
    statutoryEmployee: w2s.some((w2) => w2.box13?.statutoryEmployee === true),
    openDependentKeys: open.map((dependent) => dependent.sourceFact.key),
  };
}

/*
 * Earned income can be under the Step 1 limit: W-2 box 1 is under it, or a
 * business may have a loss. With no loss, Worksheet B line 1e is 0 or more,
 * so earned income is at least the wages, and Worksheet B line 5 (or Step 5)
 * stops the credit at the limit
 * (irs-1040-inst-2025::sec::bworksheet-2025-eic-line-27a::b03).
 */
export function earnedIncomeMayBeUnderLimit(
  inputs: ResolverInputs,
  children: number,
  joint: boolean,
): boolean {
  if (sumW2Box(inputs, "box1") < eicIncomeLimit(children, joint)) return true;
  const { businesses, malformedKeys } = businessesOnReturn(inputs.facts, joint);
  const onReturn = businesses.map((business) => business.value);
  return (
    malformedKeys.length > 0 ||
    businesses.some((business) => netProfit(business.value, onReturn) === undefined)
  );
}

/* Step 4, question 2 for the taxpayer, or either spouse on a joint return; false while a date is missing. */
function noChildAgeInRange(inputs: ResolverInputs, joint: boolean): boolean {
  const dobs = [text(inputs, "identity.dob"), ...(joint ? [text(inputs, SPOUSE_KEYS.dob)] : [])];
  return dobs.some((dob) => noChildEicAge(dob) === true);
}

/*
 * Step 3, questions 4 and 5 for MFS (irs-1040-inst-2025::sec::no-continue-4::b01):
 * the 1040 page 1 asks the same two keys, so Cade asks them once.
 */
function separatedSpouseQuestions(info: EicLineInfo): Record<string, unknown> {
  return {
    [SPOUSE_KEYS.livedApartLastSixMonths]: info.livedApartLastSixMonths,
    ...(info.livedApartLastSixMonths === false
      ? { [SPOUSE_KEYS.legallySeparatedApartAtYearEnd]: info.legallySeparatedApartAtYearEnd }
      : {}),
  };
}

// Step 1, question 1: three or more children set the largest limit.
const MOST_CHILDREN = 3;

/* Earned income can be under the limit for that many children; no wages and no business is none. */
function earnsUnderLimit(inputs: ResolverInputs, info: EicLineInfo, children: number): boolean {
  const joint = filingStatusOf(inputs) === "married_filing_jointly";
  return (
    (info.selfEmployed || sumW2Box(inputs, "box1") > 0) &&
    earnedIncomeMayBeUnderLimit(inputs, children, joint)
  );
}

/*
 * A dependent whose qualifying-child test waits on its residency, student or
 * disability answer holds Step 1 while the largest limit can be met. Schedule
 * 8812 asks only the answers its own credits need, so line 27a asks again.
 */
function openDependentQuestions(
  inputs: ResolverInputs,
  info: EicLineInfo,
): Record<string, unknown> {
  if (!info.childrenOpen || !earnsUnderLimit(inputs, info, MOST_CHILDREN)) return {};
  return Object.fromEntries(info.openDependentKeys.map((key) => [key, undefined]));
}

/*
 * The no-child answers (Step 1 question 4, Step 4 questions 3, 5 and 6,
 * Form 8862) for a filer whose earned income can be under the Step 1 limit,
 * with the right filing status and age. A filer with a qualifying child is
 * asked by Schedule EIC's resolver; an MFS filer with one is asked Step 3's
 * questions 4 and 5. A head of household without one is not asked: Step 4,
 * question 1 stops the credit or is a gap.
 */
function answerQuestions(inputs: ResolverInputs, info: EicLineInfo): Record<string, unknown> {
  const status = filingStatusOf(inputs);
  const joint = status === "married_filing_jointly";
  if (info.qualifyingChildren > 0) {
    return status === "married_filing_separately" &&
      earnsUnderLimit(inputs, info, info.childrenWithSsn)
      ? separatedSpouseQuestions(info)
      : {};
  }
  const possible =
    !info.childrenOpen &&
    (status === "single" || status === "qualifying_surviving_spouse" || joint) &&
    earnsUnderLimit(inputs, info, 0) &&
    noChildAgeInRange(inputs, joint);
  if (!possible) return {};
  return {
    [EIC_KEYS.nonresidentAlien]: info.nonresidentAlien,
    [EIC_KEYS.mainHomeInUs]: info.mainHomeInUs,
    ...(joint
      ? {}
      : {
          [EIC_KEYS.qualifyingChildOfAnother]: info.qualifyingChildOfAnother,
          [EIC_KEYS.claimableAsDependent]: info.claimableAsDependent,
        }),
    [EIC_KEYS.deniedInEarlierYear]: info.deniedInEarlierYear,
    [EIC_KEYS.barredByIrs]: info.barredByIrs,
  };
}

/* The EIC answers line 27a waits on, asked only while the EIC is still possible. */
export function eicQuestions(inputs: ResolverInputs, info: EicLineInfo): Record<string, unknown> {
  return { ...openDependentQuestions(inputs, info), ...answerQuestions(inputs, info) };
}
