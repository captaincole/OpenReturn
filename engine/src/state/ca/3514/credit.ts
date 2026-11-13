/*
 * The California EITC, FTB 3514 line 20: Steps 1 to 6 of the instructions
 * (ca-3514-inst-2025) and the California Earned Income Tax Credit Worksheet.
 * The outcome is a credit, no credit, waiting while an answer or a line is
 * missing, or unsupported (with the reason) for a case the engine does not
 * model. Form 540 line 75 reads the same outcome, so it can tell "no credit"
 * from "still waiting".
 */

import { numberOrBlank } from "../../../money.js";
import { unsupported } from "../../../types.js";
import { caEitcTableCredit } from "./eitcTable.js";
import type { Form3514FilingInfo } from "./filingInfo.js";
import {
  CA_EITC_INCOME_LIMIT,
  CA_EITC_INVESTMENT_INCOME_LIMIT,
  agiSecondLookupThreshold,
  atLeast18,
} from "./limits.js";
import { investmentIncome, isGap, partIV, type Lines } from "./lines.js";

export type CaCreditOutcome =
  | { kind: "credit"; amount: number }
  | { kind: "none" }
  | { kind: "waiting" }
  | { kind: "unsupported"; reason: string };

export const PART_YEAR_GAP =
  "FTB 3514 for a part-year resident or nonresident (Form 540NR, Steps 7, 9 and 11) is not modeled.";
// The federal EIC has the same gap (federal/schedule-eic/credit.ts).
export const MARRIED_HOH_GAP =
  "A married head of household with no qualifying child can't take the California EITC (Step 1, question d), and no fact records that a head of household is unmarried.";

export const WAITING: CaCreditOutcome = { kind: "waiting" };
export const NONE: CaCreditOutcome = { kind: "none" };
const gap = (reason: string): CaCreditOutcome => ({ kind: "unsupported", reason });

/* A credit's line: the amount, blank for no credit or while it waits, or the gap. */
export const creditLine = (outcome: CaCreditOutcome) => {
  if (outcome.kind === "credit") return outcome.amount;
  return outcome.kind === "unsupported" ? unsupported(outcome.reason) : undefined;
};

/* Undefined when the step passes; else its outcome. */
type Step = CaCreditOutcome | undefined;

/** The qualifying children in the EITC Table column (with a valid SSN or ITIN). */
export const tableChildren = (info: Form3514FilingInfo) => info.caEitcChildren?.length ?? 0;

/*
 * Step 1, question d (::sec::step-1-qualifications-for-all-filers::b01, ::b02):
 * a married filer who files separately or as head of household claims the
 * EITC only with a qualifying child, and only after living apart from the
 * spouse for the last 6 months of 2025, or being legally separated and apart
 * at the end of 2025. A head of household who lived apart is that married
 * filer; with a qualifying child, a head of household meets the rule.
 */
function separatedSpouse(info: Form3514FilingInfo, children: number): Step {
  const answers = info.caEitcAnswers ?? {};
  if (info.filingStatus === "head_of_household") {
    if (children > 0) return undefined;
    return answers.livedApartLastSixMonths === true ? NONE : gap(MARRIED_HOH_GAP);
  }
  if (info.filingStatus !== "married_filing_separately") return undefined;
  if (children === 0) return NONE;
  if (answers.livedApartLastSixMonths === undefined) return WAITING;
  if (answers.livedApartLastSixMonths) return undefined;
  if (answers.legallySeparatedApartAtYearEnd === undefined) return WAITING;
  return answers.legallySeparatedApartAtYearEnd ? undefined : NONE;
}

/*
 * Step 1: a, federal AGI under $32,901; b, an SSN or ITIN for each filer; d,
 * the separated-spouse rule; f, a nonresident alien files jointly; g, Form
 * 540NR is not modeled. Question e (Form 2555) has no fact kind.
 */
