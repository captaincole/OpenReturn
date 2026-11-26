import { parseLawTarget, printsPath, sectionIdOf } from "../../src/law/citation";
import type { LawHit } from "../../src/law/lawSearch";

/*
 * Pure scoring: the hits of each query merge by best rank, and the top 8
 * count. No model call anywhere in this eval.
 */

export interface LawCase {
  id: string;
  question: string;
  queries: string[];
  /** Code sections that hold the rule; a hit in any of them counts. */
  expect: string[];
  /** The exact subdivision, "469(g)(1)(A)", when one holds the rule. */
  expectPath?: string;
  source: string;
}

export interface CaseScore {
  id: string;
  sectionHit: boolean;
  /** null when the case has no expectPath. */
  pathHit: boolean | null;
  top: string[];
}

export const TOP_K = 8;

/* Each block keeps its best rank over the queries; a tie goes to the earlier query. */
export function mergeByBestRank(lists: LawHit[][]): LawHit[] {
  const best = new Map<string, { hit: LawHit; rank: number; query: number }>();
  lists.forEach((hits, query) =>
    hits.forEach((hit, rank) => {
      const seen = best.get(hit.blockId);
      if (!seen || rank < seen.rank) best.set(hit.blockId, { hit, rank, query });
    }),
  );
  return [...best.values()]
    .sort((left, right) => left.rank - right.rank || left.query - right.query)
    .map((entry) => entry.hit);
}

export function scoreCase(testCase: LawCase, merged: LawHit[], docId: string): CaseScore {
  const top = merged.slice(0, TOP_K);
  const sectionHit = top.some((hit) =>
    testCase.expect.some((section) => inSection(hit, docId, section)),
  );
  const pathHit = testCase.expectPath
    ? top.some((hit) => onPath(hit, docId, testCase.expectPath!))
    : null;
  return { id: testCase.id, sectionHit, pathHit, top: top.map((hit) => hit.citation) };
}

const inSection = (hit: LawHit, docId: string, section: string) =>
  hit.blockId.startsWith(`${sectionIdOf(docId, section)}::`);

/* The hit is the subdivision, sits inside it, or is the parent block that prints it. */
function onPath(hit: LawHit, docId: string, expectPath: string): boolean {
  const expected = parseLawTarget(expectPath);
  const got = parseLawTarget(hit.citation);
  if (expected?.kind !== "citation" || got?.kind !== "citation") return false;
  if (!inSection(hit, docId, expected.section)) return false;
  const shorter = Math.min(expected.path.length, got.path.length);
  const shared = expected.path.slice(0, shorter).every((segment, i) => got.path[i] === segment);
  if (!shared) return false;
  if (got.path.length >= expected.path.length) return true;
  return printsPath(hit.text, expected.path.slice(got.path.length));
}
