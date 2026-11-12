/*
 * The earned income credit, Form 1040 line 27a (irs-1040-inst-2025, lines 27a,
 * 27b and 27c): the Steps 1 to 5 tests, Worksheet A or B, and the 2025 EIC
 * Table. Pure functions: the caller passes the return's lines and the answers.
 * The outcome is a credit, no credit (with the line 27c box when the steps say
 * to check it), waiting while an answer is missing, or unsupported (with the
 * reason) for a case the engine does not model.
 */

import eicTable2025 from "../../data/eic-table-2025.json" with { type: "json" };
import type { FilingStatus } from "../../values.js";
import { eicIncomeLimit } from "./limits.js";
import { isYoungerThan } from "./qualifyingChild.js";

// Step 2, question 2: "Is your investment income more than $11,950?"
export const INVESTMENT_INCOME_LIMIT = 11_950;
/*
 * Worksheet A line 4 (Worksheet B line 9): below these, the AGI needs no second
 * table lookup. Index 0: no qualifying children with valid SSNs; 1: one or more.
 */
const AGI_SECOND_LOOKUP = { other: [10_620, 23_350], joint: [17_730, 30_470] } as const;
// Step 4, question 2: "born after December 31, 1960, and before January 2, 2001".
const NO_CHILD_BORN_AFTER = "12/31/1960";
const NO_CHILD_BORN_BEFORE = "01/02/2001";

// Definitions and Special Rules, "Form 8862, who must file" (irs-1040-inst-2025::sec::definitions-and-special-rules-2::b04).
export const FORM_8862_GAP =
  "An EIC reduced or disallowed in an earlier year needs Form 8862, which the engine does not prepare.";
export const SELF_ONLY_EIC_GAP =
  "The self-only EIC for a filer whose qualifying children have no valid SSN (Pub. 596) is not modeled.";
// Step 4, question 1 (irs-1040-inst-2025::sec::filers-without-a-qualifying::b01).
export const MARRIED_HOH_GAP =
  "A married head of household with no qualifying child can't take the EIC, and no fact records whether a head of household is married.";

interface EicTable {
  // [at least, but less than, single/HOH/QSS 0–3 children, married filing jointly 0–3 children]
  rows: number[][];
}

const TABLE = eicTable2025 as EicTable;
const JOINT_COLUMNS_OFFSET = 4;
const FIRST_CREDIT_COLUMN = 2;

/*
 * The 2025 EIC Table (irs-1040-inst-2025::sec::line-9). At or above the
 * Step 1 limit "you can't take the credit": 0. The footnoted rows that straddle
 * a limit carry their footnote's credit for the part below it.
 */
export function eicTableCredit(amount: number, childrenWithSsn: number, joint: boolean): number {
  if (amount >= eicIncomeLimit(childrenWithSsn, joint)) return 0;
  const row = TABLE.rows.find(([atLeast, lessThan]) => amount >= atLeast! && amount < lessThan!);
  if (row === undefined) return 0;
  const column = Math.min(childrenWithSsn, 3) + (joint ? JOINT_COLUMNS_OFFSET : 0);
  return row[FIRST_CREDIT_COLUMN + column]!;
}

/*
 * Worksheet A lines 1–6, which are Worksheet B lines 6–11. 0 when the first
 * lookup is zero ("You can't take the credit. Check the box on … line 27c").
 */
export function worksheetCredit(
  earnedIncome: number,
  agi: number,
  childrenWithSsn: number,
  joint: boolean,
): number {
  const line2 = eicTableCredit(earnedIncome, childrenWithSsn, joint);
  if (line2 === 0 || agi === earnedIncome) return line2;
  const threshold = AGI_SECOND_LOOKUP[joint ? "joint" : "other"][childrenWithSsn === 0 ? 0 : 1];
  if (agi < threshold) return line2;
  return Math.min(eicTableCredit(agi, childrenWithSsn, joint), line2);
}

/** The eligibility answers and counts the resolver gathers from facts. */
export interface EicAnswers {
  /** EIC qualifying children (Schedule EIC), with or without a valid SSN. */
  qualifyingChildren: number;
  /** Qualifying children with a valid SSN: the EIC Table column. */
  childrenWithSsn: number;
  /** A dependent's qualifying-child tests still wait on an answer. */
  childrenOpen: boolean;
  nonresidentAlien?: boolean;
  qualifyingChildOfAnother?: boolean;
  mainHomeInUs?: boolean;
  claimableAsDependent?: boolean;
  deniedInEarlierYear?: boolean;
  barredByIrs?: boolean;
  /** MFS: lived apart from the spouse for the last 6 months, or all year (Step 3, question 4: "No"). */
  livedApartLastSixMonths?: boolean;
  /** MFS: legally separated and apart at the end of 2025 (Step 3, question 5). */
  legallySeparatedApartAtYearEnd?: boolean;
}