function step1(form: Lines, info: Form3514FilingInfo, joint: boolean): Step {
  if (info.caFullYearResident === undefined) return WAITING;
  if (!info.caFullYearResident) return gap(PART_YEAR_GAP);
  const agi = numberOrBlank(form["form-1040.line.11b"]);
  if (agi === undefined) return WAITING;
  if (agi >= CA_EITC_INCOME_LIMIT) return NONE;
  if (info.taxpayerSSN === undefined || (joint && info.spouseSSN === undefined)) return WAITING;
  if (info.caEitcChildrenOpen) return WAITING;
  const separated = separatedSpouse(info, tableChildren(info));
  if (separated) return separated;
  const nonresident = info.caEitcAnswers?.nonresidentAlien;
  if (nonresident === undefined) return WAITING;
  return nonresident && !joint ? NONE : undefined;
}

/* Step 2, Worksheet 1 line 13: "Is the amount on line 12 more than $4,814? Yes Stop here". */
function step2(form: Lines, info: Form3514FilingInfo): Step {
  const amount = investmentIncome(form, info);
  if (isGap(amount)) return gap(amount.reason);
  if (amount === undefined) return WAITING;
  return amount > CA_EITC_INVESTMENT_INCOME_LIMIT ? NONE : undefined;
}

/* Questionnaire f, and Step 4 e: "Could you be a qualifying child of another person"; a joint return skips it. */
function qualifyingChildOfAnother(info: Form3514FilingInfo, joint: boolean): Step {
  if (joint) return undefined;
  const answer = info.caEitcAnswers?.qualifyingChildOfAnother;
  if (answer === undefined) return WAITING;
  return answer ? NONE : undefined;
}

/*
 * Step 4, without a qualifying child (::sec::step-4-filer-without-a-qualifying-child::b01,
 * ::b02): b, a filer (or either spouse on a joint return) at least 18; c, the
 * main home in California more than half of 2025, which a full-year resident
 * meets; e, not a qualifying child of another person; f, not claimable as a
 * dependent. Question a is Step 1's.
 */
function step4(info: Form3514FilingInfo, joint: boolean): Step {
  const ages = [
    atLeast18(info.taxpayerDateOfBirth),
    ...(joint ? [atLeast18(info.spouseDateOfBirth)] : []),
  ];
  if (!ages.includes(true)) return ages.includes(undefined) ? WAITING : NONE;
  const childOfAnother = qualifyingChildOfAnother(info, joint);
  if (childOfAnother || joint) return childOfAnother;
  const dependent = info.caEitcAnswers?.claimableAsDependent;
  if (dependent === undefined) return WAITING;
  return dependent ? NONE : undefined;
}

/*
 * Step 6, the worksheet (::sec::california-earned-income-tax-credit-worksheet::b01,
 * ::part-ii-filers-who-answered-no-on-line-4::b01): line 2 looks up line 19;
 * zero stops. When federal AGI differs from line 19 and is at or over the
 * Part II amount for the children, line 5 looks up the AGI and line 6 is the
 * smaller of lines 2 and 5.
 */
export function worksheetCredit(earned: number, agi: number, children: number): number {
  const line2 = caEitcTableCredit(earned, children);
  if (line2 === 0 || agi === earned || agi < agiSecondLookupThreshold(children)) return line2;
  return Math.min(caEitcTableCredit(agi, children), line2);
}

/* Step 5 and Step 6: line 19 at zero or less stops the EITC (::sec::part-iii-your-earned-income-tax-credit::b01). */
function step6(form: Lines, info: Form3514FilingInfo): CaCreditOutcome {
  const lines = partIV(form, info);
  if (isGap(lines)) return gap(lines.reason);
  const agi = numberOrBlank(form["form-1040.line.11b"]);
  if (lines === undefined || agi === undefined) return WAITING;
  if (lines.line19 <= 0) return NONE;
  const credit = worksheetCredit(lines.line19, agi, tableChildren(info));
  return credit > 0 ? { kind: "credit", amount: credit } : NONE;
}

/* The steps in order; the first that stops, waits or is not modeled decides. */
export function caEitcOutcome(form: Lines, info: Form3514FilingInfo): CaCreditOutcome {
  if (info.filingStatus === undefined) return WAITING;
  const joint = info.filingStatus === "married_filing_jointly";
  const children = tableChildren(info);
  return (
    step1(form, info, joint) ??
    step2(form, info) ??
    (children > 0 ? qualifyingChildOfAnother(info, joint) : step4(info, joint)) ??
    step6(form, info)
  );
}
