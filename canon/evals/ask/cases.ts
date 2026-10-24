/*
 * The Ask The Tax Code dataset: one question per case, run through the
 * production answer pipeline (workflows/askTurn). Labeled by hand against
 * corpus-v8.
 *
 * Three tiers (tier1.ts, tier2.ts, tier3.ts), each with three kinds of question:
 *   tier 1     one rule, one obvious passage.
 *   tier 2     generally accepted answers that take a closer read, or two
 *              passages (two tables, a rule and its follow-on form).
 *   tier 3     two or more passages, usually federal and California.
 *
 *   standard        answer the question.
 *   false_premise   the question asserts a wrong amount or rule; the
 *                   answer must state the right one.
 *   insufficient    the library cannot support a conclusion. The right
 *                   answer says so ("not_covered", or "partial" when the
 *                   library has only part of what it needs).
 *
 *   coverage   the coverage values that count as right.
 *   authority  citation groups, as in the review eval: a run passes a
 *              group when it cites (or retrieves) ANY block in it.
 *   facts      what the answer must state. Each group is a list of
 *              accepted spellings; matching ignores case.
 */

import type { AskCase } from "./caseKit";
import { TIER_1 } from "./tier1";
import { TIER_2 } from "./tier2";
import { TIER_3 } from "./tier3";

export type { AskCase, Kind, Tier } from "./caseKit";

export const CASES: AskCase[] = [...TIER_1, ...TIER_2, ...TIER_3];