/** The return's lines and identity the steps read. */
export interface EicReturn {
  filingStatus?: FilingStatus;
  /** Form 1040 line 11b. */
  agi?: number;
  /** Step 2: lines 2a + 2b + 3b + 7a (a loss on 7a counts as 0). */
  investmentIncome: number;
  /** Step 5 line 5, or Worksheet B line 4b for a self-employed filer. */
  earnedIncome?: number;
  /** The least earnedIncome can be while it waits on the combat pay election. */
  earnedIncomeAtLeast?: number;
  /** Why earnedIncome cannot be figured (an engine gap); undefined when it only waits. */
  earnedIncomeGap?: string;
  /** Step 5, question 2: Worksheet B, whose line 5 checks the box on 27c. */
  worksheetB: boolean;
  taxpayerSsn?: string;
  spouseSsn?: string;
  taxpayerDob?: string;
  spouseDob?: string;
}

export type EicOutcome =
  | { kind: "credit"; amount: number }
  | { kind: "none"; checkLine27c: boolean }
  | { kind: "waiting" }
  | { kind: "unsupported"; reason: string };

const WAITING: EicOutcome = { kind: "waiting" };
const none = (checkLine27c: boolean): EicOutcome => ({ kind: "none", checkLine27c });
const gap = (reason: string): EicOutcome => ({ kind: "unsupported", reason });

/* Undefined when every answer is in and none stops the credit; else the outcome. */
type Step = EicOutcome | undefined;

/* Step 1, questions 1, 2 and 4. Form 2555 is not modeled (no fact kind). */
function step1(ret: EicReturn, answers: EicAnswers, joint: boolean): Step {
  if (ret.agi === undefined) return WAITING;
  // A dependent still open could add a child: only the largest limit decides then.
  const children = answers.childrenOpen ? 3 : answers.childrenWithSsn;
  if (ret.agi >= eicIncomeLimit(children, joint)) return none(false);
  if (answers.childrenOpen) return WAITING;
  if (ret.taxpayerSsn === undefined || (joint && ret.spouseSsn === undefined)) return WAITING;
  if (answers.nonresidentAlien === undefined) return WAITING;
  // "Nonresident aliens": a joint return that treats the spouse as a resident goes on.
  if (answers.nonresidentAlien && !joint) return none(true);
  return undefined;
}

/*
 * Step 2. Form 4797, Schedule E, Form 8814 and passive activities are not
 * modeled, so a filer over the limit stops ("No. STOP") and question 4 is no.
 */
function step2(ret: EicReturn): Step {
  return ret.investmentIncome > INVESTMENT_INCOME_LIMIT ? none(false) : undefined;
}

/*
 * Step 3, questions 4 and 5 for MFS (irs-1040-inst-2025::sec::no-continue-4::b01):
 * living apart the last 6 months skips question 5; else legal separation and
 * living apart at the end of 2025 go on, and "No. STOP" stops the credit.
 */
function separatedSpouse(answers: EicAnswers): Step {
  if (answers.livedApartLastSixMonths === undefined) return WAITING;
  if (answers.livedApartLastSixMonths) return undefined;
  if (answers.legallySeparatedApartAtYearEnd === undefined) return WAITING;
  return answers.legallySeparatedApartAtYearEnd ? undefined : none(false);
}

/* Step 3, questions 2–6, for a filer with a qualifying child. */
function step3(ret: EicReturn, answers: EicAnswers): Step {
  if (answers.childrenWithSsn === 0) return gap(SELF_ONLY_EIC_GAP);
  if (ret.filingStatus === "married_filing_jointly") return undefined;
  if (ret.filingStatus === "married_filing_separately") {
    const stop = separatedSpouse(answers);
    if (stop) return stop;
  }
  // A married head of household lived apart the last 6 months: question 4 is no.
  if (answers.qualifyingChildOfAnother === undefined) return WAITING;
  return answers.qualifyingChildOfAnother ? none(true) : undefined;
}

