/*
 * Labeled by hand against corpus-v8.
 *   tier 1: one rule, one obvious passage. tier 2: a closer read, or two
 *   passages. tier 3: two or more passages, usually federal and California.
 *   false_premise: the question asserts a wrong rule; the answer must state the right one.
 *   insufficient: the right answer says the library cannot support a conclusion.
 *   authority: a run passes a group when it cites (or retrieves) ANY block in it.
 *   facts: each group lists accepted spellings; matching ignores case.
 *   lite: the cases the lite tier runs (each kind in each tier; stable across full runs).
 */

import type { AskCase } from "./caseKit";
import { TIER_1 } from "./tier1";
import { TIER_2 } from "./tier2";
import { TIER_3 } from "./tier3";

export type { AskCase, Kind, Tier } from "./caseKit";

export const CASES: AskCase[] = [...TIER_1, ...TIER_2, ...TIER_3];

export const casesFor = (tier: "lite" | "full"): AskCase[] =>
  tier === "full" ? CASES : CASES.filter((c) => c.lite);
