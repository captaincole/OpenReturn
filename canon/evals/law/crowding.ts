import type { LawHit } from "../../src/law/lawSearch";
import type { CaseScore } from "./score";

/*
 * How much the regulations crowd the statute: each Code case's top 8 on the
 * statute alone against its top 8 on the whole library. Pure.
 */

export interface CasePair {
  filtered: LawHit[];
  whole: LawHit[];
  filteredScore: CaseScore;
  wholeScore: CaseScore;
}

export interface CrowdingRun {
  mode: string;
  cases: number;
  /** Statute hits in the statute-only top 8, over all cases. */
  statuteHits: number;
  /** Of those, the ones not in the whole library's top 8. */
  crowdedOut: number;
  /** Regulation hits in the whole library's top 8, over all cases. */
  regulationHits: number;
  /** Cases whose expected section, or path, the statute-only search found and the whole search did not. */
  lostSection: string[];
  lostPath: string[];
}

export function crowdingOf(mode: string, pairs: CasePair[]): CrowdingRun {
  let statuteHits = 0;
  let crowdedOut = 0;
  let regulationHits = 0;
  for (const pair of pairs) {
    const kept = new Set(pair.whole.map((hit) => hit.blockId));
    statuteHits += pair.filtered.length;
    crowdedOut += pair.filtered.filter((hit) => !kept.has(hit.blockId)).length;
    regulationHits += pair.whole.filter((hit) => hit.source === "regulations").length;
  }
  const lost = (hit: (score: CaseScore) => boolean | null) =>
    pairs
      .filter((pair) => hit(pair.filteredScore) === true && hit(pair.wholeScore) === false)
      .map((pair) => pair.filteredScore.id);
  return {
    mode,
    cases: pairs.length,
    statuteHits,
    crowdedOut,
    regulationHits,
    lostSection: lost((score) => score.sectionHit),
    lostPath: lost((score) => score.pathHit),
  };
}