/* Step 4, question 2: at least age 25 but under 65 at the end of 2025; undefined without a date. */
export function noChildEicAge(dob: string | undefined): boolean | undefined {
  const after = isYoungerThan(dob, NO_CHILD_BORN_AFTER);
  const before = isYoungerThan(NO_CHILD_BORN_BEFORE, dob);
  return after === undefined || before === undefined ? undefined : after && before;
}

/* Step 4, for a filer without a qualifying child. */
function step4(ret: EicReturn, answers: EicAnswers, joint: boolean): Step {
  if (ret.filingStatus === "married_filing_separately") return none(false);
  if (ret.filingStatus === "head_of_household") return gap(MARRIED_HOH_GAP);
  const ages = [noChildEicAge(ret.taxpayerDob), ...(joint ? [noChildEicAge(ret.spouseDob)] : [])];
  if (!ages.includes(true)) return ages.includes(undefined) ? WAITING : none(false);
  if (answers.mainHomeInUs === undefined) return WAITING;
  if (!answers.mainHomeInUs) return none(true);
  if (joint) return undefined;
  if (answers.qualifyingChildOfAnother === undefined) return WAITING;
  if (answers.qualifyingChildOfAnother) return none(true);
  if (answers.claimableAsDependent === undefined) return WAITING;
  return answers.claimableAsDependent ? none(false) : undefined;
}

/* Form 8862 (Definitions and Special Rules): a ban stops the credit; an earlier denial needs the form. */
function earlierDenial(answers: EicAnswers): Step {
  if (answers.barredByIrs === undefined || answers.deniedInEarlierYear === undefined) {
    return WAITING;
  }
  if (answers.barredByIrs) return none(false);
  return answers.deniedInEarlierYear ? gap(FORM_8862_GAP) : undefined;
}

/* Step 5, question 3 or Worksheet B line 5, then Worksheet A or B. */
function step5(ret: EicReturn, answers: EicAnswers, joint: boolean): EicOutcome {
  const earned = ret.earnedIncome;
  if (ret.agi === undefined) return WAITING;
  if (earned === undefined) return ret.earnedIncomeGap ? gap(ret.earnedIncomeGap) : WAITING;
  // Worksheet B: "If line 4b is zero or less, … Check the box on … line 27c."
  if (ret.worksheetB && earned <= 0) return none(true);
  // Only Worksheet B's line 5 says to check the box; Step 5 says "STOP".
  if (earned >= eicIncomeLimit(answers.childrenWithSsn, joint)) return none(ret.worksheetB);
  // Worksheet A line 2: "If line 2 is zero, You can't take the credit. Check the box".
  if (eicTableCredit(earned, answers.childrenWithSsn, joint) === 0) return none(true);
  const credit = worksheetCredit(earned, ret.agi, answers.childrenWithSsn, joint);
  return credit > 0 ? { kind: "credit", amount: credit } : none(false);
}

/*
 * Step 5, question 3 or Worksheet B line 5 stops the credit at the limit
 * whatever the answers are (irs-1040-inst-2025::sec::no-continue-7::b01,
 * ::bworksheet-2025-eic-line-27a::b03), so a step that waits on an answer
 * stops there instead. Only Worksheet B's line 5 checks the box on line 27c.
 */
function earnedIncomeStop(ret: EicReturn, answers: EicAnswers, joint: boolean): Step {
  const earned = ret.earnedIncome ?? ret.earnedIncomeAtLeast;
  if (earned === undefined || ret.agi === undefined) return undefined;
  // A dependent still open could add a child: only the largest limit decides then.
  const children = answers.childrenOpen ? 3 : answers.childrenWithSsn;
  return earned >= eicIncomeLimit(children, joint) ? none(ret.worksheetB) : undefined;
}

/*
 * Line 27a's steps in order; the first that stops, waits or is not modeled
 * decides, and earned income at the limit stops a wait or a gap.
 */
export function earnedIncomeCredit(ret: EicReturn, answers: EicAnswers): EicOutcome {
  const joint = ret.filingStatus === "married_filing_jointly";
  if (ret.filingStatus === undefined) return WAITING;
  const outcome =
    step1(ret, answers, joint) ??
    step2(ret) ??
    (answers.qualifyingChildren > 0 ? step3(ret, answers) : step4(ret, answers, joint)) ??
    earlierDenial(answers) ??
    step5(ret, answers, joint);
  if (outcome.kind === "credit" || outcome.kind === "none") return outcome;
  return earnedIncomeStop(ret, answers, joint) ?? outcome;
}
