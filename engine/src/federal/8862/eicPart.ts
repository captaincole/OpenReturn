/*
 * Form 8862 Part II, the earned income credit, from facts. The resolver of
 * Form 8862 and the EIC answers on Form 1040 line 27a both read it: line 27a
 * waits while an answer Part II needs is missing, and is a gap when Part II
 * and the EIC's own answers disagree (credit.ts, earlierDenial).
 */

import { EIC_KEYS, FORM_8862_KEYS, SPOUSE_KEYS, type DependentFact } from "../../facts/index.js";
import { filingStatusOf, text, type ResolverInputs } from "../../resolverInputs.js";
import { eicQualifyingChildren, scheduleEicChildren } from "../schedule-eic/qualifyingChild.js";
import {
  enoughDaysInUs,
  line10Age,
  line7Days,
  monthDayIn,
  TAX_YEAR,
  type MonthDay,
} from "./lines.js";

/* What line 27a needs from Part II once an earlier denial is stated. */
export type Form8862EicCheck =
  | { kind: "not_needed" }
  | { kind: "waiting" }
  | { kind: "conflict"; reason: string }
  | { kind: "complete" };

/* One column of lines 5, 7 and 8: a child Schedule EIC lists. */
export interface EicChildColumn {
  factKey: string;
  name: string;
  days?: number;
  birth?: MonthDay;
  death?: MonthDay;
}

export interface Form8862EicPart {
  /* An earlier EIC denial is stated, no ban, and no exception: Form 8862 claims the EIC. */
  needed: boolean;
  check: Form8862EicCheck;
  /* The answers Part II still waits for. */
  waitingKeys: string[];
  line3?: boolean;
  line4?: boolean;
  /* Section A: the Schedule EIC children; empty in Section B. */
  children: EicChildColumn[];
  sectionB: boolean;
  line9a?: number;
  line9b?: number;
  line10a?: number;
  line10b?: number;
  /* The spouse died during 2025: line 10b takes the age at death, which no fact holds. */
  spouseDiedThisYear: boolean;
  line11a?: boolean;
  line11b?: boolean;
}

const childDaysConflict = (name: string) =>
  `Form 8862 line 7: ${name} lived with you in the United States fewer than 183 days, but the months on the dependent fact make the child a qualifying child for the EIC; the answers disagree.`;
const MAIN_HOME_CONFLICT =
  "Form 8862 line 9: a main home in the United States fewer than 183 days disagrees with the EIC answer that it was there more than half of 2025.";

const NOT_NEEDED: Form8862EicCheck = { kind: "not_needed" };
const WAITING: Form8862EicCheck = { kind: "waiting" };

function childColumn(child: DependentFact): EicChildColumn {
  const { dependent } = child;
  return {
    factKey: child.sourceFact.key,
    name: `${dependent.firstName} ${dependent.lastName}`,
    days: line7Days(dependent, TAX_YEAR),
    birth: monthDayIn(dependent.dob, TAX_YEAR),
    death: monthDayIn(dependent.dateOfDeath, TAX_YEAR),
  };
}

const answer = (inputs: ResolverInputs, key: string) =>
  inputs.factByKey.get(key) as boolean | undefined;
const days = (inputs: ResolverInputs, key: string) =>
  inputs.factByKey.get(key) as number | undefined;

/*
 * Lines 4, 10 and 11 from facts the EIC already reads. A joint return answers
 * "No" on lines 4 and 11: a person who files a joint return that claims the
 * EIC is no one's qualifying child or dependent (the joint return test,
 * line-6::b01 item 4), and the 1040 EIC steps skip both questions for a joint
 * return (QUESTIONS.md).
 */
function statedLines(inputs: ResolverInputs, joint: boolean) {
  const spouseDiedThisYear = text(inputs, SPOUSE_KEYS.yearOfDeath) === String(TAX_YEAR);
  return {
    line4: joint ? false : answer(inputs, EIC_KEYS.qualifyingChildOfAnother),
    line10a: line10Age(text(inputs, "identity.dob"), TAX_YEAR),
    line10b: joint ? line10Age(text(inputs, SPOUSE_KEYS.dob), TAX_YEAR) : undefined,
    spouseDiedThisYear: joint && spouseDiedThisYear,
    line11a: joint ? false : answer(inputs, EIC_KEYS.claimableAsDependent),
    line11b: joint ? false : undefined,
  };
}

/* Section A, line 7: each child's days, or the dependent fact to ask; fewer than 183 is a conflict. */
function sectionAWaits(children: EicChildColumn[]): { keys: string[]; conflict?: string } {
  const keys = children.filter((child) => child.days === undefined).map((child) => child.factKey);
  const short = children.find((child) => child.days !== undefined && !enoughDaysInUs(child.days));
  return { keys, conflict: short === undefined ? undefined : childDaysConflict(short.name) };
}

/* Section B, line 9: the days asked, and a conflict below 183. */
function sectionBWaits(lines: { line9a?: number; line9b?: number }, joint: boolean) {
  const keys: string[] = [];
  if (lines.line9a === undefined) keys.push(FORM_8862_KEYS.daysMainHomeInUs);
  if (joint && lines.line9b === undefined) keys.push(FORM_8862_KEYS.spouseDaysMainHomeInUs);
  const known = [lines.line9a, ...(joint ? [lines.line9b] : [])].filter(
    (each): each is number => each !== undefined,
  );
  return {
    keys,
    conflict: known.some((each) => !enoughDaysInUs(each)) ? MAIN_HOME_CONFLICT : undefined,
  };
}

function sectionWaits(
  part: { sectionB: boolean; children: EicChildColumn[]; line9a?: number; line9b?: number },
  joint: boolean,
) {
  return part.sectionB ? sectionBWaits(part, joint) : sectionAWaits(part.children);
}

function checkOf(keys: string[], conflict: string | undefined): Form8862EicCheck {
  if (conflict !== undefined) return { kind: "conflict", reason: conflict };
  return keys.length > 0 ? { kind: "waiting" } : { kind: "complete" };
}

/*
 * Who files for the EIC (general-instructions::b01–b03): a denial after 1996
 * (EIC_KEYS.deniedInEarlierYear, which leaves out a denial since allowed again
 * on a return with Form 8862), no ban (b03: "Do not file Form 8862 for the 2
 * years ... or 10 years"), and not the exception for a filer with no
 * qualifying child whose earlier EIC was denied only for a child (b03). Line 3
 * "Yes" ends Part II; else Section A for a filer with a qualifying child, or
 * Section B.
 */
export function form8862EicPart(inputs: ResolverInputs): Form8862EicPart {
  const joint = filingStatusOf(inputs) === "married_filing_jointly";
  const { children: qualifying, childrenOpen } = eicQualifyingChildren(inputs);
  const sectionB = qualifying.length === 0;
  const children = sectionB ? [] : scheduleEicChildren(qualifying).map(childColumn);
  const base = {
    line3: answer(inputs, FORM_8862_KEYS.eicOnlyIncomeMisreported),
    children,
    sectionB,
    line9a: sectionB ? days(inputs, FORM_8862_KEYS.daysMainHomeInUs) : undefined,
    line9b: sectionB && joint ? days(inputs, FORM_8862_KEYS.spouseDaysMainHomeInUs) : undefined,
    ...statedLines(inputs, joint),
  };
  const denied =
    answer(inputs, EIC_KEYS.deniedInEarlierYear) === true &&
    answer(inputs, EIC_KEYS.barredByIrs) === false;
  // A dependent whose EIC test is open may still add a child: line 27a waits for it first.
  if (denied && childrenOpen) return { ...base, needed: true, check: WAITING, waitingKeys: [] };
  const onlyForChild = answer(inputs, FORM_8862_KEYS.eicDeniedOnlyForChild);
  if (!denied || (sectionB && onlyForChild === true)) {
    return { ...base, needed: false, check: NOT_NEEDED, waitingKeys: [] };
  }
  const keys: string[] =
    sectionB && onlyForChild === undefined ? [FORM_8862_KEYS.eicDeniedOnlyForChild] : [];
  if (base.line3 === undefined) keys.push(FORM_8862_KEYS.eicOnlyIncomeMisreported);
  // Line 3 "Yes": "do not complete the rest of Part II".
  const waits: { keys: string[]; conflict?: string } =
    base.line3 !== false ? { keys: [] } : sectionWaits(base, joint);
  keys.push(...waits.keys);
  return { ...base, needed: true, check: checkOf(keys, waits.conflict), waitingKeys: keys };
}
